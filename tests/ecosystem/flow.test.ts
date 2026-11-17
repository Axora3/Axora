import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { fixture, fixtureToken } from "./service-fixture";
import { command } from "./helpers";

test("real Axora processor, authenticated HTTP adapters, SQL delivery trial and signed payment route with disposable services", async () => {
  const f = await fixture();
  try {
    Object.assign(process.env, {
      NEXT_PUBLIC_SUPABASE_URL: f.base,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "fixture-service-role-key",
      AXORA_INTEGRATION_LOCAL_TEST: "1",
      AXORA_FACTORY_URL: f.base + "/factory",
      AXORA_FACTORY_ADMIN_TOKEN: fixtureToken,
      AXORA_DASHBOARD_URL: f.base + "/dashboard",
      AXORA_DASHBOARD_SERVICE_TOKEN: fixtureToken,
      AXORA_PAYMENT_API_URL: f.base + "/provider",
      AXORA_PAYMENT_API_TOKEN: fixtureToken,
      AXORA_PAYMENT_MERCHANT_ID: "fixture-merchant",
      AXORA_PAYMENT_WEBHOOK_SECRET: fixtureToken,
      AXORA_DASHBOARD_BILLING_TOKEN: fixtureToken,
    });
    const { EcosystemProcessor } =
      await import("../../src/lib/ecosystem/processor");
    const { POST: paymentNotice } =
      await import("../../src/app/api/integrations/payments/custom/notice/route");
    const { GET: billing } =
      await import("../../src/app/api/integrations/billing/sites/[siteId]/billing/route");
    const r = await command(f.db, "register", null, { orderId: f.orderId }),
      id = String(r.site_id);
    await command(f.db, "requirements", id, {
      answers: {
        siteId: id,
        businessType: "online_store",
        businessName: "Fixture website",
        dataBackend: "google_sheets",
      },
      enabledModules: ["products", "categories"],
    });
    const processor = new EcosystemProcessor();
    await command(f.db, "prepare_site", id);
    const blocked = await processor.one();
    assert.equal(blocked.status, "blocked_or_retrying");
    assert.equal(
      (
        await f.db.query<{
          dashboard_status: string;
          confirmed_delivery_at: Date | null;
        }>("select * from ecosystem_sites where id=$1", [id])
      ).rows[0]!.confirmed_delivery_at,
      null,
    );
    f.enableDashboard();
    const blockedTask = (
      await f.db.query<{ id: string }>(
        "select id from ecosystem_tasks where site_id=$1 and status='blocked'",
        [id],
      )
    ).rows[0]!;
    await command(f.db, "retry_task", id, { taskId: blockedTask.id });
    assert.equal((await processor.one()).status, "completed");
    await command(f.db, "submit", id);
    assert.equal((await processor.one()).status, "completed");
    assert.ok(
      (
        await f.db.query(
          "select factory_order_id from ecosystem_sites where id=$1",
          [id],
        )
      ).rows[0],
    );
    await command(f.db, "generate", id, {
      templateId: "fixture-template",
      designId: "fixture-design",
      provider: "codex",
    });
    assert.equal((await processor.one()).status, "completed");
    let sub = (
      await f.db.query<{ trial_ends_at: Date | null }>(
        "select * from ecosystem_subscriptions where site_id=$1",
        [id],
      )
    ).rows[0]!;
    assert.equal(sub.trial_ends_at, null);
    await command(f.db, "approve", id);
    await processor.one();
    await command(f.db, "confirm", id, {
      reference: "Fixture actual confirmation protocol",
    });
    assert.equal((await processor.one()).status, "completed");
    sub = (
      await f.db.query<{ trial_ends_at: Date | null }>(
        "select * from ecosystem_subscriptions where site_id=$1",
        [id],
      )
    ).rows[0]!;
    assert.ok(sub.trial_ends_at);
    assert.equal((await processor.one()).status, "completed");
    const response = await billing(
      new Request(
        "https://axora.example.invalid/api/integrations/billing/sites/" +
          id +
          "/billing",
        { headers: { authorization: "Bearer " + fixtureToken } },
      ),
      { params: Promise.resolve({ siteId: id }) },
    );
    assert.equal(response.status, 200);
    const before = await response.json();
    assert.equal(before.subscription.status, "trial");
    assert.equal(before.payments.length, 0);
    const foreign = await billing(
      new Request("https://axora.example.invalid/billing", {
        headers: { authorization: "Bearer " + fixtureToken },
      }),
      { params: Promise.resolve({ siteId: randomUUID() }) },
    );
    assert.equal(foreign.status, 403);
    const invoice = await command(f.db, "invoice", id, { plan: "monthly" });
    assert.equal((await processor.one()).status, "completed");
    const inv = (
      await f.db.query<{ provider_invoice_id: string; amount: number }>(
        "select * from ecosystem_invoices where id=$1",
        [invoice.invoice_id],
      )
    ).rows[0]!;
    f.payments.set("fixture_payment", {
      id: "fixture_payment",
      invoice_reference: inv.provider_invoice_id,
      merchant_id: "fixture-merchant",
      status: "paid",
      amount: 20000,
      currency: "MNT",
      paid_at: new Date().toISOString(),
    });
    const raw = JSON.stringify({
        event_id: "fixture_event",
        payment_id: "fixture_payment",
      }),
      timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac("sha256", fixtureToken)
      .update(timestamp + "." + raw)
      .digest("hex");
    const request = () =>
      new Request(
        "https://axora.example.invalid/api/integrations/payments/custom/notice",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-provider-timestamp": timestamp,
            "x-provider-signature": signature,
          },
          body: raw,
        },
      );
    const paid = await paymentNotice(request());
    assert.equal(paid.status, 200, await paid.clone().text());
    assert.equal((await paid.json()).settled, true);
    const repeat = await paymentNotice(request());
    assert.equal(repeat.status, 200);
    assert.equal((await repeat.json()).duplicate, true);
    assert.equal(
      (
        await f.db.query("select * from ecosystem_payments where site_id=$1", [
          id,
        ])
      ).rows.length,
      1,
    );
    const invalid = await paymentNotice(
      new Request("https://axora.example.invalid/notice", {
        method: "POST",
        body: raw,
        headers: {
          "x-provider-timestamp": timestamp,
          "x-provider-signature": "f".repeat(64),
        },
      }),
    );
    assert.equal(invalid.status, 401);
  } finally {
    await f.close();
  }
});
