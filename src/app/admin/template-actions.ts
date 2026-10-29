"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DENIED, requireAdminAction, type AdminContext, type ActionResult } from "@/lib/admin/auth";
import { FILE_MAX, PREVIEW_EXT, PREVIEW_MAX, templateForm, validateTemplate, type FormErrors, type TemplateForm } from "@/lib/admin/template-schema";
import { BUCKETS } from "@/lib/supabase/server";
import { TEMPLATE_CATEGORIES, type TemplateCategory } from "@/lib/templates/types";

type Saved = { id: string; updatedAt: string; status: string };
type SaveResult = (ActionResult<Saved> & { errors?: FormErrors }) | { ok: false; code: string; message: string; errors?: FormErrors; saved: Saved };

const saveInput = z.object({
  id: z.uuid().nullable(),
  expected: z.string().nullable(),
  mode: z.enum(["draft", "publish", "unpublish"]),
  form: templateForm,
});

const PUBLISH_FIELD: Record<string, keyof FormErrors> = { title: "title", slug: "slug", short_description: "shortDescription", price: "price", file: "file" };
const PUBLISH_TEXT: Partial<Record<keyof FormErrors, string>> = {
  title: "Нэр оруулна уу.",
  slug: "Slug оруулна уу.",
  shortDescription: "Нийтлэхэд товч тайлбар шаардлагатай.",
  price: "Үнэ болон үнэгүй эсэх зөрчилтэй байна.",
  file: "Төлбөртэй загварыг нийтлэхэд хамгаалагдсан файл эсвэл хүргэх холбоос шаардлагатай.",
};

/** Errors raised by the database publish guard → field errors. */
function publishGuardErrors(error: { code?: string; message?: string; details?: string } | null): FormErrors | null {
  if (error?.code !== "P0001" || error.message !== "publish_requirements") return null;
  const e: FormErrors = {};
  for (const k of (error.details ?? "").split(",")) {
    const f = PUBLISH_FIELD[k.trim()];
    if (f) e[f] = PUBLISH_TEXT[f];
  }
  return e;
}

function revalidatePublic(...slugs: (string | null | undefined)[]) {
  revalidatePath("/templates");
  revalidatePath("/");
  for (const s of new Set(slugs.filter(Boolean))) revalidatePath(`/templates/${s}`);
}

