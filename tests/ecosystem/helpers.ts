import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
export const adminId = "00000000-0000-4000-8000-000000000001",
  userA = "00000000-0000-4000-8000-000000000002",
  userB = "00000000-0000-4000-8000-000000000003";
export async function database() {
  const db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table public.admin_users(user_id uuid primary key references auth.users(id));create function public.is_admin()returns boolean language sql security definer as $$select exists(select 1 from public.admin_users where user_id=auth.uid())$$;create table public.website_orders(id uuid primary key,full_name text,email text,phone text,business_name text,reference text,answers jsonb default '{}',status text default 'new',created_at timestamptz default now());create table public.website_projects(id uuid primary key default gen_random_uuid(),order_id uuid unique references public.website_orders(id),created_by uuid references auth.users(id));grant usage on schema public,auth to anon,authenticated,service_role;insert into auth.users values('${adminId}'),('${userA}'),('${userB}');insert into public.admin_users values('${adminId}');`,
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20261111000000_ecosystem_integration.sql",
      "utf8",
    ),
  );
  return db;
}
export async function command(
  db: PGlite,
  action: string,
  site: string | null,
  data: Record<string, unknown> = {},
  key = randomUUID(),
) {
  return (
    await db.query<{ result: Record<string, unknown> }>(
      "select public.ecosystem_command($1,$2,$3,$4,$5) as result",
      [action, site, data, key, adminId],
    )
  ).rows[0]!.result;
}
export async function register(db: PGlite, email = "a@example.invalid") {
  const order = randomUUID();
  await db.query(
    "insert into website_orders(id,full_name,email,phone,business_name,reference)values($1,$2,$3,$4,$5,$6)",
    [
      order,
      "Fixture customer",
      email,
      "99999999",
      "Fixture business",
      "FIXTURE-" + order.slice(0, 6),
    ],
  );
  const r = await command(db, "register", null, { orderId: order });
  return { id: String(r.site_id), order };
}
export async function finish(
  db: PGlite,
  site: string,
  kind: string,
  receipt: Record<string, unknown>,
  payload: Record<string, unknown> = {},
) {
  const id = randomUUID(),
    owner = randomUUID();
  await db.query(
    "insert into ecosystem_tasks(id,site_id,kind,payload,request_key,status,attempts,lease_owner,lease_until)values($1,$2,$3,$4,$5,'running',1,$6,now()+interval '2 minutes')",
    [id, site, kind, payload, randomUUID(), owner],
  );
  await db.query("select ecosystem_finish($1,$2,$3,null,false)", [
    id,
    owner,
    receipt,
  ]);
  return id;
}
export async function linkFactory(
  db: PGlite,
  s: { id: string; order: string },
) {
  const remoteOrder = randomUUID(),
    remoteProject = randomUUID();
  await finish(db, s.id, "factory_submit", {
    order: { id: remoteOrder, externalId: s.order, answers: { siteId: s.id } },
    options: { missing: [], matches: [] },
  });
  return { remoteOrder, remoteProject };
}
export function project(
  s: { id: string },
  f: { remoteOrder: string; remoteProject: string },
  status = "preview_pending",
  at: string | null = null,
) {
  return {
    id: f.remoteProject,
    orderId: f.remoteOrder,
    siteId: s.id,
    status,
    sourceHash: "a".repeat(64),
    commit: "b".repeat(40),
    qa: null,
    preview: null,
    approval: null,
    delivery: at
      ? {
          reference: "Fixture confirmed delivery evidence",
          actor: "fixture-admin",
          at,
        }
      : null,
    lastError: null,
  };
}
