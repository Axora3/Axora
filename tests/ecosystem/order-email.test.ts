import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { buildOrderEmail } from "../../src/lib/order-workflow/email-message";
import { workflowDatabase } from "../order-workflow/database";
test("lifecycle email uses approved dates, Mongolian status, exact subjects and actual timestamps", () => {
  const p = {
    to: "fixture@example.invalid",
    name: "Тест",
    reference: "AX-TEST",
    amount: 200000,
    deadline: "2027-03-01",
    trackingPath: "/order/pay/" + "a".repeat(32),
    deliveryUrl: null,
    notes: "",
    projectStatus: "planning",
    effortDays: 6,
  };
  const payment = buildOrderEmail(
    "payment_verified",
    p,
    "https://example.invalid",
  );
  assert.equal(payment.subject, "AXORA — Таны төлбөр баталгаажлаа");
  for (const text of [
    "Тест",
    "AX-TEST",
    "200,000₮",
    "2027-03-01",
    "Хөгжүүлэлт эхлэхээр хүлээгдэж байна",
    "6 ажлын өдөр",
    "AXORA-г сонгосонд баярлалаа.",
  ])
    assert.ok(payment.text.includes(text), text);
  assert.ok(!payment.text.includes("Ажил эхэлсэн:"));
  const start = buildOrderEmail(
    "development_started",
    { ...p, projectStatus: "in_progress", startedAt: "2026-11-25T01:00:00Z" },
    "https://example.invalid",
  );
  assert.equal(start.subject, "AXORA — Таны веб сайтын хөгжүүлэлт эхэллээ");
  assert.ok(start.text.includes("2026-11-25 09:00:00 (УБ)"));
  assert.equal(
    buildOrderEmail(
      "development_completed",
      { ...p, projectStatus: "completed" },
      "https://example.invalid",
    ).subject,
    "AXORA — Таны веб сайт бэлэн боллоо",
  );
});
test("SMTP receipt is service-only and bound to current sending lease", async () => {
  const db = await workflowDatabase();
  try {
    const id = randomUUID(),
      mail = randomUUID(),
      lease = randomUUID();
    await db.query(
      "insert into website_orders(id,idempotency_key,payload_hash,reference,full_name,email,phone,business_name,preferred_channel,answers,consent_text_version,consent_processing)values($1,$2,$3,'AX-RECEIPT','Fixture','fixture@example.invalid','88000000','Fixture','email','{\"schema_version\":1}','test',true)",
      [id, randomUUID(), "a".repeat(64)],
    );
    await db.query(
      "insert into website_order_email_outbox(id,order_id,event_key,event_type,payload,status,lease_token)values($1,$2,'receipt-test','payment_verified','{}','sending',$3)",
      [mail, id, lease],
    );
    const record = async (l: string) =>
      (
        await db.query<{ v: boolean }>(
          "select website_order_email_receipt($1,$2,$3) v",
          [mail, l, "<fixture@example.invalid>"],
        )
      ).rows[0].v;
    assert.equal(await record(randomUUID()), false);
    assert.equal(await record(lease), true);
    assert.equal(
      (
        await db.query<{ provider_message_id: string }>(
          "select provider_message_id from website_order_email_outbox where id=$1",
          [mail],
        )
      ).rows[0].provider_message_id,
      "<fixture@example.invalid>",
    );
    await db.exec("set role authenticated");
    await assert.rejects(record(lease), /permission denied/);
    await db.exec("reset role");
    await db.query(
      "update website_order_email_outbox set status='sent' where id=$1",
      [mail],
    );
    assert.equal(await record(lease), false);
  } finally {
    await db.close();
  }
});