/** Removes storage objects that the saved row no longer references. Best effort. */
async function cleanupObjects(ctx: AdminContext, bucket: string, paths: string[]) {
  paths = paths.filter((p) => !/^https?:\/\//.test(p));
  if (!paths.length) return;
  const { error } = await ctx.db.storage.from(bucket).remove(paths);
  if (error) console.error("[admin] storage cleanup:", bucket, error.message);
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
  // Slug must be unique; the unique constraint is the final guarantee.
  const { data: clash } = await db.from("templates").select("id").eq("slug", form.slug).neq("id", id ?? "00000000-0000-0000-0000-000000000000").limit(1);
  if (clash?.length) return { ok: false, code: "validation", message: "Энэ slug өөр загварт ашиглагдсан байна.", errors: { slug: "Энэ slug давхцаж байна. Өөр утга оруулна уу." } };

  let prevSlug: string | null = null;
  let status: "draft" | "published" = "draft";
  let oldPreviews: string[] = [];
  let oldFile: string | null = null;
  if (id) {
    const { data: cur } = await db.from("templates").select("slug, status, preview_images").eq("id", id).maybeSingle();
    if (!cur) return { ok: false, code: "not_found", message: "Загвар олдсонгүй." };
    prevSlug = cur.slug;
    status = cur.status;
    oldPreviews = ((cur.preview_images ?? []) as { path: string }[]).map((p) => p.path);
    const { data: f } = await db.from("template_files").select("storage_path").eq("template_id", id).limit(1).maybeSingle();
    oldFile = f?.storage_path ?? null;
  }
  const target = mode === "publish" ? "published" : mode === "unpublish" ? "draft" : status;

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
    is_demo: false,
    // Becoming published happens in a second step, after the delivery file
    // row exists, so the database publish guard can check it.
    status: target === "published" && status !== "published" ? "draft" : target,
  };

  const q = id
    ? db.from("templates").update(row).eq("id", id).eq("updated_at", expected ?? "").select("id, updated_at, status")
    : db.from("templates").insert(row).select("id, updated_at, status");
  const { data, error } = await q;
  if (error) {
    if (error.code === "23505") return { ok: false, code: "validation", message: "Энэ slug өөр загварт ашиглагдсан байна.", errors: { slug: "Энэ slug давхцаж байна. Өөр утга оруулна уу." } };
    if (error.code === "23514") return { ok: false, code: "validation", message: "Үнэ болон “үнэгүй” тохиргоо зөрчилтэй байна.", errors: { price: "Үнэ болон үнэгүй эсэхийг шалгана уу." } };
    const g = publishGuardErrors(error);
    if (g) return { ok: false, code: "validation", message: "Нийтэлсэн загварт шаардлагатай талбар дутуу байна.", errors: g };
    console.error("[admin] template save:", error.code);
    return { ok: false, code: "server", message: "Хадгалж чадсангүй. Таны засвар editor дээр хэвээр байна — дахин оролдоно уу." };
  }
  if (!data?.length) return { ok: false, code: "conflict", message: "Энэ загварыг өөр цонхноос өөрчилсөн байна. Хуудсыг дахин ачаалж шалгана уу (таны засвар алга болно — шаардлагатай бол эхлээд хуулж аваарай)." };
  let saved: Saved = { id: data[0].id, updatedAt: data[0].updated_at, status: data[0].status };

  // Private delivery file: one row per template in the locked template_files table.
  const { data: existing } = await db.from("template_files").select("id").eq("template_id", saved.id);
  if (form.file && (form.file.storagePath || form.file.externalUrl)) {
    const fileRow = { template_id: saved.id, storage_path: form.file.storagePath, external_url: form.file.externalUrl || null, label: form.file.label };
    const r = existing?.length ? await db.from("template_files").update(fileRow).eq("id", existing[0].id) : await db.from("template_files").insert(fileRow);
    if (r.error) return { ok: false, code: "server", message: "Загвар хадгалагдсан боловч хамгаалагдсан файлын мэдээллийг хадгалж чадсангүй. Дахин хадгална уу.", saved };
  } else if (existing?.length) {
    const r = await db.from("template_files").delete().eq("template_id", saved.id);
    if (r.error) {
      const g = publishGuardErrors(r.error);
      return { ok: false, code: g ? "validation" : "server", message: g ? "Нийтэлсэн төлбөртэй загварын сүүлийн файлыг устгах боломжгүй. Эхлээд нийтлэлээс буулгана уу." : "Файлын холбоосыг устгаж чадсангүй.", errors: g ?? undefined, saved };
    }
  }

  if (target === "published" && saved.status !== "published") {
    const { data: pub, error: pubErr } = await db.from("templates").update({ status: "published" }).eq("id", saved.id).eq("updated_at", saved.updatedAt).select("id, updated_at, status");
    if (pubErr || !pub?.length) {
      const g = publishGuardErrors(pubErr);
      revalidatePath("/admin/templates");
      return { ok: false, code: g ? "validation" : "server", message: "Ноорог хадгалагдсан боловч нийтэлж чадсангүй. Тэмдэглэсэн талбаруудыг шалгана уу.", errors: g ?? undefined, saved };
    }
    saved = { id: pub[0].id, updatedAt: pub[0].updated_at, status: pub[0].status };
  }

  // Old objects are removed only after the database points at the new ones.
  const keepPreviews = new Set(form.previewImages.map((p) => p.path));
  await cleanupObjects(ctx, BUCKETS.previews, oldPreviews.filter((p) => !keepPreviews.has(p)));
  if (oldFile && oldFile !== form.file?.storagePath) await cleanupObjects(ctx, BUCKETS.templateFiles, [oldFile]);

  revalidatePublic(prevSlug, form.slug);
  revalidatePath("/admin/templates");
  revalidatePath("/admin", "layout");
  return { ok: true, ...saved };
}

