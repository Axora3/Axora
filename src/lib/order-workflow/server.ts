import "server-only";
import { randomBytes } from "node:crypto";
import { adminClient } from "@/lib/supabase/server";
import type { Answers } from "@/lib/order/questions";
import {
  pricingPolicySchema,
  schedulingPolicySchema,
  type CustomerWorkflow,
} from "./contracts";
import { generateQuotation } from "./pricing";
import { suggestSchedule, type Workload } from "./scheduling";

export async function calculateForAnswers(answers: Answers) {
  const db = adminClient();
  const { data: s, error } = await db
    .from("website_workflow_settings")
    .select("pricing,version")
    .eq("id", 1)
    .single();
  if (error || !s) throw new Error("workflow_settings_unavailable");
  const draft = generateQuotation(
    answers,
    pricingPolicySchema.parse(s.pricing),
  );
  draft.pricingVersion = draft.pricingVersion ? `${draft.pricingVersion}:${s.version}` : null;
  return draft;
}
export async function initializeWorkflow(orderId: string, answers: Answers) {
  const db = adminClient();
  const draft = await calculateForAnswers(answers);
  const { error: e } = await db.rpc("website_order_initialize", {
    p_order: orderId,
    p_token: randomBytes(24).toString("base64url"),
    p_draft: draft,
  });
  if (e) throw new Error("workflow_initialize_failed");
  const { data: o, error: oe } = await db
    .from("website_orders")
    .select("payment_token")
    .eq("id", orderId)
    .single();
  if (oe || !o?.payment_token) throw new Error("workflow_tracking_unavailable");
  return "/order/pay/" + o.payment_token;
}
export async function customerWorkflow(
  token: string,
): Promise<CustomerWorkflow | null> {
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) return null;
  const { data, error } = await adminClient().rpc(
    "website_order_customer_view",
    { p_token: token },
  );
  if (error) throw new Error("workflow_unavailable");
  const workflow = data as CustomerWorkflow | null;
  if (workflow && !workflow.quote && workflow.order.payment_status !== "paid" && !workflow.order.quote_amount && workflow.order.status !== "cancelled" && workflow.answers) {
    await initializeWorkflow(workflow.order.id, workflow.answers);
    const refreshed = await adminClient().rpc("website_order_customer_view", {p_token: token});
    if(refreshed.error) throw new Error("workflow_unavailable");
    return refreshed.data as CustomerWorkflow;
  }
  return workflow;
}
export async function scheduleForOrder(orderId: string) {
  const db = adminClient();
  const { data: s, error } = await db
    .from("website_workflow_settings")
    .select("scheduling,schedule_revision,version")
    .eq("id", 1)
    .single();
  if (error || !s) throw new Error("workflow_settings_unavailable");
  const { data: q, error: qe } = await db
    .from("website_order_quotes")
    .select("estimated_effort_days,review_flags,requirements")
    .eq("order_id", orderId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: projects, error: pe } = await db
    .from("website_projects")
    .select(
      "id,order_id,status,estimated_effort_days,remaining_effort_days,schedule_buffer_days,target_completion_date,created_at,queue_priority",
    )
    .in("status", ["planning", "in_progress", "review", "on_hold"]);
  if (qe || pe)
    throw new Error(
      "workload_unavailable:" + (qe?.code ?? pe?.code ?? "unknown"),
    );
  const workloads: Workload[] = (projects ?? [])
    .filter((p) => p.order_id !== orderId)
    .map((p) => ({
      id: p.id,
      effortDays: p.estimated_effort_days,
      remainingDays: p.remaining_effort_days,
      bufferDays: p.schedule_buffer_days,
      deadline: p.target_completion_date,
      receivedAt: p.created_at,
      priority: p.queue_priority,
    }));
  const suggestion = suggestSchedule(
    q?.estimated_effort_days ?? null,
    workloads,
    schedulingPolicySchema.parse(s.scheduling),
  );
  if (q?.requirements?.urgent) {
    suggestion.approximate = true;
    suggestion.explanations.push("Яаралтай хугацааг админ тусад нь батална.");
  }
  return {
    suggestion,
    activeCount: (projects??[]).filter(p=>p.order_id!==orderId&&p.status==='in_progress').length,
    queuedCount: (projects??[]).filter(p=>p.order_id!==orderId&&p.status!=='in_progress').length,
    revision: Number(s.schedule_revision),
    effortDays: q?.estimated_effort_days ?? null,
  };
}
