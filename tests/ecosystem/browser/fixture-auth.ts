import { expect, type BrowserContext } from "@playwright/test";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/** Local fixture tokens only; never valid against production Supabase. */
export async function login(context: BrowserContext, url='http://127.0.0.1:43234') {
  const jwt = [
    { alg: "HS256", typ: "JWT" },
    { sub: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 7200 },
  ].map(v => Buffer.from(JSON.stringify(v)).toString("base64url")).join(".") + "." + Buffer.from("fixture-only-signature").toString("base64url");
  let values: Array<{ name: string; value: string; options?: CookieOptions }> = [];
  const client = createServerClient(url, "fixture-anon-key", {
    cookies: { getAll: () => [], setAll: cookies => { values = cookies; } },
  });
  expect((await client.auth.setSession({ access_token: jwt, refresh_token: "fixture-refresh" })).error).toBeNull();
  await context.addCookies(values.map(c => ({ name: c.name, value: c.value, domain: "localhost", path: "/", sameSite: "Lax" as const })));
}
