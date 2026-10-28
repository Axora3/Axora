export const TEMPLATE_CATEGORIES = ["Notion", "Canva", "Excel"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

/**
 * Drawn preview used when a template has no uploaded images yet.
 * Mirrors the CSS mock-ups in the design.
 */
export type PreviewStyle = {
  tint: string;
  accent: string;
  soft: string;
  p1: string;
  c1: string;
  c2: string;
  c3: string;
};

export type PreviewImage = { url: string; alt: string };

/** Public template data — never includes private file paths or links. */
export type Template = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  category: TemplateCategory;
  price: number;
  currency: string;
  isFree: boolean;
  previewImages: PreviewImage[];
  previewStyle: PreviewStyle;
  forWhom: string;
  included: string[];
  howTo: string[];
  requirements: string;
  format: string;
  isDemo: boolean;
  sortOrder: number;
};

export function formatPrice(t: Pick<Template, "isFree" | "price" | "currency">): string {
  if (t.isFree) return "Үнэгүй";
  const n = t.price.toLocaleString("en-US");
  return t.currency === "MNT" ? `${n}₮` : `${n} ${t.currency}`;
}

export type TemplatesResult =
  | { ok: true; source: "database" | "demo"; templates: Template[] }
  | { ok: false; error: string };
