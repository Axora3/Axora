import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
export const workflowAdmin = "00000000-0000-4000-8000-000000000001";
export async function workflowDatabase() {
  const db = new PGlite();
  await db.exec(
    "create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;create schema storage;create table storage.objects(id uuid,bucket_id text,name text);alter table storage.objects enable row level security;",
  );
  const base = await readFile(
    "supabase/migrations/20261028000000_axora_schema.sql",
    "utf8",
  );
  await db.exec(
    base
      .slice(0, base.indexOf("-- Storage buckets"))
      .replace("create extension if not exists pgcrypto;", ""),
  );
  for (const file of [
    "20261028100000_admin_panel.sql",
    "20261029000000_payments_delivery_guards.sql",
    "20261031000000_admin_modules.sql",
    "20261031100000_admin_workflow_hardening.sql",
    "20261106000000_order_payment.sql",
    "20261125000000_order_workflow.sql",
    "20261125100000_catalog_publish_guard.sql",
    "20261125200000_workflow_recovery.sql",
    "20261125210000_email_receipts.sql",
    "20261126000000_instant_quotation.sql",
  ])
    await db.exec(await readFile("supabase/migrations/" + file, "utf8"));
  return db;
}
