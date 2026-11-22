import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
const db = new PGlite();
await db.exec(
  `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table public.admin_users(user_id uuid primary key references auth.users(id));create function public.is_admin()returns boolean language sql security definer as $$select exists(select 1 from public.admin_users where user_id=auth.uid())$$;create table public.website_orders(id uuid primary key,full_name text,email text,phone text);create table public.website_projects(id uuid primary key default gen_random_uuid(),order_id uuid unique references public.website_orders(id),created_by uuid references auth.users(id));grant usage on schema public,auth to anon,authenticated,service_role;`,
);
try {
  await db.exec(
    await readFile(
      "supabase/migrations/20261111000000_ecosystem_integration.sql",
      "utf8",
    ),
  );
  console.log("Disposable PostgreSQL migration: PASS");
} catch (e) {
  console.error("Migration error:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await db.close();
}
