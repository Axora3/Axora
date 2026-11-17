import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IntegrationError } from "./contracts";
import { checked } from "./processor";
import { subscriptionState, type Subscription } from "./billing-rules";
export async function summary(db: SupabaseClient) {
  const names = [
    "ecosystem_customers",
    "ecosystem_sites",
    "ecosystem_subscriptions",
    "ecosystem_invoices",
    "ecosystem_payments",
    "ecosystem_tasks",
    "ecosystem_remote_registry",
    "ecosystem_audit",
  ] as const;
  const queries = await Promise.all(
    names.map((name) => db.from(name).select("*").limit(100)),
  );
  const values: Record<string, Record<string, unknown>[]> = Object.fromEntries(
    queries.map((q, i) => {
      const result = checked(q);
      if (!Array.isArray(result))
        throw new IntegrationError("data_unavailable");
      return [names[i], result];
    }),
  );
  const orders = checked(
    await db
      .from("website_orders")
      .select("id,reference,business_name,full_name,email,phone,answers")
      .order("created_at", { ascending: false })
      .limit(50),
  );
  values.ecosystem_subscriptions = (values.ecosystem_subscriptions || []).map(
    (row) => {
      const sub = row as unknown as Subscription;
      return { ...row, effective_status: subscriptionState(sub).status };
    },
  );
  if (!orders) throw new IntegrationError("data_unavailable");
  return {
    tables: values,
    orders,
    services: {
      factory: !!(
        process.env.AXORA_FACTORY_URL && process.env.AXORA_FACTORY_ADMIN_TOKEN
      ),
      dashboard: !!(
        process.env.AXORA_DASHBOARD_URL &&
        process.env.AXORA_DASHBOARD_SERVICE_TOKEN
      ),
      payment: !!(
        process.env.AXORA_PAYMENT_API_URL &&
        process.env.AXORA_PAYMENT_API_TOKEN &&
        process.env.AXORA_PAYMENT_MERCHANT_ID &&
        process.env.AXORA_PAYMENT_WEBHOOK_SECRET
      ),
    },
    asOf: new Date().toISOString(),
  };
}
export async function billingDto(db: SupabaseClient, siteId: string) {
  const site = checked(
    await db
      .from("ecosystem_sites")
      .select("id,confirmed_delivery_at")
      .eq("id", siteId)
      .single(),
  );
  if (!site) throw new Error("site_not_found");
  const sub = checked(
    await db
      .from("ecosystem_subscriptions")
      .select("*")
      .eq("site_id", siteId)
      .single(),
  ) as Subscription;
  const payments = checked(
    await db
      .from("ecosystem_payments")
      .select("id,status,amount,currency,created_at,paid_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(200),
  );
  const current = subscriptionState(sub);
  return {
    site_id: siteId,
    as_of: new Date().toISOString(),
    confirmed_delivery_at: site.confirmed_delivery_at,
    subscription: {
      status: current.status,
      plan: sub.plan_id,
      next_billing_at: current.nextBillingAt,
    },
    payments,
  };
}
