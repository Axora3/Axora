import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase/server";
import {
  DashboardConnection,
  FactoryConnection,
  VerifiedPaymentProvider,
} from "./connections";
import { IntegrationError, type Site, type Task } from "./contracts";
import { safeCode } from "./security";
export function checked<T>(result: {
  data: T;
  error: { code?: string; message?: string } | null;
}) {
  if (result.error) {
    if (
      result.error.code === "P0001" &&
      /^[a-z_]{3,80}$/.test(result.error.message || "")
    )
      throw new IntegrationError(result.error.message!, 409);
    throw new IntegrationError(
      result.error.code === "42P01" || result.error.code === "PGRST202"
        ? "ecosystem_migration_required"
        : "ecosystem_database_error",
      503,
    );
  }
  return result.data;
}
export class EcosystemProcessor {
  constructor(
    private db: SupabaseClient = adminClient(),
    private factory = new FactoryConnection(),
    private dashboard = new DashboardConnection(),
    private payment = new VerifiedPaymentProvider(),
  ) {}
  async one() {
    const owner = randomUUID();
    const claimed = checked(
      await this.db.rpc("ecosystem_claim", { p_owner: owner }),
    ) as Task[];
    const task = claimed?.[0];
    if (!task) return { processed: false };
    try {
      const site = checked(
        await this.db
          .from("ecosystem_sites")
          .select("*")
          .eq("id", task.site_id)
          .single(),
      ) as Site;
      if (!site) throw new IntegrationError("site_not_found", 404);
      let receipt: unknown;
      if (
        task.payload._requirements_version !== undefined &&
        Number(task.payload._requirements_version) !==
          site.requirements_version &&
        ["factory_submit", "factory_generate"].includes(task.kind)
      )
        throw new IntegrationError("outdated_requirements_task", 409);
      if (task.kind === "factory_submit")
        receipt = await this.factory.submit(site, task.request_key);
      else if (task.kind === "factory_poll")
        receipt = await this.factory.poll(site);
      else if (
        ["factory_generate", "factory_approve", "factory_confirm"].includes(
          task.kind,
        )
      )
        receipt = await this.factory.action(
          site,
          task.kind,
          task.payload,
          task.request_key,
        );
      else if (task.kind === "dashboard_health")
        receipt = await this.dashboard.health(site);
      else if (
        ["dashboard_prepare", "dashboard_access", "sheets_retry"].includes(
          task.kind,
        )
      ) {
        const customer = checked(
          await this.db
            .from("ecosystem_customers")
            .select("email,name")
            .eq("id", site.customer_id)
            .single(),
        ) as Record<string, unknown>;
        receipt =
          task.kind === "dashboard_access"
            ? await this.dashboard.access(site, customer, task.request_key)
            : await this.dashboard.prepare(
                site,
                customer,
                task.request_key,
                task.kind === "sheets_retry",
              );
      } else if (task.kind === "invoice_create") {
        const invoice = checked(
          await this.db
            .from("ecosystem_invoices")
            .select("id,site_id,amount,currency")
            .eq("id", task.payload.invoiceId)
            .eq("site_id", site.id)
            .single(),
        );
        if (!invoice) throw new IntegrationError("invoice_not_found", 404);
        receipt = await this.payment.create(invoice, task.request_key);
      } else if (task.kind === "policy_sync")
        receipt = await this.dashboard.policy(
          site,
          task.payload,
          task.request_key,
        );
      else throw new IntegrationError("unknown_integration_task", 409);
      checked(
        await this.db.rpc("ecosystem_finish", {
          p_task: task.id,
          p_owner: owner,
          p_receipt: receipt,
          p_error: null,
          p_retry: false,
        }),
      );
      return { processed: true, status: "completed", taskId: task.id };
    } catch (error) {
      const code = safeCode(error);
      checked(
        await this.db.rpc("ecosystem_finish", {
          p_task: task.id,
          p_owner: owner,
          p_receipt: {},
          p_error: code,
          p_retry: error instanceof IntegrationError && error.retryable,
        }),
      );
      return {
        processed: true,
        status: "blocked_or_retrying",
        taskId: task.id,
        code,
      };
    }
  }
  async tick() {
    checked(await this.db.rpc("ecosystem_tick"));
    return this.one();
  }
}
