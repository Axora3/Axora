"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DENIED, requireAdminAction, type ActionFail, type ActionResult } from "@/lib/admin/auth";
import { ORDER_STATUS, ORDER_STATUSES, REQUEST_STATUS, REQUEST_STATUSES } from "@/lib/admin/labels";
import { canOrderTransition, canRequestTransition, orderTransitionHint, requestTransitionHint } from "@/lib/admin/transitions";
import { BUCKETS } from "@/lib/supabase/server";

/*
 * Every action re-checks admin rights on the server and then uses the admin's
 * own session client, so RLS + column grants + triggers are further lines of
 * defence. Concurrency: writes include the updated_at the screen loaded; if
 * another tab saved in between, nothing is overwritten and the admin is told
 * to refresh. A repeated click with a stale updated_at is a no-op conflict.
 */

const CONFLICT: ActionFail = { ok: false, code: "conflict", message: "Энэ мэдээллийг өөр цонхноос өөрчилсөн байна. Хуудсыг дахин ачаалж шинэ утгыг шалгаад дахин хадгална уу." };
const FAILED: ActionFail = { ok: false, code: "server", message: "Хадгалж чадсангүй. Өмнөх утга хэвээр байна — дахин оролдоно уу." };

type DbError = { code?: string; message?: string; details?: string } | null;

/** Maps errors raised by the database guards to admin-facing text. */
function guardFail(error: DbError): ActionFail | null {
  if (error?.code !== "P0001") return null;
  if (error.message === "invalid_transition") return { ok: false, code: "transition", message: "Энэ төлөв рүү шууд шилжих боломжгүй." };
  if (error.message === "payment_not_confirmed") return { ok: false, code: "payment", message: "Төлбөр баталгаажаагүй тул “Хүргэж дууссан” болгох боломжгүй." };
  return null;
}

/** Refreshes list, detail, dashboard and the nav badges (layout). */
function revalidateAdmin(...paths: string[]) {
  for (const p of paths) revalidatePath(p);
  revalidatePath("/admin", "layout");
}

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
  const { data: cur } = await ctx.db.from("website_orders").select("status").eq("id", id).maybeSingle();
  if (!cur) return { ok: false, code: "not_found", message: "Захиалга олдсонгүй." };
  if (cur.status !== patch.status && !canOrderTransition(cur.status, patch.status)) {
    return { ok: false, code: "transition", message: orderTransitionHint(cur.status, patch.status) ?? "Энэ төлөв рүү шилжих боломжгүй." };
  }
  const { data, error } = await ctx.db.from("website_orders").update(patch).eq("id", id).eq("updated_at", expected).select("updated_at");
  if (error) {
    console.error("[admin] order update:", error.code);
    return guardFail(error) ?? FAILED;
  }
  if (!data?.length) return CONFLICT;
  revalidateAdmin(`/admin/orders/${id}`, "/admin/orders", "/admin");
  return { ok: true, updatedAt: data[0].updated_at };
}

const orderStatus = z.object({ id: z.uuid(), expected: z.string().min(10), status: z.enum(ORDER_STATUSES) });

/** Status only (mobile sheet, list). Used for undo as well. */
export async function setOrderStatusAction(input: z.input<typeof orderStatus>): Promise<ActionResult<{ updatedAt: string; from: string }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = orderStatus.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Утга буруу байна." };
  const { data: cur } = await ctx.db.from("website_orders").select("status, updated_at").eq("id", p.data.id).maybeSingle();
  if (!cur) return { ok: false, code: "not_found", message: "Захиалга олдсонгүй." };
  // Same target already saved (double tap / second tab): report success, write nothing.
  if (cur.status === p.data.status) return { ok: true, updatedAt: cur.updated_at, from: cur.status };
  if (cur.updated_at !== p.data.expected) return CONFLICT;
  if (!canOrderTransition(cur.status, p.data.status)) {
    return { ok: false, code: "transition", message: orderTransitionHint(cur.status, p.data.status) ?? `“${ORDER_STATUS[p.data.status].label}” руу шилжих боломжгүй.` };
  }
  const { data, error } = await ctx.db.from("website_orders").update({ status: p.data.status }).eq("id", p.data.id).eq("updated_at", p.data.expected).select("updated_at");
  if (error) {
    console.error("[admin] order status:", error.code);
    return guardFail(error) ?? FAILED;
  }
  if (!data?.length) return CONFLICT;
  revalidateAdmin(`/admin/orders/${p.data.id}`, "/admin/orders", "/admin");
  return { ok: true, updatedAt: data[0].updated_at, from: cur.status };
}

const reqUpdate = z.object({ id: z.uuid(), expected: z.string().min(10), status: z.enum(REQUEST_STATUSES) });

export async function updateRequestAction(input: z.input<typeof reqUpdate>): Promise<ActionResult<{ updatedAt: string; from: string }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = reqUpdate.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Утга буруу байна." };
  const { data: cur } = await ctx.db.from("template_requests").select("status, payment_status, updated_at").eq("id", p.data.id).maybeSingle();
  if (!cur) return { ok: false, code: "not_found", message: "Хүсэлт олдсонгүй." };
  if (cur.status === p.data.status) return { ok: true, updatedAt: cur.updated_at, from: cur.status };
  if (cur.updated_at !== p.data.expected) return CONFLICT;
  if (!canRequestTransition(cur.status, p.data.status, cur.payment_status)) {
    return {
      ok: false,
      code: "transition",
      message: requestTransitionHint(cur.status, p.data.status, cur.payment_status) ?? `“${REQUEST_STATUS[p.data.status].label}” руу шилжих боломжгүй.`,
    };
  }
  const { data, error } = await ctx.db.from("template_requests").update({ status: p.data.status }).eq("id", p.data.id).eq("updated_at", p.data.expected).select("updated_at");
  if (error) return guardFail(error) ?? FAILED;
  if (!data?.length) return CONFLICT;
  revalidateAdmin(`/admin/template-requests/${p.data.id}`, "/admin/template-requests", "/admin");
  return { ok: true, updatedAt: data[0].updated_at, from: cur.status };
}

