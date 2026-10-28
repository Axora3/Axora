/** Small client helpers for posting to our own API routes. */

export type ApiError = { ok: false; code: string; message: string; fieldErrors?: { id: string; step?: number; message: string }[] };

export function newIdempotencyKey(): string {
  const c: Crypto = globalThis.crypto;
  // randomUUID only exists in secure contexts (https / localhost).
  if (typeof c.randomUUID === "function") return c.randomUUID();
  // RFC 4122 v4 fallback, e.g. when testing over a LAN IP on plain http
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x: number) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * POST JSON and normalise every failure (offline, timeout, non-JSON reply)
 * into a user-facing Mongolian message. Never claims success unless the
 * server answered ok:true.
 */
export async function postJson<T extends { ok: true }>(url: string, body: unknown, timeoutMs = 20000): Promise<T | ApiError> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON */
    }
    if (data && typeof data === "object" && (data as { ok?: unknown }).ok === true && res.ok) return data as T;
    if (data && typeof data === "object" && typeof (data as ApiError).message === "string") return { ...(data as ApiError), ok: false };
    return { ok: false, code: "http_" + res.status, message: "Серверт алдаа гарлаа. Дахин оролдоно уу." };
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === "AbortError";
    return {
      ok: false,
      code: aborted ? "timeout" : "network",
      message: aborted ? "Сервер хариу өгөхгүй удаж байна. Дахин оролдоно уу." : "Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгаад дахин оролдоно уу.",
    };
  } finally {
    clearTimeout(timer);
  }
}
