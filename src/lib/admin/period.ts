/** Dashboard date ranges, computed in Ulaanbaatar time (UTC+8, no DST). */

export type PeriodKey = "7d" | "30d" | "month" | "custom";
export type Period = { key: PeriodKey; from: string; to: string; label: string; fromDate: string; toDate: string };

const OFFSET_MS = 8 * 3600 * 1000;
const DAY = 24 * 3600 * 1000;
const isDate = (s: string | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

function ubDateString(ms: number): string {
  return new Date(ms + OFFSET_MS).toISOString().slice(0, 10);
}
/** UTC instant for 00:00 Ulaanbaatar on a YYYY-MM-DD day. */
function ubStart(day: string): number {
  return Date.parse(day + "T00:00:00Z") - OFFSET_MS;
}

export function resolvePeriod(sp: Record<string, string | string[] | undefined>, nowMs: number = Date.now()): Period {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  let key: PeriodKey = (["7d", "30d", "month", "custom"] as const).find((k) => k === one("period")) ?? "7d";
  const from = one("from");
  const to = one("to");
  // An invalid or reversed custom range falls back to the default period.
  if (key === "custom" && !(isDate(from) && isDate(to) && from <= to)) key = "7d";
  const today = ubDateString(nowMs);
  let fromDay = ubDateString(nowMs - 6 * DAY);
  let toDay = today;
  if (key === "30d") fromDay = ubDateString(nowMs - 29 * DAY);
  else if (key === "month") fromDay = today.slice(0, 8) + "01";
  else if (key === "custom") {
    fromDay = from!;
    toDay = to!;
  }
  const labels: Record<PeriodKey, string> = { "7d": "Сүүлийн 7 хоног", "30d": "Сүүлийн 30 хоног", month: "Энэ сар", custom: `${fromDay} – ${toDay}` };
  return {
    key,
    from: new Date(ubStart(fromDay)).toISOString(),
    to: new Date(ubStart(toDay) + DAY).toISOString(),
    label: labels[key],
    fromDate: fromDay,
    toDate: toDay,
  };
}