const publishInput = z.object({ id: z.uuid(), publish: z.boolean() });

type PublishResult = ActionResult<{ status: "draft" | "published"; updatedAt: string }> & { reasons?: string[] };

/**
 * The publish switch on the product list. Runs the same publish validation as
 * the editor on the stored row, then the database guard checks again.
 */
export async function setTemplatePublishedAction(input: z.input<typeof publishInput>): Promise<PublishResult> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = publishInput.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Утга буруу байна." };
  const db = ctx.db;
  const [{ data: t }, { data: file }] = await Promise.all([
    db.from("templates").select("*").eq("id", p.data.id).maybeSingle(),
    db.from("template_files").select("storage_path, external_url, label").eq("template_id", p.data.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!t) return { ok: false, code: "not_found", message: "Загвар олдсонгүй." };
  const target = p.data.publish ? "published" : "draft";
  if (t.status === target) return { ok: true, status: target, updatedAt: t.updated_at };

  if (p.data.publish) {
    const form: TemplateForm = {
      title: t.title ?? "",
      slug: t.slug ?? "",
      category: (TEMPLATE_CATEGORIES as readonly string[]).includes(t.category) ? (t.category as TemplateCategory) : ("" as TemplateCategory),
      shortDescription: t.short_description ?? "",
      longDescription: t.long_description ?? "",
      isFree: t.is_free,
      price: Number(t.price) || 0,
      currency: t.currency ?? "MNT",
      forWhom: t.for_whom ?? "",
      included: t.included ?? [],
      howTo: t.how_to ?? [],
      requirements: t.requirements ?? "",
      format: t.format ?? "",
      sortOrder: t.sort_order ?? 100,
      previewImages: t.preview_images ?? [],
      file: file ? { storagePath: file.storage_path, externalUrl: file.external_url, label: file.label ?? "" } : null,
    };
    const errs = validateTemplate(form, "publish");
    if (!form.category) errs.category = "Ангилал буруу байна.";
    if (Object.keys(errs).length) {
      return { ok: false, code: "validation", message: "Нийтлэх боломжгүй — дутуу мэдээлэлтэй.", reasons: Object.values(errs).filter(Boolean) as string[] };
    }
  }

  const { data, error } = await db.from("templates").update({ status: target }).eq("id", t.id).eq("status", t.status).select("updated_at, status");
  if (error) {
    const g = publishGuardErrors(error);
    if (g) return { ok: false, code: "validation", message: "Нийтлэх боломжгүй — дутуу мэдээлэлтэй.", reasons: Object.values(g).filter(Boolean) as string[] };
    console.error("[admin] publish toggle:", error.code);
    return { ok: false, code: "server", message: "Хадгалж чадсангүй. Дахин оролдоно уу." };
  }
  if (!data?.length) return { ok: false, code: "conflict", message: "Энэ загварыг өөр цонхноос өөрчилсөн байна. Хуудсыг шинэчилнэ үү." };
  revalidatePublic(t.slug);
  revalidatePath("/admin/templates");
  return { ok: true, status: data[0].status, updatedAt: data[0].updated_at };
}

/** Server-side duplicate check for the slug field (the product being edited is excluded). */
export async function checkSlugAction(slug: string, excludeId: string | null): Promise<ActionResult<{ available: boolean }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return { ok: true, available: false };
  let q = ctx.db.from("templates").select("id").eq("slug", slug).limit(1);
  if (excludeId && z.uuid().safeParse(excludeId).success) q = q.neq("id", excludeId);
  const { data, error } = await q;
  if (error) return { ok: false, code: "server", message: "Slug шалгаж чадсангүй." };
  return { ok: true, available: !data?.length };
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
