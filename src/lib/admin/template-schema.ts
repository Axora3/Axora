import { z } from "zod";
import { TEMPLATE_CATEGORIES } from "@/lib/templates/types";

/** Template editor rules — shared by the editor (inline errors) and the server action. */

export const PREVIEW_EXT = ["png", "jpg", "jpeg", "webp"];
export const PREVIEW_MAX = 5 * 1024 * 1024;
export const FILE_MAX = 200 * 1024 * 1024;

export const templateForm = z.object({
  title: z.string().trim().max(200),
  slug: z.string().trim().max(120),
  category: z.enum(TEMPLATE_CATEGORIES),
  shortDescription: z.string().trim().max(400),
  longDescription: z.string().trim().max(5000),
  isFree: z.boolean(),
  price: z.number().min(0).max(100_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  forWhom: z.string().trim().max(2000),
  included: z.array(z.string().trim().min(1).max(300)).max(30),
  howTo: z.array(z.string().trim().min(1).max(500)).max(30),
  requirements: z.string().trim().max(300),
  format: z.string().trim().max(200),
  sortOrder: z.number().int().min(0).max(100000),
  previewImages: z.array(z.object({ path: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+\.(png|jpe?g|webp)$/), alt: z.string().trim().max(200) })).max(12),
  file: z
    .object({ storagePath: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+\.[a-z0-9]{1,8}$/).nullable(), externalUrl: z.string().trim().max(1000).nullable(), label: z.string().trim().max(200) })
    .nullable(),
});
export type TemplateForm = z.infer<typeof templateForm>;

export type FormErrors = Partial<Record<keyof TemplateForm | "file", string>>;

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Drafts may be incomplete; publishing needs everything the public page shows. */
export function validateTemplate(f: TemplateForm, mode: "draft" | "publish"): FormErrors {
  const e: FormErrors = {};
  if (!f.title) e.title = "Нэр оруулна уу.";
  if (!f.slug) e.slug = "Slug оруулна уу.";
  else if (!SLUG_RE.test(f.slug)) e.slug = "Зөвхөн латин жижиг үсэг, тоо, зураас (-). Жишээ: kofe-shop-post";
  if (!f.isFree && f.price <= 0) e.price = "Төлбөртэй загварын үнэ 0-ээс их байна. Үнэгүй бол “Үнэгүй загвар”-ыг сонгоно уу.";
  if (f.file?.externalUrl && !/^https:\/\/\S+$/.test(f.file.externalUrl)) e.file = "Холбоос https:// -ээр эхэлнэ.";
  if (f.isFree && f.price !== 0) e.price = "Үнэгүй загварын үнэ 0 байна.";
  if (mode === "publish") {
    if (!f.isFree && !(f.file?.storagePath || f.file?.externalUrl))
      e.file = "Төлбөртэй загварыг нийтлэхэд хамгаалагдсан файл эсвэл хүргэх холбоос шаардлагатай.";
    if (!f.shortDescription) e.shortDescription = "Нийтлэхэд товч тайлбар шаардлагатай.";
    if (!f.longDescription) e.longDescription = "Нийтлэхэд дэлгэрэнгүй тайлбар шаардлагатай.";
    if (!f.forWhom) e.forWhom = "Нийтлэхэд “Хэнд тохирох” шаардлагатай.";
    if (!f.included.length) e.included = "Нийтлэхэд дор хаяж нэг зүйл бичнэ үү.";
    if (!f.howTo.length) e.howTo = "Нийтлэхэд ашиглах зааврын дор хаяж нэг алхам бичнэ үү.";
    if (!f.requirements) e.requirements = "Нийтлэхэд шаардлагатай програм/бүртгэлийг бичнэ үү.";
    if (!f.format) e.format = "Нийтлэхэд форматыг бичнэ үү.";
  }
  return e;
}

const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((ch) => MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
