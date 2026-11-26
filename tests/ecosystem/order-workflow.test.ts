import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {buildOrderPrompt} from '../../src/lib/order/prompt';
import { workflowDatabase } from "../order-workflow/database";
import {
  OWNER_PRICING,
  OWNER_SCHEDULING,
} from "../../src/lib/order-workflow/defaults";
import {
  generateQuotation,
  priceItems,
} from "../../src/lib/order-workflow/pricing";
import { suggestSchedule } from "../../src/lib/order-workflow/scheduling";

test("owner prices: packages, included features, duplicate extras, pages, separate recurring costs and rush", () => {
  const quote = (a: Record<string, string | string[]>) =>
    generateQuotation(a, OWNER_PRICING);
  assert.equal(quote({ qPages: "1" }).total, 100000);
  const prompt=buildOrderPrompt({reference:'FIXTURE',answers:{qPages:'1'}});
  assert.ok(prompt.includes('Нийт хуудасны тоо: 1'));assert.ok(!prompt.includes('undefined.'));
  assert.equal(quote({ qPages: "3" }).total, 200000);
  assert.equal(quote({ qPages: "5" }).total, 350000);
  assert.equal(quote({ qPages: "7" }).total, 410000);
  assert.equal(quote({ qPages: "7" }).effortDays, 12);
  assert.equal(
    quote({ qPages: "3", q23: ["Gallery"], q30: ["Веб форм"] }).total,
    200000,
  );
  for (const feature of OWNER_PRICING.features) {
    const result = quote({
      qPages: "1",
      qAddons: [feature.answerValue, feature.answerValue],
    });
    assert.equal(result.total, 100000 + feature.unitPrice);
    assert.equal(result.effortDays, 3 + feature.durationDays);
  }
  assert.equal(
    quote({
      qPages: "1",
      q29: ["Цаг захиалга", "Цаг захиалга"],
      qAddons: ["Цаг захиалгын систем"],
    }).total,
    180000,
  );
  const rush = quote({ qPages: "1", qUrgent: "Тийм", qMaintenance: "Тийм" });
  assert.equal(rush.subtotal, 130000);
  assert.equal(rush.monthlyTotal, 30000);
  assert.equal(rush.total, 130000);
  assert.equal(quote({ qPages: "1", qExtraRevs: "2" }).subtotal, 130000);
  assert.equal(quote({ qPages: "1", qExtraRevs: "2" }).effortDays, null);
  assert.equal(quote({ q23: ["Hero", "Gallery"] }).total, null);
  assert.equal(quote({ qPages: "1", q29: ["Онлайн төлбөр"] }).total, null);
  assert.equal(quote({ qPages: "1", q37: "Тусгай систем" }).total, null);
  const discounted = generateQuotation(
    { qPages: "1", qMaintenance: "Тийм" },
    { ...OWNER_PRICING, discountPercent: 10 },
  );
  assert.equal(discounted.total, 90000);
  assert.equal(discounted.monthlyTotal, 30000);
  assert.throws(() =>
    priceItems([
      { kind: "custom", label: "x", quantity: 1000, unitPrice: 999999999999 },
    ]),
  );
  assert.equal(
    priceItems([
      { kind: "custom", label: "x", quantity: 2, unitPrice: 100, total: 1 },
    ]).total,
    200,
  );
});

