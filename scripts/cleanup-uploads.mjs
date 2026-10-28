#!/usr/bin/env node
/**
 * Cleans up attachment uploads that never completed.
 *
 *  1. Marks `order_attachments` rows still pending/failed after N hours as
 *     "expired" (DB function expire_stale_attachments) and deletes their objects.
 *  2. Lists every object in the private "order-attachments" bucket and deletes
 *     objects that no attachment row references (orphans), older than N hours.
 *
 * Usage (reads .env.local values from the environment):
 *   node --env-file=.env.local scripts/cleanup-uploads.mjs            # dry run
 *   node --env-file=.env.local scripts/cleanup-uploads.mjs --apply    # delete
 *   node --env-file=.env.local scripts/cleanup-uploads.mjs --apply --hours=48
 */
import { createClient } from "@supabase/supabase-js";

const BUCKET = "order-attachments";
const apply = process.argv.includes("--apply");
const hours = Number((process.argv.find((a) => a.startsWith("--hours=")) ?? "--hours=24").split("=")[1]) || 24;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const cutoff = Date.now() - hours * 3600 * 1000;

async function removePaths(paths, why) {
  if (!paths.length) return;
  console.log(`${apply ? "Deleting" : "Would delete"} ${paths.length} object(s) — ${why}`);
  paths.forEach((p) => console.log("  ", p));
  if (!apply) return;
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await db.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (error) console.error("  remove failed:", error.message);
  }
}

// 1) Stale rows → expired (only when applying; the function writes).
if (apply) {
  const { data, error } = await db.rpc("expire_stale_attachments", { p_older_than: `${hours} hours` });
  if (error) {
    console.error("expire_stale_attachments failed:", error.message);
    process.exit(1);
  }
  await removePaths((data ?? []).map((r) => r.storage_path), "unfinished uploads");
} else {
  const { data } = await db
    .from("order_attachments")
    .select("storage_path, created_at")
    .in("upload_status", ["pending", "failed"])
    .lt("created_at", new Date(cutoff).toISOString());
  await removePaths((data ?? []).map((r) => r.storage_path), "unfinished uploads (rows would be marked expired)");
}

// 2) Orphans: objects without a row.
const known = new Set();
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from("order_attachments").select("storage_path").range(from, from + 999);
  if (error) throw error;
  data.forEach((r) => known.add(r.storage_path));
  if (data.length < 1000) break;
}
const orphans = [];
const { data: folders, error: lErr } = await db.storage.from(BUCKET).list("", { limit: 1000 });
if (lErr) throw lErr;
for (const folder of folders ?? []) {
  const { data: objs } = await db.storage.from(BUCKET).list(folder.name, { limit: 1000 });
  for (const o of objs ?? []) {
    const path = `${folder.name}/${o.name}`;
    const created = o.created_at ? new Date(o.created_at).getTime() : 0;
    if (!known.has(path) && created < cutoff) orphans.push(path);
  }
}
await removePaths(orphans, "objects with no attachment row");
console.log(apply ? "Done." : "Dry run only. Re-run with --apply to delete.");
