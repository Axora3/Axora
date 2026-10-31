"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DENIED, requireAdminAction, type ActionResult } from "@/lib/admin/auth";
import { ADMIN_MODULE_MIGRATION_HINT, isMissingMigration } from "@/lib/admin/db-errors";
import { PROJECT_STATUSES } from "@/lib/admin/projects";
import { isCalendarDate } from "@/lib/admin/dates";

const date = z.string().refine((value) => value === "" || isCalendarDate(value)).transform((value) => value || null);
const uuid = z.uuid();
const ERROR = { ok: false as const, code: "server", message: "Өөрчлөлт хадгалагдсангүй. Холболтоо шалгаад дахин оролдоно уу." };

function refreshProject(id?: string, orderId?: string) {
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/projects/${id}`);
  if (orderId) revalidatePath(`/admin/orders/${orderId}`);
}

function missing(error: { code?: string } | null) {
  return isMissingMigration(error) ? { ok: false as const, code: "migration", message: ADMIN_MODULE_MIGRATION_HINT } : ERROR;
}

/** Explicitly creates a project from an order; historical orders are never bulk converted. */
export async function createProjectForOrderAction(orderId: string): Promise<ActionResult<{ id: string; existing: boolean }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  if (!uuid.safeParse(orderId).success) return { ok: false, code: "invalid", message: "Захиалгын дугаар буруу байна." };
  const { data: order, error: orderError } = await ctx.db.from("website_orders").select("id").eq("id", orderId).maybeSingle();
  if (orderError) return ERROR;
  if (!order) return { ok: false, code: "not_found", message: "Захиалга олдсонгүй." };
  const { data: before, error: beforeError } = await ctx.db.from("website_projects").select("id").eq("order_id", orderId).maybeSingle();
  if (beforeError) return missing(beforeError);
  if (before) return { ok: true, id: before.id, existing: true };
  const { data, error } = await ctx.db.from("website_projects").insert({ order_id: orderId }).select("id").single();
  if (error) {
    // A second administrator may have created it between the read and insert.
    if (error.code === "23505") {
      const { data: current } = await ctx.db.from("website_projects").select("id").eq("order_id", orderId).maybeSingle();
      if (current) return { ok: true, id: current.id, existing: true };
    }
    return missing(error);
  }
  refreshProject(data.id, orderId);
  return { ok: true, id: data.id, existing: false };
}

const projectInput = z.object({
  id: uuid,
  expected: z.string().min(10),
  status: z.enum(PROJECT_STATUSES),
  description: z.string().trim().max(5000),
  startDate: date,
  targetDate: date,
  progress: z.number().int().min(0).max(100),
}).refine((value) => !value.startDate || !value.targetDate || value.targetDate >= value.startDate, { path: ["targetDate"] });

export async function saveProjectAction(input: z.input<typeof projectInput>): Promise<ActionResult<{ updatedAt: string }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = projectInput.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Төслийн мэдээллийг шалгана уу." };
  const { data, error } = await ctx.db.from("website_projects").update({
    status: p.data.status,
    description: p.data.description,
    start_date: p.data.startDate,
    target_completion_date: p.data.targetDate,
    progress_percent: p.data.progress,
  }).eq("id", p.data.id).eq("updated_at", p.data.expected).select("updated_at, order_id");
  if (error) return missing(error);
  if (!data?.length) return { ok: false, code: "conflict", message: "Төслийг өөр цонхноос шинэчилсэн байна. Хуудсаа сэргээнэ үү." };
  refreshProject(p.data.id, data[0].order_id);
  return { ok: true, updatedAt: data[0].updated_at };
}

const milestoneInput = z.object({ projectId: uuid, title: z.string().trim().min(1).max(160), description: z.string().trim().max(1200), dueOn: date });

export async function addProjectMilestoneAction(input: z.input<typeof milestoneInput>): Promise<ActionResult> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = milestoneInput.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Үе шатны нэрийг оруулж, бусад талбарыг шалгана уу." };
  const { data: order } = await ctx.db.from("website_projects").select("order_id").eq("id", p.data.projectId).maybeSingle();
  if (!order) return { ok: false, code: "not_found", message: "Төсөл олдсонгүй." };
  const { error } = await ctx.db.from("project_milestones").insert({ project_id: p.data.projectId, title: p.data.title, description: p.data.description, due_on: p.data.dueOn });
  if (error) return missing(error);
  refreshProject(p.data.projectId, order.order_id);
  return { ok: true };
}

const milestoneUpdate = milestoneInput.extend({ id: uuid, expected: z.string().min(10), completed: z.boolean() });

export async function updateProjectMilestoneAction(input: z.input<typeof milestoneUpdate>): Promise<ActionResult<{ updatedAt: string }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = milestoneUpdate.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Үе шатны талбаруудыг шалгана уу." };
  const { data: current, error: readError } = await ctx.db.from("project_milestones").select("completed_at, updated_at").eq("id", p.data.id).eq("project_id", p.data.projectId).maybeSingle();
  if (readError) return missing(readError);
  if (!current || current.updated_at !== p.data.expected) return { ok: false, code: "conflict", message: "Үе шат өөрчлөгдсөн байна. Хуудсаа сэргээнэ үү." };
  const { data, error } = await ctx.db.from("project_milestones").update({
    title: p.data.title,
    description: p.data.description,
    due_on: p.data.dueOn,
    completed_at: p.data.completed ? current.completed_at ?? new Date().toISOString() : null,
  }).eq("id", p.data.id).eq("project_id", p.data.projectId).eq("updated_at", p.data.expected).select("project_id, updated_at").maybeSingle();
  if (error) return missing(error);
  if (!data) return { ok: false, code: "conflict", message: "Үе шатыг өөр цонхноос шинэчилсэн байна. Хуудсаа сэргээнэ үү." };
  refreshProject(p.data.projectId);
  return { ok: true, updatedAt: data.updated_at };
}

const milestoneDelete = z.object({ id: uuid, projectId: uuid, expected: z.string().min(10) });

export async function deleteProjectMilestoneAction(input: z.input<typeof milestoneDelete>): Promise<ActionResult> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = milestoneDelete.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Үе шат олдсонгүй." };
  const { data, error } = await ctx.db.from("project_milestones").delete().eq("id", p.data.id).eq("project_id", p.data.projectId).eq("updated_at", p.data.expected).select("id");
  if (error) return missing(error);
  if (!data?.length) return { ok: false, code: "not_found", message: "Үе шат олдсонгүй эсвэл аль хэдийн өөрчлөгдсөн байна." };
  refreshProject(p.data.projectId);
  return { ok: true };
}
