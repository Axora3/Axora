import { z } from "zod";
import { CONTACT, FAQ } from "@/lib/site";
import { librarySchema } from "./library";

/**
 * Fixed-field site content. Plain text only — the public site renders these
 * as text nodes, never as HTML. Links are limited to an allow-list.
 */
export const CTA_TARGETS = [
  ["/templates", "Загварууд"],
  ["/builder", "Live demo"],
  ["/order", "Анкет"],
  ["/services", "Веб хөгжүүлэлт"],
  ["/contact", "Холбоо барих"],
  ["/#faq", "Түгээмэл асуулт"],
  ["/bundles", "Багцууд"],
  ["/portfolio", "Портфолио"],
  ["/learn", "Сургалт"],
  ["/blog", "Нийтлэл"],

] as const;
const target = z.enum(CTA_TARGETS.map((t) => t[0]) as [string, ...string[]]);
const text = (max: number) => z.string().trim().max(max);

export const siteContentSchema = z.object({
  library: librarySchema.default([]),
  heroTitle: text(80).min(1),
  heroAccent: text(40),
  heroLead: text(240),
  heroPrimary: z.object({ label: text(30).min(1), href: target }),
  heroSecondary: z.object({ label: text(30).min(1), href: target }),
  contact: z.object({ phone: text(40), email: text(120), messenger: text(120), hours: text(120) }),
  social: z.array(z.object({ label: text(30).min(1), url: z.string().trim().regex(/^https:\/\/\S{3,300}$/) })).max(4),
  faq: z.array(z.object({ q: text(200).min(1), a: text(1200).min(1) })).min(1).max(12),
  footerText: text(200),
});
export type SiteContent = z.infer<typeof siteContentSchema>;

export const DEFAULT_CONTENT: SiteContent = {
  library: [],
  heroTitle: "Бэлэн загвар ба",
  heroAccent: "веб сайт — нэг дор.",
  heroLead: "Ажлыг хөнгөвчлөх бэлэн загварууд, бизнесийг тань илэрхийлэх веб сайт — нэг дор.",
  heroPrimary: { label: "Загварууд үзэх", href: "/templates" },
  heroSecondary: { label: "Веб сайт захиалах", href: "/services" },
  contact: { phone: CONTACT.phone, email: CONTACT.email, messenger: CONTACT.messenger, hours: CONTACT.hours },
  social: [],
  faq: FAQ,
  footerText: "Бэлэн дижитал загвар ба захиалгат веб сайт.",
};

/** Merges a stored object over defaults; invalid stored data falls back safely. */
export function parseContent(raw: unknown): SiteContent {
  const merged = { ...DEFAULT_CONTENT, ...(raw && typeof raw === "object" ? raw : {}) };
  const normalizeCta = (value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    const cta = value as { href?: unknown };
    return cta.href === "/services/estimate" ? { ...cta, href: "/order" } : value;
  };
  const content = {
    ...merged,
    heroPrimary: normalizeCta(merged.heroPrimary),
    heroSecondary: normalizeCta(merged.heroSecondary),
  };
  const r = siteContentSchema.safeParse(content);
  return r.success ? r.data : DEFAULT_CONTENT;
}
