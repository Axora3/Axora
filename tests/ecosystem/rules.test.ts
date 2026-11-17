import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import {
  trialEnd,
  addMonthsUtc,
  subscriptionState,
  PLANS,
  type Subscription,
} from "../../src/lib/ecosystem/billing-rules";
import {
  ServiceHttp,
  FactoryConnection,
  DashboardConnection,
  VerifiedPaymentProvider,
} from "../../src/lib/ecosystem/connections";
import { signatureValid } from "../../src/lib/ecosystem/security";
import type { Site } from "../../src/lib/ecosystem/contracts";
const token = "fixture-service-token-" + "a".repeat(32);
process.env.AXORA_FACTORY_URL = "https://factory.example.invalid";
process.env.AXORA_FACTORY_ADMIN_TOKEN = token;
process.env.AXORA_DASHBOARD_URL = "https://dashboard.example.invalid";
process.env.AXORA_DASHBOARD_SERVICE_TOKEN = token;
process.env.AXORA_PAYMENT_API_URL = "https://payments.example.invalid";
process.env.AXORA_PAYMENT_API_TOKEN = token;
process.env.AXORA_PAYMENT_MERCHANT_ID = "fixture-merchant";
const site = {
  id: randomUUID(),
  customer_id: randomUUID(),
  order_id: randomUUID(),
  factory_order_id: randomUUID(),
  factory_project_id: null,
  business_type: "online_store",
  enabled_modules: ["products"],
  factory_answers: {},
  confirmed_delivery_at: null,
} as unknown as Site;
test("pricing, delivery-only trial and calendar periods are exact", () => {
  assert.equal(PLANS.monthly.amount, 20000);
  assert.equal(PLANS.annual.amount, 228000);
  assert.equal(PLANS.annual.amount, PLANS.monthly.amount * 12 * 0.95);
  assert.equal(trialEnd(null), null);
  assert.equal(trialEnd("2026-11-01T00:00:00Z"), "2026-12-01T00:00:00.000Z");
  assert.equal(
    addMonthsUtc("2028-01-31T12:00:00Z", 1),
    "2028-02-29T12:00:00.000Z",
  );
  assert.equal(
    addMonthsUtc("2028-02-29T12:00:00Z", 12),
    "2029-02-28T12:00:00.000Z",
  );
});
test("trial, prepaid coverage, overdue, suspension and cancellation do not invent paid status", () => {
  const s = {
    site_id: site.id,
    confirmed_delivery_at: null,
    trial_ends_at: null,
    current_period_start: null,
    current_period_end: null,
    plan_id: null,
    cancel_at_period_end: false,
    auto_suspend: false,
    grace_days: 7,
    status: "awaiting_delivery",
  } as Subscription;
  assert.equal(subscriptionState(s).status, "awaiting_delivery");
  const delivered = {
    ...s,
    confirmed_delivery_at: "2026-11-01T00:00:00Z",
    trial_ends_at: "2026-12-01T00:00:00Z",
  };
  assert.equal(
    subscriptionState(delivered, Date.parse("2026-11-11")).status,
    "trial",
  );
  assert.equal(
    subscriptionState(
      {
        ...delivered,
        current_period_start: "2026-12-01T00:00:00Z",
        current_period_end: "2027-01-01T00:00:00Z",
      },
      Date.parse("2026-11-11"),
    ).status,
    "trial",
  );
  assert.equal(
    subscriptionState(delivered, Date.parse("2026-12-02")).status,
    "past_due",
  );
  assert.equal(
    subscriptionState(
      { ...delivered, auto_suspend: true },
      Date.parse("2026-12-09"),
    ).status,
    "suspended",
  );
  assert.equal(
    subscriptionState(
      { ...delivered, cancel_at_period_end: true },
      Date.parse("2026-12-02"),
    ).status,
    "cancelled",
  );
});
test("payment signatures reject forgery, stale timestamps and altered body", () => {
  const raw = JSON.stringify({ event_id: "event-1", payment_id: "payment-1" }),
    ts = String(Math.floor(Date.now() / 1000)),
    sig = createHmac("sha256", token)
      .update(ts + "." + raw)
      .digest("hex");
  assert.equal(signatureValid(raw, ts, sig, token), true);
  assert.equal(signatureValid(raw + " ", ts, sig, token), false);
  assert.equal(signatureValid(raw, "1000000000", sig, token), false);
  assert.equal(signatureValid(raw, ts, "f".repeat(64), token), false);
});
test("unimplemented dashboard contract is explicitly blocked and cannot claim provisioning", async () => {
  const http = new ServiceHttp(
    async () => new Response("not found", { status: 404 }),
  );
  await assert.rejects(
    new DashboardConnection(http).prepare(
      site,
      { email: "fixture@example.invalid" },
      randomUUID(),
    ),
    /dashboard_contract_unavailable/,
  );
  await assert.rejects(
    new DashboardConnection(http).access(site, {}, randomUUID()),
    /confirmed_delivery_required/,
  );
});
test("dashboard response binding rejects another customer or site", async () => {
  const http = new ServiceHttp(async () =>
    Response.json({
      site_id: randomUUID(),
      customer_ref: site.customer_id,
      business_type: "online_store",
      enabled_modules: ["products"],
      status: "ready",
      spreadsheet_id: "fixture",
      integration_status: "connected",
      last_successful_sync: null,
      configuration_version: 1,
    }),
  );
  await assert.rejects(
    new DashboardConnection(http).prepare(site, {}, randomUUID()),
    /dashboard_site_binding_invalid/,
  );
});
test("Factory responses cannot cross locally linked customer/order/site boundaries", async () => {
  const http = new ServiceHttp(async () =>
    Response.json({
      orders: [
        {
          id: site.factory_order_id,
          externalId: site.order_id,
          answers: { siteId: randomUUID() },
          analysis: { spec: null, missing: [], matches: [] },
        },
      ],
      projects: [],
      templates: [],
      jobs: [],
    }),
  );
  await assert.rejects(
    new FactoryConnection(http).poll(site),
    /factory_order_binding_invalid/,
  );
});
test("provider lookup binds merchant and payment ID rather than trusting browser success", async () => {
  const http = new ServiceHttp(async () =>
    Response.json({
      id: "payment-1",
      invoice_reference: "invoice-1",
      merchant_id: "different-merchant",
      status: "paid",
      amount: 20000,
      currency: "MNT",
      paid_at: new Date().toISOString(),
    }),
  );
  await assert.rejects(
    new VerifiedPaymentProvider(http).verify("payment-1"),
    /payment_merchant_binding_invalid/,
  );
});
test("service-role and Google private material cannot enter Factory specifications", async () => {
  const { assertNoSecrets } = await import("../../src/lib/ecosystem/security");
  assert.throws(
    () =>
      assertNoSecrets({
        content: { about: "-----BEGIN PRIVATE KEY-----\nfixture-only" },
      }),
    /private_material_rejected/,
  );
  const jwt =
    Buffer.from("{}").toString("base64url") +
    "." +
    Buffer.from(JSON.stringify({ role: "service_role" })).toString(
      "base64url",
    ) +
    ".fixture";
  assert.throws(
    () => assertNoSecrets({ content: { about: jwt } }),
    /private_material_rejected/,
  );
  assert.doesNotThrow(() =>
    assertNoSecrets({ content: { about: "Хэрэглэгчийн бодит танилцуулга" } }),
  );
});
