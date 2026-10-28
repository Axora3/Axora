"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DENIED, requireAdminAction, type ActionFail, type ActionResult } from "@/lib/admin/auth";
import { ORDER_STATUSES, REQUEST_STATUSES } from "@/lib/admin/labels";
import { adminClient, BUCKETS, isBackendConfigured } from "@/lib/supabase/server";

/*
 * Every action re-checks admin rights on the server and then uses the admin's
 * own session client, so RLS + column grants are the second line of defence.
 * Concurrency: writes include the updated_at the editor loaded; if another
 * tab saved in between, nothing is overwritten and the admin is told to refresh.
 */

const CONFLICT: ActionFail = { ok: false, code: "conflict", message: "Энэ мэдээллийг өөр цонхноос өөрчилсөн байна. Хуудсыг дахин ачаалж шинэ утгыг шалгаад дахин хадгална уу." };
const FAILED: ActionFail = { ok: false, code: "server", message: "Хадгалж чадсангүй. Таны оруулсан утга хэвээр байна — дахин оролдоно уу." };

const date = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).transform((v) => v || null);

const orderUpdate = z.object({
  id: z.uuid(),
  expected: z.string().min(10),
  status: z.enum(ORDER_STATUSES),
  agreed_deadline: date,
  next_contact_on: date,
});

export async function updateOrderAction(input: z.input<typeof orderUpdate>): Promise<ActionResult<{ updatedAt: string }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = orderUpdate.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Утга буруу байна." };
  const { id, expected, ...patch } = p.data;
  const { data, error } = await ctx.db.from("website_orders").update(patch).eq("id", id).eq("updated_at", expected).select("updated_at");
  if (error) {
    console.error("[admin] order update:", error.code);
    return FAILED;
  }
  if (!data?.length) return CONFLICT;
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, updatedAt: data[0].updated_at };
}

const reqUpdate = z.object({ id: z.uuid(), expected: z.string().min(10), status: z.enum(REQUEST_STATUSES) });

export async function updateRequestAction(input: z.input<typeof reqUpdate>): Promise<ActionResult<{ updatedAt: string }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = reqUpdate.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Утга буруу байна." };
  const { data, error } = await ctx.db.from("template_requests").update({ status: p.data.status }).eq("id", p.data.id).eq("updated_at", p.data.expected).select("updated_at");
  if (error) return FAILED;
  if (!data?.length) return CONFLICT;
  revalidatePath(`/admin/template-requests/${p.data.id}`);
  revalidatePath("/admin/template-requests");
  revalidatePath("/admin");
  return { ok: true, updatedAt: data[0].updated_at };
}

const note = z.object({ entityType: z.enum(["order", "template_request"]), entityId: z.uuid(), body: z.string().trim().min(1).max(4000) });

export async function addNoteAction(input: z.input<typeof note>): Promise<ActionResult> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = note.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Тэмдэглэл хоосон эсвэл хэт урт байна." };
  const { error } = await ctx.db.from("admin_notes").insert({ entity_type: p.data.entityType, entity_id: p.data.entityId, body: p.data.body });
  if (error) return FAILED;
  revalidatePath(p.data.entityType === "order" ? `/admin/orders/${p.data.entityId}` : `/admin/template-requests/${p.data.entityId}`);
  return { ok: true };
}

/** Short-lived signed URL for one private attachment, after an admin check. */
export async function signAttachmentAction(attachmentId: string, mode: "view" | "download"): Promise<ActionResult<{ url: string }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  if (!z.uuid().safeParse(attachmentId).success) return { ok: false, code: "invalid", message: "Хавсралт олдсонгүй." };
  const { data: att } = await ctx.db.from("order_attachments").select("storage_path, original_name, upload_status").eq("id", attachmentId).maybeSingle();
  if (!att) return { ok: false, code: "not_found", message: "Хавсралт олдсонгүй." };
  if (att.upload_status !== "uploaded") return { ok: false, code: "not_uploaded", message: "Энэ файл серверт бүрэн хүрээгүй байна." };
  const { data, error } = await ctx.db.storage
    .from(BUCKETS.attachments)
    .createSignedUrl(att.storage_path, 120, mode === "download" ? { download: att.original_name } : undefined);
  if (error || !data) return { ok: false, code: "server", message: "Холбоос үүсгэж чадсангүй." };
  return { ok: true, url: data.signedUrl };
}

/**
 * Creates a time-limited link to a template's private file for the admin to
 * send by hand. It does not send anything and does not mark anything paid.
 */
export async function createDownloadLinkAction(requestId: string, hours: number): Promise<ActionResult<{ url: string; expiresAt: string | null; external: boolean }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  if (!z.uuid().safeParse(requestId).success || ![24, 72, 168].includes(hours)) return { ok: false, code: "invalid", message: "Утга буруу байна." };
  const { data: req } = await ctx.db.from("template_requests").select("template_id").eq("id", requestId).maybeSingle();
  if (!req) return { ok: false, code: "not_found", message: "Хүсэлт олдсонгүй." };
  const { data: file } = await ctx.db.from("template_files").select("storage_path, external_url").eq("template_id", req.template_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!file) return { ok: false, code: "no_file", message: "Энэ загварт хамгаалагдсан файл эсвэл холбоос бүртгэгдээгүй байна. Загварын засварт нэмнэ үү." };
  let url = file.external_url as string | null;
  let expiresAt: string | null = null;
  if (file.storage_path) {
    const { data, error } = await ctx.db.storage.from(BUCKETS.templateFiles).createSignedUrl(file.storage_path, hours * 3600, { download: true });
    if (error || !data) return { ok: false, code: "server", message: "Холбоос үүсгэж чадсангүй." };
    url = data.signedUrl;
    expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  }
  if (isBackendConfigured()) {
    // The URL itself is never written to the audit log.
    await adminClient().rpc("log_admin_action", { p_actor: ctx.user.id, p_action: "download_link_created", p_entity: "template_request", p_entity_id: requestId, p_details: { hours: file.storage_path ? hours : null } });
  }
  return { ok: true, url: url!, expiresAt, external: !file.storage_path };
}
