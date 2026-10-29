import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isCatalogConfigured, publicReadClient } from "@/lib/supabase/server";
import { DEFAULT_CONTENT, parseContent, type SiteContent } from "./schema";

export const CONTENT_TAG = "site-content";

async function loadPublished(): Promise<SiteContent> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  // Only the `published` column is readable by the public role; drafts never leak.
  const { data, error } = await publicReadClient().from("site_content").select("published").eq("key", "site").maybeSingle();
  if (error) throw new Error(error.code ?? "read failed"); // thrown results are not cached
  return data?.published ? parseContent(data.published) : DEFAULT_CONTENT;
}

/** Published site copy. Falls back to the built-in copy if not configured or the read fails. */
export async function getSiteContent(): Promise<SiteContent> {
  if (!isCatalogConfigured()) return DEFAULT_CONTENT;
  try {
    return await loadPublished();
  } catch (e) {
    console.error("[content] published read failed:", e instanceof Error ? e.message : "unknown");
    return DEFAULT_CONTENT;
  }
}
