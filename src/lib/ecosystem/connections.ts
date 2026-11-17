import "server-only";
import { z } from "zod";
import {
  AccessReceipt,
  FactoryOrder,
  FactoryProject,
  IntegrationError,
  ProvisionReceipt,
  VerifiedPayment,
  type Site,
} from "./contracts";
import { endpoint, readResponse, safeCode, assertNoSecrets } from "./security";
export class ServiceHttp {
  constructor(private transport: typeof fetch = fetch) {}
  async call(
    service: "factory" | "dashboard" | "payment",
    path: string,
    method = "GET",
    body?: unknown,
    key?: string,
  ) {
    if (service === "factory" && body !== undefined) assertNoSecrets(body);
    const names = {
      factory: ["AXORA_FACTORY_URL", "AXORA_FACTORY_ADMIN_TOKEN"],
      dashboard: ["AXORA_DASHBOARD_URL", "AXORA_DASHBOARD_SERVICE_TOKEN"],
      payment: ["AXORA_PAYMENT_API_URL", "AXORA_PAYMENT_API_TOKEN"],
    } as const;
    const [urlEnv, tokenEnv] = names[service];
    const token = process.env[tokenEnv];
    if (!token || token.length < 32)
      throw new IntegrationError(service + "_unconfigured");
    let response: Response;
    try {
      response = await this.transport(endpoint(urlEnv) + path, {
        method,
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(key ? { "Idempotency-Key": key } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(25000),
      });
    } catch {
      throw new IntegrationError(service + "_outcome_uncertain");
    }
    if (response.status === 404 || response.status === 501)
      throw new IntegrationError(service + "_contract_unavailable");
    if (!response.ok)
      throw new IntegrationError(
        service + "_http_" + response.status,
        503,
        response.status === 429 || response.status >= 500,
      );
    return readResponse(response, 4000000);
  }
}
export class FactoryConnection {
  constructor(private http = new ServiceHttp()) {}
  async options(site: Site) {
    if (!site.factory_order_id)
      throw new IntegrationError("factory_order_not_linked", 409);
    const result = z
      .object({
        spec: z.unknown().nullable(),
        missing: z.array(z.unknown()),
        matches: z.array(z.unknown()),
        templates: z.array(z.unknown()).optional(),
      })
      .passthrough()
      .parse(
        await this.http.call(
          "factory",
          "/api/orders/" +
            encodeURIComponent(site.factory_order_id) +
            "/options",
        ),
      );
    if (
      result.spec &&
      typeof result.spec === "object" &&
      "answers" in result.spec
    ) {
      const a = (result.spec as { answers: { siteId?: string } }).answers;
      if (a.siteId !== site.id)
        throw new IntegrationError("factory_site_binding_invalid", 409);
    }
    return result;
  }
  async submit(site: Site, key: string) {
    if (site.factory_answers.siteId !== site.id)
      throw new IntegrationError("site_binding_invalid", 409);
    const raw = site.factory_order_id
      ? await this.http.call(
          "factory",
          "/api/orders/" + site.factory_order_id,
          "PUT",
          { answers: site.factory_answers },
          key,
        )
      : await this.http.call(
          "factory",
          "/api/orders",
          "POST",
          { externalId: site.order_id, answers: site.factory_answers },
          key,
        );
    const order = FactoryOrder.parse(raw);
    if (order.externalId !== site.order_id || order.answers.siteId !== site.id)
      throw new IntegrationError("factory_order_binding_invalid", 409);
    let options: Record<string, unknown> = { ...order.analysis };
    try {
      options = await this.options({ ...site, factory_order_id: order.id });
    } catch (error) {
      options = { ...order.analysis, options_refresh_error: safeCode(error) };
    }
    return { order, options };
  }
  async poll(site: Site) {
    if (!site.factory_order_id)
      throw new IntegrationError("factory_order_not_linked", 409);
    const state = z
      .object({
        orders: z.array(FactoryOrder),
        projects: z.array(FactoryProject),
        templates: z.array(z.record(z.string(), z.unknown())),
        jobs: z.array(z.record(z.string(), z.unknown())),
      })
      .passthrough()
      .parse(await this.http.call("factory", "/api/state"));
    const order = state.orders.find((o) => o.id === site.factory_order_id);
    if (
      !order ||
      order.externalId !== site.order_id ||
      order.answers.siteId !== site.id
    )
      throw new IntegrationError("factory_order_binding_invalid", 409);
    const project = state.projects.find(
      (p) => p.orderId === site.factory_order_id,
    );
    if (project && project.siteId !== site.id)
      throw new IntegrationError("factory_project_binding_invalid", 409);
    if (site.factory_project_id && project?.id !== site.factory_project_id)
      throw new IntegrationError("factory_project_binding_invalid", 409);
    return {
      project: project ?? null,
      options: await this.options(site),
      registry: state.templates,
      jobs: state.jobs.filter((j) => project && j.projectId === project.id),
    };
  }
  async action(
    site: Site,
    kind: string,
    payload: Record<string, unknown>,
    key: string,
  ) {
    let raw: unknown;
    if (kind === "factory_generate") {
      if (!site.factory_order_id)
        throw new IntegrationError("factory_order_not_linked", 409);
      raw = await this.http.call(
        "factory",
        "/api/orders/" + site.factory_order_id + "/generate",
        "POST",
        {
          templateId: payload.templateId,
          designId: payload.designId,
          provider: payload.provider,
        },
        key,
      );
    } else {
      if (!site.factory_project_id)
        throw new IntegrationError("factory_project_not_linked", 409);
      raw = await this.http.call(
        "factory",
        "/api/projects/" +
          site.factory_project_id +
          (kind === "factory_approve" ? "/approve" : "/confirm"),
        "POST",
        kind === "factory_confirm" ? { reference: payload.reference } : {},
        key,
      );
    }
    const project = FactoryProject.parse(raw);
    if (
      project.siteId !== site.id ||
      project.orderId !== site.factory_order_id ||
      (site.factory_project_id && site.factory_project_id !== project.id)
    )
      throw new IntegrationError("factory_project_binding_invalid", 409);
    if (project.status === "delivered" && !project.delivery?.at)
      throw new IntegrationError("delivery_confirmation_missing", 409);
    return { project };
  }
}
export class DashboardConnection {
  constructor(private http = new ServiceHttp()) {}
  async prepare(
    site: Site,
    customer: Record<string, unknown>,
    key: string,
    retry = false,
  ) {
    const receipt = ProvisionReceipt.parse(
      await this.http.call(
        "dashboard",
        retry
          ? "/api/integrations/axora/v1/sites/" + site.id + "/sheets/retry"
          : "/api/integrations/axora/v1/sites",
        "POST",
        {
          site_id: site.id,
          customer_ref: site.customer_id,
          business_type: site.business_type,
          enabled_modules: site.enabled_modules,
          customer: { email: customer.email, name: customer.name },
          access: "none",
        },
        key,
      ),
    );
    if (
      receipt.site_id !== site.id ||
      receipt.customer_ref !== site.customer_id ||
      receipt.business_type !== site.business_type ||
      receipt.enabled_modules.length !== site.enabled_modules.length ||
      receipt.enabled_modules.some((m) => !site.enabled_modules.includes(m))
    )
      throw new IntegrationError("dashboard_site_binding_invalid", 409);
    return receipt;
  }
  async health(site: Site) {
    const receipt = ProvisionReceipt.parse(
      await this.http.call(
        "dashboard",
        "/api/integrations/axora/v1/sites/" + site.id,
      ),
    );
    if (
      receipt.site_id !== site.id ||
      receipt.customer_ref !== site.customer_id ||
      receipt.business_type !== site.business_type
    )
      throw new IntegrationError("dashboard_site_binding_invalid", 409);
    return receipt;
  }
  async access(site: Site, customer: Record<string, unknown>, key: string) {
    if (!site.confirmed_delivery_at)
      throw new IntegrationError("confirmed_delivery_required", 409);
    const receipt = AccessReceipt.parse(
      await this.http.call(
        "dashboard",
        "/api/integrations/axora/v1/sites/" + site.id + "/access",
        "POST",
        {
          site_id: site.id,
          customer_ref: site.customer_id,
          customer: { email: customer.email, name: customer.name },
          business_type: site.business_type,
          enabled_modules: site.enabled_modules,
          delivery_confirmed_at: site.confirmed_delivery_at,
          role: "owner",
        },
        key,
      ),
    );
    if (
      receipt.site_id !== site.id ||
      receipt.customer_ref !== site.customer_id ||
      Date.parse(receipt.delivery_confirmed_at) !==
        Date.parse(site.confirmed_delivery_at) ||
      (receipt.status === "active" &&
        (!receipt.dashboard_user_id ||
          !receipt.identity_verified ||
          receipt.customer_email?.toLowerCase() !==
            String(customer.email).toLowerCase()))
    )
      throw new IntegrationError("dashboard_access_binding_invalid", 409);
    return receipt;
  }
  async policy(site: Site, payload: Record<string, unknown>, key: string) {
    const receipt = z
      .object({
        site_id: z.string().uuid(),
        applied: z.literal(true),
        writes_suspended: z.boolean(),
      })
      .strict()
      .parse(
        await this.http.call(
          "dashboard",
          "/api/integrations/axora/v1/sites/" + site.id + "/access-policy",
          "POST",
          {
            site_id: site.id,
            customer_ref: site.customer_id,
            ...payload,
            delete_data: false,
          },
          key,
        ),
      );
    if (
      receipt.site_id !== site.id ||
      receipt.writes_suspended !== payload.writes_suspended
    )
      throw new IntegrationError("dashboard_policy_binding_invalid", 409);
    return receipt;
  }
}
export class VerifiedPaymentProvider {
  constructor(private http = new ServiceHttp()) {}
  async create(
    invoice: { id: string; amount: number; currency: string },
    key: string,
  ) {
    const receipt = z
      .object({
        id: z.string().min(1).max(160),
        payment_url: z.string().url(),
        expires_at: z.string().datetime().optional(),
      })
      .strict()
      .parse(
        await this.http.call(
          "payment",
          "/invoices",
          "POST",
          {
            reference: invoice.id,
            amount: invoice.amount,
            currency: invoice.currency,
          },
          key,
        ),
      );
    const url = new URL(receipt.payment_url);
    if (url.protocol !== "https:" || url.username || url.password)
      throw new IntegrationError("invalid_checkout_url");
    return receipt;
  }
  async verify(paymentId: string) {
    const verified = VerifiedPayment.parse(
      await this.http.call(
        "payment",
        "/payments/" + encodeURIComponent(paymentId),
      ),
    );
    if (
      !process.env.AXORA_PAYMENT_MERCHANT_ID ||
      verified.merchant_id !== process.env.AXORA_PAYMENT_MERCHANT_ID ||
      verified.id !== paymentId
    )
      throw new IntegrationError("payment_merchant_binding_invalid", 409);
    return verified;
  }
}
