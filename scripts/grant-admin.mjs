#!/usr/bin/env node
/**
 * Grants (or revokes) admin rights for an EXISTING Supabase Auth user.
 * Runs with the service-role key on your machine — there is no public signup
 * and no way to become admin from the website.
 *
 *   node --env-file=.env.local scripts/grant-admin.mjs owner@example.com
 *   node --env-file=.env.local scripts/grant-admin.mjs owner@example.com --revoke
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
const revoke = process.argv.includes("--revoke");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!email || !url || !key) {
  console.error("Usage: node --env-file=.env.local scripts/grant-admin.mjs <email> [--revoke]  (needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

let user = null;
for (let page = 1; page <= 50 && !user; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  user = data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
  if (data.users.length < 200) break;
}
if (!user) {
  console.error(`No Auth user with email ${email}. Create it first in Supabase Dashboard → Authentication → Users.`);
  process.exit(1);
}

const { error } = revoke
  ? await db.from("admin_users").delete().eq("user_id", user.id)
  : await db.from("admin_users").upsert({ user_id: user.id }, { onConflict: "user_id" });
if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}
console.log(revoke ? `Admin rights removed from ${email}.` : `${email} is now an admin.`);
