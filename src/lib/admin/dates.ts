/** Reject impossible dates rather than accepting Date.parse normalization. */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

/** Inclusive Ulaanbaatar calendar days expressed as a UTC [from, to) range. */
export function dateBounds(from: string, to: string) {
  const start = isCalendarDate(from) ? Date.parse(`${from}T00:00:00+08:00`) : null;
  const end = isCalendarDate(to) ? Date.parse(`${to}T00:00:00+08:00`) + 86400000 : null;
  return { from: start === null ? null : new Date(start).toISOString(), to: end === null ? null : new Date(end).toISOString() };
}
