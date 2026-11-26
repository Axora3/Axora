import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("actual public intake SQL preserves orders, attachment binding, retries, RLS and rate limits", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon;create role authenticated;create role service_role bypassrls;grant usage on schema public to anon,authenticated,service_role");
    const sql = await readFile("supabase/migrations/20261028000000_axora_schema.sql", "utf8");
    // PGlite provides gen_random_uuid in core. Hosted Storage itself is outside
    // this SQL test; all application tables/RPCs/RLS before Storage are real.
    await db.exec(sql.slice(0, sql.indexOf("-- Storage buckets")).replace("create extension if not exists pgcrypto;", ""));
    const order = { idempotency_key: randomUUID(), payload_hash: "a".repeat(64), full_name: "Туршилтын Бат", email: "audit@example.invalid", phone: "88001234", business_name: "ӨҮ студи", preferred_channel: "phone", answers: { schema_version: 1, q1: "Туршилтын Бат" }, consent_text_version: "test-v1", builder_type: "cafe", builder_style: "modern", builder_palette: "ocean", builder_primary: "#1F5F8B", builder_secondary: "#DCE6EE", builder_bg: "#F5F8FA", builder_name: "ӨҮ студи", builder_config: { schema_version: 1 } };
    const attachments = [{ field: "q22", client_ref: randomUUID(), original_name: "лого.png", size_bytes: 32, ext: "png", mime_type: "image/png" }];
    const create = async (payload: object, files: object[]) => (await db.query<{ value: { status: string; order_id: string; attachments: { storage_path: string }[] } }>("select public.create_website_order($1,$2,$3,now()+interval '1 day') as value", [payload, files, "b".repeat(64)])).rows[0].value;
    const created = await create(order, attachments);
    assert.equal(created.status, "created");assert.ok(created.attachments[0].storage_path.startsWith(created.order_id + "/"));
    const duplicate = await create(order, attachments);assert.equal(duplicate.status, "duplicate");assert.equal(duplicate.order_id, created.order_id);
    assert.equal((await create({ ...order, payload_hash: "c".repeat(64) }, attachments)).status, "conflict");
    assert.equal((await db.query<{ n: number }>("select count(*)::int n from website_orders")).rows[0].n, 1);
    await assert.rejects(create({ ...order, idempotency_key: randomUUID() }, [{ ...attachments[0], ext: "exe" }]), /invalid attachment extension/);
    assert.equal((await db.query<{ n: number }>("select count(*)::int n from website_orders")).rows[0].n, 1);
    await db.exec("set role anon");
    await assert.rejects(db.query("select * from website_orders"), /permission denied/);
    await assert.rejects(db.query("select * from template_files"), /permission denied/);
    await assert.rejects(db.query("select public.hit_rate_limit('anonymous',2,600)"), /permission denied/);
    await db.exec("reset role");
    const limits = [];
    for (let i = 0; i < 3; i++) limits.push((await db.query<{ allowed: boolean }>("select public.hit_rate_limit('test-window',2,600) allowed")).rows[0].allowed);
    assert.deepEqual(limits, [true,true,false]);
  } finally { await db.close(); }
});
