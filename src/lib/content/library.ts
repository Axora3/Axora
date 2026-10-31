import { z } from "zod";

export const LIBRARY_KINDS = ["portfolio", "learn", "blog", "bundle", "release"] as const;
export type LibraryKind = (typeof LIBRARY_KINDS)[number];
export const LIBRARY_LABELS: Record<LibraryKind, string> = { portfolio: "Портфолио", learn: "Сургалт", blog: "Нийтлэл", bundle: "Багц", release: "Загварын шинэчлэлт" };
const text = (max: number) => z.string().trim().max(max);
export const libraryEntrySchema = z.object({
  id: text(80).min(1), kind: z.enum(LIBRARY_KINDS),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  title: text(200).min(1), summary: text(1000), category: text(80),
  body: text(20000), coverUrl: z.union([z.literal(""), z.string().url().startsWith("https://").max(1000)]),
  tags: z.array(text(80)).max(12),
  sections: z.array(z.object({ title: text(160).min(1), body: text(6000) })).max(30),
  templateIds: z.array(text(80)).max(20),
  price: z.number().min(0).max(100000000).nullable(),
  version: text(40), published: z.boolean(),
});
export type LibraryEntry = z.infer<typeof libraryEntrySchema>;
export const librarySchema = z.array(libraryEntrySchema).max(200).superRefine((entries, ctx) => {
  const seen = new Set<string>();
  entries.forEach((e, i) => { const key = `${e.kind}:${e.slug}`; if (seen.has(key)) ctx.addIssue({ code: "custom", path: [i,"slug"], message: "Давхардсан холбоос" }); seen.add(key); });
});
export const libraryHref = (e: LibraryEntry) => e.kind === "bundle" ? `/bundles/${e.slug}` : e.kind === "release" ? "/templates" : `/${e.kind}/${e.slug}`;