test("revision feedback, stale quote rejection, legacy conversion and non-admin RPC denial", async () => {
  const db = await workflowDatabase();
  try {
    const admin = randomUUID();
    await db.query("insert into auth.users values($1)", [admin]);
    await db.query("insert into admin_users(user_id)values($1)", [admin]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      admin,
    ]);
    const create = async () => {
      const result = await db.query<{ v: { order_id: string } }>(
        "select create_website_order($1,'[]',$2,now()+interval '1 day') v",
        [
          {
            idempotency_key: randomUUID(),
            payload_hash: "a".repeat(64),
            full_name: "Fixture",
            email: "fixture@example.invalid",
            phone: "88000000",
            business_name: "Fixture",
            preferred_channel: "phone",
            answers: { schema_version: 1 },
            consent_text_version: "test",
          },
          "b".repeat(64),
        ],
      );
      return result.rows[0].v.order_id;
    };
    const id = await create(),
      token = "c".repeat(32),
      draft = generateQuotation({ qPages: "1" }, OWNER_PRICING);
    const command = async (action: string, input: object = {}) =>
      (
        await db.query<{ v: { customerRequests: { message: string }[] } }>(
          "select website_order_admin_command($1,$2,$3,$4) v",
          [id, action, randomUUID(), input],
        )
      ).rows[0].v;
    const customer = (action: string, input: object) =>
      db.query("select website_order_customer_command($1,$2,$3,$4)", [
        token,
        action,
        randomUUID(),
        input,
      ]);
    await db.query("select website_order_initialize($1,$2,$3)", [
      id,
      token,
      draft,
    ]);
    await customer("revision", {
      version: 1,
      message: "Add one more page please",
    });
    const view = (
      await db.query<{ v: { customerRequests: { message: string }[] } }>(
        "select website_order_admin_view($1) v",
        [id],
      )
    ).rows[0].v;
    assert.equal(view.customerRequests[0].message, "Add one more page please");
    await command("save_quote", {
      expectedVersion: 1,
      items: draft.items,
      discount: 0,
      effortDays: 3,
      notes: "Updated scope",
      reason: "Customer revision reviewed",
    });
    await command("send_quote", { version: 2, reviewResolved: true });
    await assert.rejects(customer("accept", { version: 1 }), /stale_quote/);
    await customer("reject", { version: 2 });
    await command('cancel',{reason:'Customer chose to cancel'});
    await assert.rejects(customer('accept',{version:2}),/order_closed/);
    const legacy = await create(),
      legacyToken = "d".repeat(32);
    await db.query(
      "update website_orders set quote_amount=555000,payment_token=$2 where id=$1",
      [legacy, legacyToken],
    );
    assert.equal(
      (
        await db.query<{ v: { quote: { version: number } } }>(
          "select website_order_customer_view($1) v",
          [legacyToken],
        )
      ).rows[0].v.quote.version,
      0,
    );
    await db.query("select website_order_customer_command($1,$2,$3,$4)", [
      legacyToken,
      "accept",
      randomUUID(),
      { version: 0, expectedAmount: 555000 },
    ]);
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from website_order_quotes where order_id=$1 and status='accepted'",
          [legacy],
        )
      ).rows[0].n,
      1,
    );
    await db.query("select set_config('request.jwt.claim.sub','',false)");
    await db.exec("set role authenticated");
    await assert.rejects(
      db.query("select website_order_admin_view($1)", [id]),
      /admin_required/,
    );
    await assert.rejects(
      db.query("select website_order_admin_command($1,$2,$3,$4)", [
        id,
        "start",
        randomUUID(),
        {},
      ]),
      /admin_required/,
    );
    assert.equal(
      (await db.query("select * from website_order_quotes")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});

test("schedule uses upper package duration, workdays, buffer, FIFO, capacity and Ulaanbaatar date", () => {
  const now = new Date("2026-11-27T16:30:00Z"); // Saturday in Ulaanbaatar
  const empty = suggestSchedule(3, [], OWNER_SCHEDULING, now);
  assert.equal(empty.suggestedStart, "2026-11-30");
  assert.equal(empty.suggestedDeadline, "2026-12-04");
  const workload = {
    id: "old",
    effortDays: 3,
    remainingDays: 3,
    bufferDays: 2,
    deadline: "2026-12-04",
    receivedAt: "2026-11-01",
    priority: 0,
  };
  assert.equal(
    suggestSchedule(3, [workload], OWNER_SCHEDULING, now).suggestedDeadline,
    "2026-12-11",
  );
  assert.equal(
    suggestSchedule(
      3,
      [workload],
      { ...OWNER_SCHEDULING, maxParallelProjects: 2 },
      now,
    ).suggestedDeadline,
    "2026-12-04",
  );
  assert.equal(
    suggestSchedule(null, [], OWNER_SCHEDULING, now).approximate,
    true,
  );
  assert.equal(
    suggestSchedule(
      3,
      [{ ...workload, effortDays: null, remainingDays: null, deadline: null }],
      OWNER_SCHEDULING,
      now,
    ).suggestedDeadline,
    null,
  );
});

