/** A column/function from a newer migration is missing (migration not run yet). */
export function isMissingMigration(error: { code?: string } | null | undefined): boolean {
  return !!error && ["42703", "42883", "42P01", "PGRST202", "PGRST204", "PGRST205"].includes(error.code ?? "");
}

export const MIGRATION_HINT =
  "Supabase дээр 20261029000000_payments_delivery_guards.sql migration ажиллаагүй байна. Төлбөр, хүргэлтийн төлөв түүнийг ажиллуулсны дараа харагдана (README → Админ тохируулах).";

export const ADMIN_MODULE_MIGRATION_HINT =
  "Админ модулийн schema дутуу байна. 20261031000000_admin_modules.sql, дараа нь 20261031100000_admin_workflow_hardening.sql migration-ийг README-ийн дагуу ажиллуулна уу.";
