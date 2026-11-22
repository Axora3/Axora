import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  database,
  command,
  register,
  finish,
  linkFactory,
  project,
  userA,
  userB,
} from "./helpers";

test("disposable PostgreSQL migration, delivery-only trial, verified settlement, idempotency and RLS", async (t) => {
  const db = await database();
  try {
    const a = await register(db),
      b = await register(db, "b@example.invalid");
    const fa = await linkFactory(db, a);
    await t.test(
      "order registration and preview do not create a trial or customer access",
      async () => {
        await finish(db, a.id, "factory_poll", { project: project(a, fa) });
        const sub = (
          await db.query<Record<string, unknown>>(
            "select * from ecosystem_subscriptions where site_id=$1",
            [a.id],
          )
        ).rows[0]!;
        assert.equal(sub.confirmed_delivery_at, null);
        assert.equal(sub.trial_ends_at, null);
        assert.equal(
          (
            await db.query<Record<string, unknown>>(
              "select * from ecosystem_tasks where site_id=$1 and kind='dashboard_access'",
              [a.id],
            )
          ).rows.length,
          0,
        );
        await assert.rejects(
          command(db, "invoice", a.id, { plan: "monthly" }),
          /confirmed_delivery_required/,
        );
        await assert.rejects(
          command(db, "provision_access", a.id),
          /confirmed_delivery_required/,
        );
      },
    );
    let confirmed = "";
    await t.test(
      "actual delivery receipt starts one immutable 30-day trial and queues access once",
      async () => {
        confirmed = new Date(Date.now() - 1000).toISOString();
        const receipt = { project: project(a, fa, "delivered", confirmed) };
        await finish(db, a.id, "factory_confirm", receipt);
        await finish(db, a.id, "factory_poll", receipt);
        const s = (
          await db.query<{ trial_ends_at: Date; confirmed_delivery_at: Date }>(
            "select * from ecosystem_subscriptions where site_id=$1",
            [a.id],
          )
        ).rows[0]!;
        assert.equal(
          new Date(s.trial_ends_at).getTime() -
            new Date(s.confirmed_delivery_at).getTime(),
          30 * 86400000,
        );
        assert.equal(
          (
            await db.query<Record<string, unknown>>(
              "select * from ecosystem_tasks where site_id=$1 and kind='dashboard_access'",
              [a.id],
            )
          ).rows.length,
          1,
        );
        await assert.rejects(
          finish(db, a.id, "factory_poll", {
            project: project(
              a,
              fa,
              "delivered",
              new Date(Date.now() + 1000).toISOString(),
            ),
          }),
          /delivery_timestamp_immutable/,
        );
      },
    );
    await t.test(
      "cross-site factory and dashboard receipts are rejected",
      async () => {
        await assert.rejects(
          finish(db, b.id, "factory_poll", {
            project: project(a, fa, "delivered", confirmed),
          }),
          /factory_binding_invalid/,
        );
        await assert.rejects(
          finish(db, a.id, "dashboard_access", {
            site_id: b.id,
            customer_ref: randomUUID(),
            delivery_confirmed_at: confirmed,
            status: "active",
            dashboard_user_id: randomUUID(),
          }),
          /dashboard_delivery_binding_invalid/,
        );
        assert.equal(
          (
            await db.query<Record<string, unknown>>(
              "select * from ecosystem_billing_grants",
            )
          ).rows.length,
          0,
        );
      },
    );
    await t.test(
      "mapping is private and cannot be reused for another customer or silently reassigned",
      async () => {
        const customerA = (
          await db.query<{ customer_id: string }>(
            "select customer_id from ecosystem_sites where id=$1",
            [a.id],
          )
        ).rows[0]!.customer_id;
        await db.query<Record<string, unknown>>(
          "update ecosystem_sites set business_type='online_store',enabled_modules=array['products']where id=$1",
          [a.id],
        );
        const receipt = {
          site_id: a.id,
          customer_ref: customerA,
          business_type: "online_store",
          enabled_modules: ["products"],
          status: "ready",
          integration_status: "connected",
          spreadsheet_id: "fixture-private-workbook",
          last_successful_sync: new Date().toISOString(),
          configuration_version: 1,
        };
        await finish(db, a.id, "dashboard_prepare", receipt);
        await assert.rejects(
          finish(db, a.id, "dashboard_health", {
            ...receipt,
            spreadsheet_id: "other-workbook",
          }),
          /mapping_reassignment_requires_review/,
        );
        await finish(db, a.id, "dashboard_access", {
          site_id: a.id,
          customer_ref: customerA,
          delivery_confirmed_at: confirmed,
          status: "invited",
          dashboard_user_id: null,
        });
        assert.equal(
          (
            await db.query<Record<string, unknown>>(
              "select * from ecosystem_billing_grants where site_id=$1",
              [a.id],
            )
          ).rows.length,
          1,
        );
      },
    );
    let invoiceId = "";
    await t.test(
      "invoice prices are server-owned and replayed command keys do not create duplicate invoices",
      async () => {
        const key = randomUUID(),
          r = await command(db, "invoice", a.id, { plan: "annual" }, key);
        invoiceId = String(r.invoice_id);
        assert.equal(
          (await command(db, "invoice", a.id, { plan: "annual" }, key))
            .invoice_id,
          invoiceId,
        );
        await assert.rejects(
          command(db, "invoice", a.id, { plan: "monthly" }, key),
          /idempotency_conflict/,
        );
        const invoice = (
          await db.query<{ amount: number }>(
            "select * from ecosystem_invoices where id=$1",
            [invoiceId],
          )
        ).rows[0]!;
        assert.equal(invoice.amount, 228000);
        await assert.rejects(
          db.query<Record<string, unknown>>(
            "insert into ecosystem_plans values('monthly',1,1,'MNT')",
          ),
        );
      },
    );
    let payment: Record<string, unknown>;
    let periodEnd: unknown;
    await t.test(
      "only matching verified provider data settles once and prepays after the complete trial",
      async () => {
        await db.query<Record<string, unknown>>(
          "update ecosystem_invoices set provider_invoice_id='fixture-provider-invoice'where id=$1",
          [invoiceId],
        );
        payment = {
          id: "fixture-provider-payment",
          invoice_reference: "fixture-provider-invoice",
          merchant_id: "fixture-merchant",
          status: "paid",
          amount: 228000,
          currency: "MNT",
          paid_at: new Date().toISOString(),
        };
        await assert.rejects(
          db.query<Record<string, unknown>>(
            "select ecosystem_settle($1,$2,$3,$4)",
            [
              invoiceId,
              "wrong-amount",
              "a".repeat(64),
              { ...payment, amount: 1 },
            ],
          ),
          /verified_payment_mismatch/,
        );
        await assert.rejects(
          db.query<Record<string, unknown>>(
            "select ecosystem_settle($1,$2,$3,$4)",
            [
              invoiceId,
              "missing-fields",
              "a".repeat(64),
              { id: "x", paid_at: new Date().toISOString() },
            ],
          ),
          /verified_payment_mismatch/,
        );
        await db.query<Record<string, unknown>>(
          "select ecosystem_settle($1,$2,$3,$4)",
          [invoiceId, "event-paid", "a".repeat(64), payment],
        );
        const sub = (
          await db.query<Record<string, unknown>>(
            "select * from ecosystem_subscriptions where site_id=$1",
            [a.id],
          )
        ).rows[0]!;
        assert.equal(
          new Date(String(sub.current_period_start)).getTime(),
          new Date(String(sub.trial_ends_at)).getTime(),
        );
        assert.equal(sub.status, "trial");
        periodEnd = sub.current_period_end;
        assert.equal(
          (
            await db.query<Record<string, unknown>>(
              "select * from ecosystem_payments where site_id=$1",
              [a.id],
            )
          ).rows.length,
          1,
        );
      },
    );
    await t.test(
      "duplicate event/payment notices never extend the subscription twice",
      async () => {
        await db.query<Record<string, unknown>>(
          "select ecosystem_settle($1,$2,$3,$4)",
          [invoiceId, "event-paid", "a".repeat(64), payment],
        );
        await db.query<Record<string, unknown>>(
          "select ecosystem_settle($1,$2,$3,$4)",
          [invoiceId, "event-retry", "b".repeat(64), payment],
        );
        await assert.rejects(
          db.query<Record<string, unknown>>(
            "select ecosystem_settle($1,$2,$3,$4)",
            [invoiceId, "event-paid", "c".repeat(64), payment],
          ),
          /provider_event_conflict/,
        );
        assert.deepEqual(
          (
            await db.query<Record<string, unknown>>(
              "select current_period_end from ecosystem_subscriptions where site_id=$1",
              [a.id],
            )
          ).rows[0]!.current_period_end,
          periodEnd,
        );
      },
    );
    await t.test(
      "RLS rejects customer A reading B, reading private mappings or forging payment state",
      async () => {
        await db.query<Record<string, unknown>>(
          "update ecosystem_customers set auth_user_id=$1 where id=(select customer_id from ecosystem_sites where id=$2)",
          [userA, a.id],
        );
        await db.query<Record<string, unknown>>(
          "update ecosystem_customers set auth_user_id=$1 where id=(select customer_id from ecosystem_sites where id=$2)",
          [userB, b.id],
        );
        await db.exec(
          `set role authenticated;set request.jwt.claim.sub='${userA}';`,
        );
        const own = await db.query<{ site_id: string }>(
          "select site_id from ecosystem_subscriptions",
        );
        assert.deepEqual(
          own.rows.map((x) => x.site_id),
          [a.id],
        );
        assert.equal(
          (
            await db.query<Record<string, unknown>>(
              "select * from ecosystem_sheet_mappings",
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query<Record<string, unknown>>(
              "select * from ecosystem_tasks",
            )
          ).rows.length,
          0,
        );
        await assert.rejects(
          db.query<Record<string, unknown>>(
            "update ecosystem_payments set status='paid'",
          ),
          /permission denied/,
        );
        await assert.rejects(
          db.query<Record<string, unknown>>(
            "select ecosystem_settle($1,$2,$3,$4)",
            [invoiceId, "forged", "f".repeat(64), payment],
          ),
          /permission denied/,
        );
        await db.exec("reset role;reset request.jwt.claim.sub;");
      },
    );
    await t.test(
      "cancellation and configured overdue policy never delete projects or data",
      async () => {
        await command(db, "cancel", a.id);
        assert.equal(
          (
            await db.query<Record<string, unknown>>(
              "select cancel_at_period_end from ecosystem_subscriptions where site_id=$1",
              [a.id],
            )
          ).rows[0]!.cancel_at_period_end,
          true,
        );
        await command(db, "resume", a.id);
        await command(db, "policy", a.id, { autoSuspend: true, graceDays: 0 });
        const fb = await linkFactory(db, b);
        await finish(db, b.id, "factory_confirm", {
          project: project(
            b,
            fb,
            "delivered",
            new Date(Date.now() - 100 * 86400000).toISOString(),
          ),
        });
        await command(db, "policy", b.id, { autoSuspend: true, graceDays: 0 });
        await db.exec("select ecosystem_tick()");
        assert.equal(
          (
            await db.query<{ status: string }>(
              "select status from ecosystem_subscriptions where site_id=$1",
              [b.id],
            )
          ).rows[0]!.status,
          "suspended",
        );
        await command(db, "cancel", b.id);
        await db.exec("select ecosystem_tick()");
        assert.equal(
          (
            await db.query<{ status: string }>(
              "select status from ecosystem_subscriptions where site_id=$1",
              [b.id],
            )
          ).rows[0]!.status,
          "cancelled",
        );
        assert.equal(
          (
            await db.query<Record<string, unknown>>(
              "select count(*) as n from ecosystem_sites",
            )
          ).rows[0]!.n,
          2,
        );
        assert.equal(
          (
            await db.query<Record<string, unknown>>(
              "select count(*) as n from website_projects",
            )
          ).rows[0]!.n,
          2,
        );
      },
    );
    await t.test(
      "audit is append-only and queue claims enforce leases",
      async () => {
        await assert.rejects(
          db.exec("delete from ecosystem_audit"),
          /append only/,
        );
        await db.exec(
          "update ecosystem_tasks set status='completed',lease_owner=null,lease_until=null",
        );
        await db.query<Record<string, unknown>>(
          "insert into ecosystem_tasks(site_id,kind,request_key)values($1,'factory_poll',$2)",
          [a.id, randomUUID()],
        );
        const owner = randomUUID();
        const first = await db.query<Record<string, unknown>>(
          "select * from ecosystem_claim($1)",
          [owner],
        );
        assert.equal(first.rows.length, 1);
        assert.equal(
          (
            await db.query<Record<string, unknown>>(
              "select * from ecosystem_claim($1)",
              [randomUUID()],
            )
          ).rows.length,
          0,
        );
        await assert.rejects(
          db.query<Record<string, unknown>>(
            "select ecosystem_finish($1,$2,$3,null,false)",
            [first.rows[0]!.id, randomUUID(), {}],
          ),
          /lease_lost/,
        );
      },
    );
  } finally {
    await db.close();
  }
});
