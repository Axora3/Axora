/** Helpers for list pages driven by URL search params. */

export type SP = Record<string, string | string[] | undefined>;

export function one(sp: SP, k: string): string {
  const v = sp[k];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** Strips characters that have meaning in PostgREST filter syntax. */
export function safeSearch(q: string): string {
  return q.replace(/[%,()*\\"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function page(sp: SP): number {
  const n = parseInt(one(sp, "page"), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10000) : 1;
}

export function hrefWith(base: string, sp: SP, patch: Record<string, string | number | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const s = Array.isArray(v) ? v[0] : v;
    if (s) p.set(k, s);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "") p.delete(k);
    else p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}

export const PAGE_SIZE = 20;
