import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase access. Two clients, never mixed:
 *  - publicReadClient: the publishable anon key, so RLS decides what is visible
 *    (published templates only). Used for catalogue reads.
 *  - adminClient: the service-role key, which bypasses RLS. Used only inside
 *    API route handlers after validation; never imported by client code.
 */

export const BUCKETS = {
  previews: "template-previews",
  attachments: "order-attachments",
  templateFiles: "template-files",
} as const;

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function supabaseUrl(): string | undefined {
  return env("NEXT_PUBLIC_SUPABASE_URL");
}

/** Catalogue reads only need the URL + anon key. */
export function isCatalogConfigured(): boolean {
  return !!(supabaseUrl() && env("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
}

/** Submissions also need the server key. Without it the site runs in test mode. */
export function isBackendConfigured(): boolean {
  return isCatalogConfigured() && !!env("SUPABASE_SERVICE_ROLE_KEY");
}

const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

let publicClient: SupabaseClient | null = null;
let admin: SupabaseClient | null = null;

export function publicReadClient(): SupabaseClient {
  if (!isCatalogConfigured()) throw new Error("Supabase is not configured");
  publicClient ??= createClient(supabaseUrl()!, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, opts);
  return publicClient;
}

export function adminClient(): SupabaseClient {
  if (!isBackendConfigured()) throw new Error("Supabase server key is not configured");
  admin ??= createClient(supabaseUrl()!, env("SUPABASE_SERVICE_ROLE_KEY")!, opts);
  return admin;
}

/** Public URL for an object in the public previews bucket. */
export function previewPublicUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${supabaseUrl()}/storage/v1/object/public/${BUCKETS.previews}/${path.replace(/^\/+/, "")}`;
}
