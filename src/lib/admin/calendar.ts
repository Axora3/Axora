import { isCalendarDate } from "./dates";

export function calendarDate(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number) {
  const date = calendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

/** Month arithmetic clamps January 31 to February's actual last day. */
export function addMonths(value: string, months: number) {
  const date = calendarDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(date);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  date.setUTCDate(Math.min(day, last.getUTCDate()));
  return dateKey(date);
}

/** Monday-first, six stable rows. No local-time/DST date arithmetic. */
export function monthGrid(month: string) {
  const first = `${month.slice(0, 7)}-01`;
  const offset = (calendarDate(first).getUTCDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function allowedDate(
  value: string,
  min?: string | number,
  max?: string | number,
) {
  return (
    isCalendarDate(value) &&
    (!min || value >= String(min)) &&
    (!max || value <= String(max))
  );
}

export function ulaanbaatarToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join("-");
}
