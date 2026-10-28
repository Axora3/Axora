import "server-only";
import { adminClient } from "@/lib/supabase/server";

export type IdempotentResult = { kind: "created" | "duplicate" } | { kind: "conflict" } | { kind: "error" };

/**
 * Inserts a row guarded by a UNIQUE idempotency_key column.
 * Same key + same payload hash → treated as the same submission.
 * Same key + different hash → conflict, nothing is written.
 */
export async function idempotentInsert(
  table: "template_requests" | "contact_messages",
  row: Record<string, unknown> & { idempotency_key: string; payload_hash: string },
): Promise<IdempotentResult> {
  const db = adminClient();
  const { error } = await db.from(table).insert(row);
  if (!error) return { kind: "created" };
  if (error.code !== "23505") {
    console.error(`[${table}] insert failed:`, error.code);
    return { kind: "error" };
  }
  const { data, error: e2 } = await db.from(table).select("payload_hash").eq("idempotency_key", row.idempotency_key).maybeSingle();
  if (e2 || !data) {
    console.error(`[${table}] duplicate lookup failed:`, e2?.code);
    return { kind: "error" };
  }
  return data.payload_hash === row.payload_hash ? { kind: "duplicate" } : { kind: "conflict" };
}
