"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client. Holds only the publishable anon key, which RLS
 * restricts to reading published templates. Its single job here is to send
 * files to a server-issued, time-limited signed upload URL — it cannot read,
 * list or overwrite anything in the private buckets.
 */
let client: SupabaseClient | null = null;

export function browserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
