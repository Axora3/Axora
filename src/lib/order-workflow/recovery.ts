import "server-only";
import { adminClient } from "@/lib/supabase/server";
import { initializeWorkflow } from "./server";
import type { Answers } from "@/lib/order/questions";

/** Only orders explicitly requesting the new quotation workflow are recovered.
 * Historical quotes and accepted snapshots are never bulk converted/repriced. */
export async function recoverPendingQuotations(limit = 10) {
  const db = adminClient();
  const { data: settings, error: settingsError } = await db
    .from("website_workflow_settings")
    .select("id")
    .eq("id", 1)
    .maybeSingle();
  if (settingsError || !settings)
    return { available: false, recovered: 0, failed: 0 };
  const { data: orders, error } = await db
    .from("website_orders")
    .select("id,answers")
    .eq("workflow_managed", false)
    .eq("answers->>quotation_requested", "true")
    .in("status", ["new", "contacted"])
    .order("created_at", { ascending: true })
    .limit(Math.min(20, Math.max(1, limit)));
  if (error) throw new Error("quotation_recovery_unavailable");
  let recovered = 0,
    failed = 0;
  for (const order of orders ?? [])
    try {
      await initializeWorkflow(order.id, order.answers as Answers);
      recovered++;
    } catch {
      failed++;
    }
  return { available: true, recovered, failed };
}