test("actual SQL migration, quote locking, customer acceptance, bank verification, payment and lifecycle", async () => {
  const db = await workflowDatabase();
  try {
    await db.exec(
      await readFile(
        "supabase/migrations/20261126000000_instant_quotation.sql",
        "utf8",
      ),
    );
    await assert.rejects(
      db.query(
        "insert into templates(slug,title,category,price,is_free,status)values('invalid-publish','Invalid','Notion',0,true,'published')",
      ),
      /publish_requirements/,
    );
    const admin = randomUUID(),
      order = randomUUID(),
      token = "a".repeat(32);
    await db.query("insert into auth.users values($1)", [admin]);
    await db.query("insert into admin_users(user_id)values($1)", [admin]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      admin,
    ]);
    await db.query(
      "insert into website_orders(id,idempotency_key,payload_hash,reference,full_name,email,phone,business_name,preferred_channel,answers,consent_text_version,consent_processing)values($1,$2,$3,'AX-TEST','Test','test@example.invalid','88000000','Test business','phone','{\"schema_version\":1}','test',true)",
      [order, randomUUID(), "a".repeat(64)],
    );
    const call = async (action: string, input: object = {}) =>
      (
        await db.query<{ v: Record<string, unknown> }>(
          "select website_order_admin_command($1,$2,$3,$4) v",
          [order, action, randomUUID(), input],
        )
      ).rows[0].v;
    const customer = async (
      action: string,
      input: object,
      key = randomUUID(),
    ) =>
      (
        await db.query<{ v: Record<string, unknown> }>(
          "select website_order_customer_command($1,$2,$3,$4) v",
          [token, action, key, input],
        )
      ).rows[0].v;
    await db.query("select website_order_initialize($1,$2,$3)", [
      order,
      token,
      generateQuotation({ qPages: "1" }, OWNER_PRICING),
    ]);
    assert.equal((await db.query<{status:string}>("select status from website_order_quotes where order_id=$1",[order])).rows[0].status,'sent');
    const key = randomUUID();
    await customer("accept", { version: 1 }, key);
    await customer("accept", { version: 1 }, key);
    await assert.rejects(
      customer("reject", { version: 1 }, key),
      /idempotency_conflict/,
    );
    await assert.rejects(
      call("save_quote", { expectedVersion: 1, reason: "change", items: [] }),
      /accepted_quote_locked/,
    );
    await db.query("update website_workflow_settings set verified_bank=null where id=1");
    await assert.rejects(
      customer("report_payment", { version: 1 }),
      /bank_not_verified/,
    );
    const bank = {
      name: "Fixture Bank",
      holder: "Fixture owner",
      account: "TEST123456",
    };
    const settings = (
      await db.query<{ version: string }>(
        "select version from website_workflow_settings",
      )
    ).rows[0];
    await call("save_settings", {
      expectedVersion: settings.version,
      pricing: OWNER_PRICING,
      scheduling: OWNER_SCHEDULING,
      bank,
      bankVerified: true,
      bankInstructions: "",
    });
    await assert.rejects(
      db.query(
        "update website_order_quotes set total=1,subtotal=1 where order_id=$1",
        [order],
      ),
      /accepted_quote_locked/,
    );
    await db.exec("set role authenticated");
    await assert.rejects(
      db.query(
        "update website_orders set payment_status='paid',paid_at=now() where id=$1",
        [order],
      ),
      /workflow_command_required/,
    );
    await assert.rejects(
      db.query("insert into website_projects(order_id)values($1)", [order]),
      /workflow_command_required/,
    );
    await db.exec("reset role");
    await customer("report_payment", {
      version: 1,
      reference: "fixture",
      message: "",
    });
    await call('review_payment',{message:'Please verify the transfer reference'});
    const feedback=(await db.query<{v:{paymentReport:{review_note:string}}}>('select website_order_customer_view($1) v',[token])).rows[0].v;
    assert.equal(feedback.paymentReport.review_note,'Please verify the transfer reference');
    await customer('report_payment',{version:1,reference:'corrected-fixture',message:'Reference corrected'});
    assert.equal(
      (
        await db.query<{ payment_status: string }>(
          "select payment_status from website_orders",
        )
      ).rows[0].payment_status,
      "unpaid",
    );
    const revision = (
      await db.query<{ schedule_revision: number }>(
        "select schedule_revision from website_workflow_settings",
      )
    ).rows[0].schedule_revision;
    const deadline = "2099-01-09";
    await assert.rejects(
      call("verify_payment", {
        amount: 1,
        scheduleRevision: revision,
        deadline,
        effortDays: 3,
        suggestion: { suggestedDeadline: deadline, approximate: false },
      }),
      /payment_amount_mismatch/,
    );
    await assert.rejects(
      call("verify_payment", {
        amount: 100000,
        scheduleRevision: revision + 1,
        deadline,
        effortDays: 3,
        suggestion: { suggestedDeadline: deadline, approximate: false },
      }),
      /schedule_changed/,
    );
    await assert.rejects(
      call("verify_payment", {
        scheduleRevision: revision,
        deadline,
        effortDays: 3,
        suggestion: { suggestedDeadline: deadline, approximate: false },
      }),
      /payment_amount_mismatch/,
    );
    await call("verify_payment", {
      amount: 100000,
      scheduleRevision: revision,
      deadline,
      effortDays: 3,
      suggestion: { suggestedDeadline: deadline, approximate: false },
      reason: "fixture date",
    });
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from website_projects",
        )
      ).rows[0].n,
      1,
    );
    await call('update_progress',{progress:0,remainingDays:2,priority:5});
    await call('change_deadline',{deadline:'2099-01-10',reason:'Customer-approved revised schedule'});
    assert.equal((await db.query<{agreed_deadline:Date}>('select agreed_deadline from website_orders')).rows[0].agreed_deadline.toISOString().slice(0,10),'2099-01-10');
    await call("start");
    await call("complete", { url: "https://example.invalid" });
    await call("deliver", { url: "https://example.invalid" });
    const p = (
      await db.query<{
        actual_started_at: string;
        actual_completed_at: string;
        delivered_at: string;
      }>("select * from website_projects")
    ).rows[0];
    assert.ok(p.actual_started_at && p.actual_completed_at && p.delivered_at);
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from website_order_email_outbox",
        )
      ).rows[0].n,
      5,
    );
    const accepted = (
      await db.query<{ total: number }>(
        "select total from website_order_quotes where order_id=$1 and status='accepted'",
        [order],
      )
    ).rows[0].total;
    await db.query("update website_workflow_settings set pricing=$1", [
      {
        ...OWNER_PRICING,
        packages: OWNER_PRICING.packages.map((p) => ({
          ...p,
          basePrice: p.basePrice + 10000,
        })),
      },
    ]);
    assert.equal(
      (
        await db.query<{ total: number }>(
          "select total from website_order_quotes where order_id=$1 and status='accepted'",
          [order],
        )
      ).rows[0].total,
      accepted,
    );
    const claimed = (
      await db.query<{ v: { id: string; lease_token: string }[] }>(
        "select website_order_email_claim(10) v",
      )
    ).rows[0].v;
    assert.equal(claimed.length, 5);
    assert.equal(
      (
        await db.query<{ v: unknown[] }>(
          "select website_order_email_claim(10) v",
        )
      ).rows[0].v.length,
      0,
    );
    assert.equal(
      (
        await db.query<{ v: boolean }>(
          "select website_order_email_finish($1,$2,true,null) v",
          [claimed[0].id, randomUUID()],
        )
      ).rows[0].v,
      false,
    );
    assert.equal(
      (
        await db.query<{ v: boolean }>(
          "select website_order_email_finish($1,$2,true,null) v",
          [claimed[0].id, claimed[0].lease_token],
        )
      ).rows[0].v,
      true,
    );
    await db.exec(
      "update website_order_email_outbox set lease_until=now()-interval '1 minute' where status='sending'",
    );
    await db.query("select website_order_email_claim(10)");
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from website_order_email_outbox where last_error='delivery_uncertain'",
        )
      ).rows[0].n,
      claimed.length - 1,
    );
    await db.exec("set role anon");
    await assert.rejects(
      db.query("select * from website_order_quotes"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select website_order_customer_view($1)", [token]),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
