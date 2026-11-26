import { fmtDate } from "./labels";

export type RevenueEntry = { at: string; amount: number; currency: string };

/** Disjoint UTC buckets over the already-resolved Ulaanbaatar date range. */
export function buildRevenueBuckets(
  from: string,
  to: string,
  entries: RevenueEntry[],
) {
  const start = Date.parse(from);
  const end = Date.parse(to);
  const days = Math.max(1, Math.round((end - start) / 86400000));
  const step = Math.max(1, Math.ceil(days / 7)) * 86400000;
  const rows = Array.from(
    { length: Math.ceil((end - start) / step) },
    (_, i) => {
      const at = start + i * step;
      const until = Math.min(end, at + step);
      return {
        from: at,
        to: until,
        label: `${fmtDate(new Date(at).toISOString())}${step > 86400000 ? ` – ${fmtDate(new Date(until - 1).toISOString())}` : ""}`,
        totals: {} as Record<string, number>,
      };
    },
  );
  for (const entry of entries) {
    const at = Date.parse(entry.at);
    const row = rows.find((row) => at >= row.from && at < row.to);
    if (row && Number.isFinite(entry.amount))
      row.totals[entry.currency] =
        (row.totals[entry.currency] ?? 0) + entry.amount;
  }
  return rows.map(({ label, totals }) => ({ label, totals }));
}
