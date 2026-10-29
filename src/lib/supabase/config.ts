/** Public key shared by browser clients, server reads and the session proxy.
 * Keep direct process.env references so Next.js can inline browser values.
 */
export function publicSupabaseKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    || undefined;
}
