import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isCatalogConfigured, supabaseUrl } from "@/lib/supabase/server";

/**
 * Supabase client bound to the signed-in admin's session (anon key + JWT
 * from cookies). Every query through it is checked by RLS (public.is_admin()),
 * so even a bug in a page cannot read data the database would refuse.
 */
export async function sessionClient(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(supabaseUrl()!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component — the proxy refreshes cookies */
        }
      },
    },
  });
}

export type AdminContext = { db: SupabaseClient; user: User };

type Check = { kind: "ok"; ctx: AdminContext } | { kind: "no-config" } | { kind: "anon" } | { kind: "forbidden"; email: string | null } | { kind: "error" };

/**
 * Signed in ≠ admin. Membership comes from public.admin_users, which only
 * the service role can write — never from user metadata or the browser.
 */
export async function checkAdmin(): Promise<Check> {
  // Always evaluated per request — never baked into a static shell.
  await connection();
  if (!isCatalogConfigured()) return { kind: "no-config" };
  const db = await sessionClient();
  // getUser() validates the JWT with Supabase Auth (getSession() would trust the cookie).
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return { kind: "anon" };
  const { data: isAdmin, error: rpcErr } = await db.rpc("is_admin");
  if (rpcErr) {
    console.error("[admin] is_admin failed:", rpcErr.code);
    return { kind: "error" };
  }
  if (isAdmin !== true) return { kind: "forbidden", email: data.user.email ?? null };
  return { kind: "ok", ctx: { db, user: data.user } };
}

/** For admin pages: redirects anonymous visitors to the login page. */
export async function requireAdminPage(): Promise<Check & { kind: "ok" | "forbidden" | "error" | "no-config" }> {
  const c = await checkAdmin();
  if (c.kind === "anon") redirect("/admin/login?reason=signin");
  return c as Check & { kind: "ok" | "forbidden" | "error" | "no-config" };
}

export type ActionFail = { ok: false; code: string; message: string };
export type ActionResult<T = object> = ({ ok: true } & T) | ActionFail;

export const DENIED: ActionFail = { ok: false, code: "forbidden", message: "Админ эрх шаардлагатай. Дахин нэвтэрнэ үү." };

/** For Server Actions: never trust that the page already checked. */
export async function requireAdminAction(): Promise<AdminContext | null> {
  const c = await checkAdmin();
  return c.kind === "ok" ? c.ctx : null;
}