const payment = z.object({
  id: z.uuid(),
  // Required only for older requests without a price snapshot.
  amount: z.number().positive().max(100_000_000).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
});

/**
 * Manual payment confirmation. The database function checks admin rights,
 * locks the row (double clicks resolve to "already confirmed") and writes
 * who/when/how much plus an audit entry in one transaction.
 */
export async function confirmPaymentAction(input: z.input<typeof payment>): Promise<ActionResult<{ already: boolean; amount: number; currency: string }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = payment.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Дүн эсвэл валют буруу байна." };
  const { data, error } = await ctx.db.rpc("confirm_template_payment", { p_request: p.data.id, p_amount: p.data.amount, p_currency: p.data.currency });
  if (error) {
    console.error("[admin] confirm payment:", error.code);
    if (error.code === "PGRST202") return { ok: false, code: "migration", message: "Төлбөрийн migration ажиллаагүй байна. README-ийн дагуу 20261029000000 migration-ыг ажиллуулна уу." };
    return FAILED;
  }
  const r = data as { status: string; amount?: number; currency?: string };
  const messages: Record<string, string> = {
    forbidden: DENIED.message,
    not_found: "Хүсэлт олдсонгүй.",
    not_required: "Энэ хүсэлт үнэгүй бүтээгдэхүүнийх — төлбөр шаардлагагүй.",
    cancelled: "Цуцлагдсан хүсэлтийн төлбөрийг баталгаажуулахгүй.",
    amount_required: "Энэ хүсэлтэд анхны үнэ хадгалагдаагүй. Тохиролцсон дүн, валютаа оруулна уу.",
    amount_mismatch: "Үнэ дэлгэцэн дээрхээс өөр байна. Хуудсыг шинэчлээд дахин шалгана уу.",
  };
  if (r.status !== "confirmed" && r.status !== "already_confirmed") {
    return { ok: false, code: r.status, message: messages[r.status] ?? FAILED.message };
  }
  revalidateAdmin(`/admin/template-requests/${p.data.id}`, "/admin/template-requests", "/admin");
  return { ok: true, already: r.status === "already_confirmed", amount: Number(r.amount ?? 0), currency: r.currency ?? "MNT" };
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
 * Creates a time-limited link to a product's private file for the admin to
 * send by hand. Before anything is signed the database checks, in one place:
 * admin rights, request ↔ product, free/paid, manual payment confirmation and
 * that a delivery file exists. Creating a link is recorded as "link created"
 * only — it is not "sent" and not "downloaded".
 */
export async function createDownloadLinkAction(requestId: string, hours: number): Promise<ActionResult<{ url: string; expiresAt: string | null; external: boolean }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  if (!z.uuid().safeParse(requestId).success || ![24, 72, 168].includes(hours)) return { ok: false, code: "invalid", message: "Утга буруу байна." };

  const { data: gate, error: gateErr } = await ctx.db.rpc("authorize_delivery_link", { p_request: requestId });
  if (gateErr) {
    console.error("[admin] delivery gate:", gateErr.code);
    if (gateErr.code === "PGRST202") return { ok: false, code: "migration", message: "Хүргэлтийн migration ажиллаагүй байна. README-ийн дагуу 20261029000000 migration-ыг ажиллуулна уу." };
    return { ok: false, code: "server", message: "Эрх шалгаж чадсангүй. Дахин оролдоно уу." };
  }
  const g = gate as { status: string; storage_path?: string | null; external_url?: string | null };
  const refusals: Record<string, string> = {
    forbidden: DENIED.message,
    not_found: "Хүсэлт олдсонгүй.",
    cancelled: "Цуцлагдсан хүсэлтэд холбоос үүсгэхгүй.",
    no_template: "Хүсэлтийн бүтээгдэхүүн олдсонгүй.",
    payment_not_confirmed: "Төлбөр баталгаажаагүй байна. Эхлээд “Төлбөр баталгаажсан” үйлдлийг хийнэ үү.",
    no_file: "Энэ бүтээгдэхүүнд хамгаалагдсан файл бүртгэгдээгүй байна. Бүтээгдэхүүний засварт файл нэмнэ үү.",
  };
  if (g.status !== "ok") return { ok: false, code: g.status, message: refusals[g.status] ?? "Холбоос үүсгэх боломжгүй." };

  let url = g.external_url ?? null;
  let expiresAt: string | null = null;
  if (g.storage_path) {
    // Fails if the object is missing — the link is never created for a file that is not there.
    const { data, error } = await ctx.db.storage.from(BUCKETS.templateFiles).createSignedUrl(g.storage_path, hours * 3600, { download: true });
    if (error || !data) return { ok: false, code: "file_missing", message: "Хамгаалагдсан файл storage-д олдсонгүй. Бүтээгдэхүүний файлыг дахин upload хийнэ үү." };
    url = data.signedUrl;
    expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  }
  if (!url) return { ok: false, code: "no_file", message: refusals.no_file };

  // The URL itself is never stored or logged.
  const { error: recErr } = await ctx.db.rpc("record_delivery_link", { p_request: requestId, p_hours: g.storage_path ? hours : null });
  if (recErr) console.error("[admin] record delivery link:", recErr.code);
  revalidateAdmin(`/admin/template-requests/${requestId}`, "/admin/template-requests");
  return { ok: true, url, expiresAt, external: !g.storage_path };
}
