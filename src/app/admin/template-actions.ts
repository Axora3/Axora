"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DENIED, requireAdminAction, type ActionResult } from "@/lib/admin/auth";
import { FILE_MAX, PREVIEW_EXT, PREVIEW_MAX, templateForm, validateTemplate, type FormErrors } from "@/lib/admin/template-schema";
import { BUCKETS } from "@/lib/supabase/server";

type SaveResult = ActionResult<{ id: string; updatedAt: string; status: string }> & { errors?: FormErrors };

const saveInput = z.object({
  id: z.uuid().nullable(),
  expected: z.string().nullable(),
  mode: z.enum(["draft", "publish", "unpublish"]),
  form: templateForm,
});

function revalidatePublic(...slugs: (string | null | undefined)[]) {
  revalidatePath("/templates");
  revalidatePath("/");
  for (const s of new Set(slugs.filter(Boolean))) revalidatePath(`/templates/${s}`);
}

export async function saveTemplateAction(input: z.input<typeof saveInput>): Promise<SaveResult> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const parsed = saveInput.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid", message: "Зарим утга буруу форматтай байна." };
  const { id, expected, mode, form } = parsed.data;
  const errors = validateTemplate(form, mode === "publish" ? "publish" : "draft");
  if (Object.keys(errors).length) return { ok: false, code: "validation", message: mode === "publish" ? "Нийтлэхийн өмнө дутуу талбаруудыг бөглөнө үү." : "Засах шаардлагатай талбар байна.", errors };

  const db = ctx.db;
  let prevSlug: string | null = null;
  let status = "draft";
  if (id) {
    const { data: cur } = await db.from("templates").select("slug, status").eq("id", id).maybeSingle();
    if (!cur) return { ok: false, code: "not_found", message: "Загвар олдсонгүй." };
    prevSlug = cur.slug;
    status = cur.status;
  }
  if (mode === "publish") status = "published";
  if (mode === "unpublish") status = "draft";

  const row = {
    title: form.title,
    slug: form.slug,
    category: form.category,
    short_description: form.shortDescription,
    long_description: form.longDescription,
    is_free: form.isFree,
    price: form.isFree ? 0 : form.price,
    currency: form.currency,
    for_whom: form.forWhom,
    included: form.included,
    how_to: form.howTo,
    requirements: form.requirements,
    format: form.format,
    sort_order: form.sortOrder,
    preview_images: form.previewImages,
    status,
    is_demo: false,
  };

  const q = id
    ? db.from("templates").update(row).eq("id", id).eq("updated_at", expected ?? "").select("id, updated_at, status")
    : db.from("templates").insert(row).select("id, updated_at, status");
  const { data, error } = await q;
  if (error) {
    if (error.code === "23505") return { ok: false, code: "validation", message: "Энэ slug өөр загварт ашиглагдсан байна.", errors: { slug: "Энэ slug давхцаж байна. Өөр утга оруулна уу." } };
    if (error.code === "23514") return { ok: false, code: "validation", message: "Үнэ болон “үнэгүй” тохиргоо зөрчилтэй байна.", errors: { price: "Үнэ болон үнэгүй эсэхийг шалгана уу." } };
    console.error("[admin] template save:", error.code);
    return { ok: false, code: "server", message: "Хадгалж чадсангүй. Таны засвар editor дээр хэвээр байна — дахин оролдоно уу." };
  }
  if (!data?.length) return { ok: false, code: "conflict", message: "Энэ загварыг өөр цонхноос өөрчилсөн байна. Хуудсыг дахин ачаалж шалгана уу (таны засвар алга болно — шаардлагатай бол эхлээд хуулж аваарай)." };
  const saved = data[0];

  // Private delivery file: one row per template in the locked template_files table.
  const { data: existing } = await db.from("template_files").select("id").eq("template_id", saved.id);
  if (form.file && (form.file.storagePath || form.file.externalUrl)) {
    const fileRow = { template_id: saved.id, storage_path: form.file.storagePath, external_url: form.file.externalUrl || null, label: form.file.label };
    const r = existing?.length ? await db.from("template_files").update(fileRow).eq("id", existing[0].id) : await db.from("template_files").insert(fileRow);
    if (r.error) return { ok: false, code: "server", message: "Загвар хадгалагдсан боловч хамгаалагдсан файлын мэдээллийг хадгалж чадсангүй. Дахин хадгална уу." };
  } else if (existing?.length) {
    await db.from("template_files").delete().eq("template_id", saved.id);
  }

  revalidatePublic(prevSlug, form.slug);
  revalidatePath("/admin/templates");
  return { ok: true, id: saved.id, updatedAt: saved.updated_at, status: saved.status };
}

const ticketInput = z.object({ kind: z.enum(["preview", "file"]), folder: z.uuid(), name: z.string().min(1).max(255), size: z.number().int().positive() });

/** Signed upload URL for one new object; admins only (also enforced by storage policies). */
export async function uploadTicketAction(input: z.input<typeof ticketInput>): Promise<ActionResult<{ bucket: string; path: string; token: string }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = ticketInput.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Файлын мэдээлэл буруу байна." };
  const ext = /\.([a-z0-9]{1,8})$/i.exec(p.data.name)?.[1]?.toLowerCase() ?? "";
  if (p.data.kind === "preview") {
    if (!PREVIEW_EXT.includes(ext)) return { ok: false, code: "type", message: "Preview зураг PNG, JPG, WEBP байна." };
    if (p.data.size > PREVIEW_MAX) return { ok: false, code: "size", message: "Зураг 5MB-аас их байна." };
  } else {
    if (!ext || ["html", "htm", "js", "exe", "sh", "bat", "svg"].includes(ext)) return { ok: false, code: "type", message: "Энэ төрлийн файл зөвшөөрөгдөхгүй." };
    if (p.data.size > FILE_MAX) return { ok: false, code: "size", message: "Файл 200MB-аас их байна." };
  }
  const bucket = p.data.kind === "preview" ? BUCKETS.previews : BUCKETS.templateFiles;
  const path = `${p.data.folder}/${randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;
  const { data, error } = await ctx.db.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, code: "server", message: "Upload эрх авч чадсангүй." };
  return { ok: true, bucket, path, token: data.token };
}
