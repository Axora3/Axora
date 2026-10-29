import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getPublishedTemplates } from "@/lib/templates/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const paths = ["", "/templates", "/services", "/builder", "/contact", "/privacy"];
  const pages: MetadataRoute.Sitemap = paths.map((path) => ({ url: `${base}${path}`, changeFrequency: "monthly" }));

  const result = await getPublishedTemplates();
  if (result.ok) {
    pages.push(...result.templates.map((template) => ({
      url: `${base}/templates/${template.slug}`,
      changeFrequency: "monthly" as const,
    })));
  }
  return pages;
}
