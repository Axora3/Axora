import { createHash } from "node:crypto";
import { adminClient, BUCKETS } from "@/lib/supabase/server";

const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const valid = (token: string) => /^[a-f0-9]{64}$/.test(token);
type Context = { params: Promise<{ token: string }> };

function page(message: string, status = 200, button = false) {
  return new Response(`<!doctype html><html lang="mn"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>AXORA — Загвар татах</title><body style="margin:0;background:#f5f6f2;color:#17251e;font:16px/1.7 system-ui"><main style="max-width:560px;margin:12vh auto;padding:28px"><p>AXORA</p><h1>Загвар татах</h1><p>${message}</p>${button ? '<form method="post"><button style="padding:14px 24px;border:0;border-radius:10px;background:#245c45;color:white;font:inherit;cursor:pointer" type="submit">Файлаа нэг удаа татах</button></form><p>Татсан файлаа төхөөрөмждөө хадгална уу. Таталт тасалдсан бол AXORA-тай холбогдоно уу.</p>' : ''}</main></body></html>`, { status, headers: { ...headers, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'" } });
}

// Opening an email link (including a scanner's GET/HEAD) never consumes it.
export async function GET(_request: Request, { params }: Context) {
  const { token } = await params;
  if (!valid(token)) return page("Холбоос буруу байна.", 404);
  const { data, error } = await adminClient().from("template_download_tokens").select("expires_at,consumed_at").eq("token_hash", hashToken(token)).maybeSingle();
  if (error) return page("Түр алдаа гарлаа. Дараа дахин оролдоно уу.", 503);
  if (!data || data.consumed_at || Date.parse(data.expires_at) <= Date.now()) return page("Энэ холбоос ашиглагдсан эсвэл хугацаа нь дууссан байна. AXORA-тай холбогдоно уу.", 410);
  return page("Таны худалдан авсан загвар бэлэн байна. Доорх товчийг дарснаар нэг удаагийн татах эрх ашиглагдана.", 200, true);
}

export async function POST(request: Request, { params }: Context) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return page("Хүсэлтийг зөвшөөрөхгүй.", 403);
  const { token } = await params;
  if (!valid(token)) return page("Холбоос буруу байна.", 404);
  const db = adminClient();
  const hash = hashToken(token);
  const { data, error } = await db.from("template_download_tokens").select("storage_path,expires_at,consumed_at").eq("token_hash", hash).maybeSingle();
  if (error) return page("Түр алдаа гарлаа. Дараа дахин оролдоно уу.", 503);
  if (!data || data.consumed_at || Date.parse(data.expires_at) <= Date.now()) return page("Энэ холбоос ашиглагдсан эсвэл хугацаа нь дууссан байна.", 410);
  // Fetch before redemption: a storage failure must not spend the entitlement.
  // Never redirect to a reusable signed Storage URL.
  const file = await db.storage.from(BUCKETS.templateFiles).download(data.storage_path);
  if (file.error || !file.data) return page("Файлыг ачаалж чадсангүй. Татах эрх ашиглагдаагүй. Дахин оролдоно уу.", 503);
  const { data: consumed, error: claimError } = await db.rpc("consume_single_use_download", { p_hash: hash });
  if (claimError) return page("Түр алдаа гарлаа. Дахин оролдоно уу.", 503);
  if (!consumed) return page("Татах эрх ашиглагдсан, хугацаа нь дууссан эсвэл цуцлагдсан байна.", 410);
  const filename = data.storage_path.split("/").pop() || "template";
  return new Response(file.data, { headers: { ...headers, "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`, "Content-Length": String(file.data.size) } });
}
