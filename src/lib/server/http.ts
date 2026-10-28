import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { adminClient } from "@/lib/supabase/server";

/** Uniform JSON error. Messages are user-facing Mongolian; no internals leak. */
export function fail(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return Response.json({ ok: false, code, message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

export function ok(body: Record<string, unknown>, status = 200) {
  return Response.json({ ok: true, ...body }, { status, headers: { "Cache-Control": "no-store" } });
}

export const MESSAGES = {
  notConfigured: "Туршилтын горим — сервер холбогдоогүй тул мэдээлэл хадгалагдахгүй.",
  tooLarge: "Илгээж буй мэдээлэл хэт их байна.",
  badJson: "Хүсэлтийн формат буруу байна.",
  rateLimited: "Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.",
  spam: "Хүсэлтийг хүлээн авах боломжгүй. Дахин оролдоно уу.",
  server: "Серверт алдаа гарлаа. Хариулт тань хадгалагдсан хэвээр — дахин оролдоно уу.",
  conflict: "Энэ хүсэлт өөр мэдээлэлтэйгээр өмнө нь илгээгдсэн байна. Хуудсыг дахин ачаалаад шинээр илгээнэ үү.",
} as const;

/**
 * Reads a JSON body with a hard byte limit, without trusting Content-Length.
 */
export async function readJson(req: Request, maxBytes: number): Promise<{ ok: true; data: unknown } | { ok: false; res: Response }> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return { ok: false, res: fail(413, "too_large", MESSAGES.tooLarge) };
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return { ok: false, res: fail(415, "bad_content_type", MESSAGES.badJson) };
  }
  const reader = req.body?.getReader();
  if (!reader) return { ok: false, res: fail(400, "bad_json", MESSAGES.badJson) };
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return { ok: false, res: fail(413, "too_large", MESSAGES.tooLarge) };
    }
    chunks.push(value);
  }
  try {
    const text = new TextDecoder().decode(Buffer.concat(chunks));
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, res: fail(400, "bad_json", MESSAGES.badJson) };
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function salt(): string {
  return process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "axora";
}

/**
 * Database-backed fixed-window rate limit, so it holds across serverless
 * instances. The IP is HMAC-hashed and never stored in clear text.
 * Fails closed (blocks) if the limiter itself errors.
 */
export async function rateLimit(req: Request, scope: string, max: number, windowSeconds: number): Promise<boolean> {
  const key = `${scope}:${createHmac("sha256", salt()).update(clientIp(req)).digest("hex").slice(0, 32)}`;
  const { data, error } = await adminClient().rpc("hit_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) {
    console.error(`[rate-limit] ${scope} failed:`, error.code);
    return false;
  }
  return data === true;
}

/** Canonical JSON (sorted keys) so equal payloads always hash the same. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return (
      "{" +
      Object.keys(o)
        .filter((k) => o[k] !== undefined)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(o[k]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(value);
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export function newGrant(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: sha256(token) };
}

/** Honeypot + minimum fill time. Bots usually fill everything instantly. */
export function looksLikeSpam(meta: { website?: string; startedAt?: number }, minMs: number): boolean {
  if (meta.website && meta.website.trim() !== "") return true;
  if (typeof meta.startedAt !== "number") return true;
  // startedAt comes from the visitor's clock; only flag a clearly instant
  // submit, so a skewed clock (negative elapsed) is not punished.
  const elapsed = Date.now() - meta.startedAt;
  return elapsed >= 0 && elapsed < minMs;
}
