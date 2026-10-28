/** Upload limits shared by the form (to show up front) and the server (to enforce). */

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_FIELD = 5;

export const ALLOWED_EXT = ["jpg", "jpeg", "png", "svg", "pdf"] as const;
export type AllowedExt = (typeof ALLOWED_EXT)[number];

export const EXT_TO_MIME: Record<AllowedExt, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

export const ACCEPT_ATTR = ".jpg,.jpeg,.png,.svg,.pdf,image/jpeg,image/png,image/svg+xml,application/pdf";
export const LIMITS_TEXT = "JPG, PNG, SVG, PDF · нэг файл 10MB хүртэл · дээд тал нь 5 файл";

export function extOf(name: string): AllowedExt | null {
  const m = /\.([a-z0-9]+)$/i.exec(name.trim());
  const e = m?.[1].toLowerCase();
  return e && (ALLOWED_EXT as readonly string[]).includes(e) ? (e as AllowedExt) : null;
}

export function formatSize(n: number): string {
  return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Client-side pre-check; the server repeats it and also inspects file bytes. */
export function precheckFile(file: { name: string; size: number }, countSoFar: number): string | null {
  if (!extOf(file.name)) return `${file.name} — зөвшөөрөгдөөгүй төрөл`;
  if (file.size <= 0) return `${file.name} — хоосон файл`;
  if (file.size > MAX_FILE_BYTES) return `${file.name} — 10MB-аас их`;
  if (countSoFar >= MAX_FILES_PER_FIELD) return `${file.name} — 5 файлын хязгаар хэтэрсэн`;
  return null;
}
