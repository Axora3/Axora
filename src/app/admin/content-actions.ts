"use server";

import { revalidatePath, updateTag } from "next/cache";
import { DENIED, requireAdminAction, type ActionResult } from "@/lib/admin/auth";
import { siteContentSchema, type SiteContent } from "@/lib/content/schema";
import { CONTENT_TAG } from "@/lib/content/service";

type R = ActionResult<{ updatedAt: string; publishedAt?: string }>;

function validate(draft: SiteContent): { ok: true; data: SiteContent } | { ok: false; message: string } {
  const p = siteContentSchema.safeParse(draft);
  if (!p.success) {
    const first = p.error.issues[0];
    return { ok: false, message: `Талбар буруу байна: ${first.path.join(" › ")}. Хоосон эсвэл хэт урт утгыг засна уу (сошиал холбоос https://-ээр эхэлнэ).` };
  }
  return { ok: true, data: p.data };
}

/** Saves the draft only — the public site keeps showing the published copy. */
export async function saveContentDraftAction(expected: string, draft: SiteContent): Promise<R> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const v = validate(draft);
  if (!v.ok) return { ok: false, code: "invalid", message: v.message };
  const { data, error } = await ctx.db.from("site_content").update({ draft: v.data }).eq("key", "site").eq("updated_at", expected).select("updated_at");
  if (error) return { ok: false, code: "server", message: "Хадгалж чадсангүй. Таны засвар хэвээр байна — дахин оролдоно уу." };
  if (!data?.length) return { ok: false, code: "conflict", message: "Агуулгыг өөр цонхноос өөрчилсөн байна. Хуудсыг дахин ачаалж шалгана уу." };
  revalidatePath("/admin/content");
  return { ok: true, updatedAt: data[0].updated_at };
}

/** Saves the draft and copies it to the published copy in one update. */
export async function publishContentAction(expected: string, draft: SiteContent): Promise<R> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const v = validate(draft);
  if (!v.ok) return { ok: false, code: "invalid", message: v.message };
  const now = new Date().toISOString();
  const { data, error } = await ctx.db
    .from("site_content")
    .update({ draft: v.data, published: v.data, published_at: now })
    .eq("key", "site")
    .eq("updated_at", expected)
    .select("updated_at, published_at");
  if (error) return { ok: false, code: "server", message: "Нийтэлж чадсангүй. Таны засвар хэвээр байна — дахин оролдоно уу." };
  if (!data?.length) return { ok: false, code: "conflict", message: "Агуулгыг өөр цонхноос өөрчилсөн байна. Хуудсыг дахин ачаалж шалгана уу." };
  updateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
  return { ok: true, updatedAt: data[0].updated_at, publishedAt: data[0].published_at };
}
