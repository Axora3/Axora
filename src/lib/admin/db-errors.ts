/** A column/function from a newer migration is missing (migration not run yet). */
export function isMissingMigration(error: { code?: string } | null | undefined): boolean {
  return !!error && ["42703", "42883", "PGRST202", "PGRST204"].includes(error.code ?? "");
}

export const MIGRATION_HINT =
  "Supabase дээр 20261029000000_payments_delivery_guards.sql migration ажиллаагүй байна. Төлбөр, хүргэлтийн төлөв түүнийг ажиллуулсны дараа харагдана (README → Админ тохируулах).";
