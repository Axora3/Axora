import "server-only";
import { isCatalogConfigured, previewPublicUrl, publicReadClient } from "@/lib/supabase/server";
import { DEMO_TEMPLATES } from "./demo-data";
import { TEMPLATE_CATEGORIES, type PreviewStyle, type Template, type TemplateCategory, type TemplatesResult } from "./types";

/** Only public columns — private file paths live in a separate, locked table. */
const COLUMNS =
  "id, slug, title, short_description, long_description, category, price, currency, is_free, preview_images, preview_style, for_whom, included, how_to, requirements, format, is_demo, sort_order";

type Row = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string;
  category: string;
  price: number | string;
  currency: string;
  is_free: boolean;
  preview_images: { path: string; alt?: string }[] | null;
  preview_style: Partial<PreviewStyle> | null;
  for_whom: string | null;
  included: string[] | null;
  how_to: string[] | null;
  requirements: string | null;
  format: string | null;
  is_demo: boolean;
  sort_order: number;
};

const FALLBACK_STYLE: PreviewStyle = { tint: "#EEF1E6", accent: "#245C45", soft: "#CFE0D3", p1: "", c1: "", c2: "", c3: "" };

function mapRow(r: Row): Template {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    shortDescription: r.short_description,
    longDescription: r.long_description,
    category: (TEMPLATE_CATEGORIES as readonly string[]).includes(r.category) ? (r.category as TemplateCategory) : "Notion",
    price: Number(r.price) || 0,
    currency: r.currency,
    isFree: r.is_free,
    previewImages: (r.preview_images ?? []).filter((p) => p && p.path).map((p) => ({ url: previewPublicUrl(p.path), alt: p.alt ?? r.title })),
    previewStyle: { ...FALLBACK_STYLE, p1: r.title, ...(r.preview_style ?? {}) },
    forWhom: r.for_whom ?? "",
    included: r.included ?? [],
    howTo: r.how_to ?? [],
    requirements: r.requirements ?? "",
    format: r.format ?? "",
    isDemo: r.is_demo,
    sortOrder: r.sort_order,
  };
}

/**
 * Published templates. When Supabase is configured, a failed query is
 * reported as an error — it is never silently replaced with demo data.
 */
export async function getPublishedTemplates(): Promise<TemplatesResult> {
  if (!isCatalogConfigured()) return { ok: true, source: "demo", templates: DEMO_TEMPLATES };
  try {
    const { data, error } = await publicReadClient()
      .from("templates")
      .select(COLUMNS)
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[templates] list failed:", error.code, error.message);
      return { ok: false, error: "load_failed" };
    }
    return { ok: true, source: "database", templates: (data as Row[]).map(mapRow) };
  } catch (e) {
    console.error("[templates] list threw:", e instanceof Error ? e.message : "unknown");
    return { ok: false, error: "load_failed" };
  }
}

export type TemplateLookup =
  | { ok: true; source: "database" | "demo"; template: Template | null }
  | { ok: false; error: string };

export async function getTemplateBySlug(slug: string): Promise<TemplateLookup> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return { ok: true, source: isCatalogConfigured() ? "database" : "demo", template: null };
  if (!isCatalogConfigured()) {
    return { ok: true, source: "demo", template: DEMO_TEMPLATES.find((t) => t.slug === slug) ?? null };
  }
  try {
    const { data, error } = await publicReadClient().from("templates").select(COLUMNS).eq("status", "published").eq("slug", slug).maybeSingle();
    if (error) {
      console.error("[templates] get failed:", error.code, error.message);
      return { ok: false, error: "load_failed" };
    }
    return { ok: true, source: "database", template: data ? mapRow(data as Row) : null };
  } catch (e) {
    console.error("[templates] get threw:", e instanceof Error ? e.message : "unknown");
    return { ok: false, error: "load_failed" };
  }
}
