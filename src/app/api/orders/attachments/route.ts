import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { MAX_FILE_BYTES } from "@/lib/order/attachments";
import { MESSAGES, fail, ok, rateLimit, readJson, sha256 } from "@/lib/server/http";
import { BUCKETS, adminClient, isBackendConfigured } from "@/lib/supabase/server";

/**
 * Attachment actions for an order that was just submitted from this browser.
 * Authorised by the short-lived upload grant returned at submission — knowing
 * the order ID alone is not enough. Responses never include order details.
 *
 *  action "ticket"   → a fresh signed upload URL (retry after a failure)
 *  action "complete" → server inspects the uploaded bytes and marks it uploaded
 */
const schema = z.object({
  action: z.enum(["ticket", "complete"]),
  orderId: z.uuid(),
  attachmentId: z.uuid(),
  grant: z.string().regex(/^[A-Za-z0-9_-]{20,100}$/),
});

type Attachment = { id: string; order_id: string; storage_path: string; mime_type: string; size_bytes: number; upload_status: string };

function sameHash(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function startsWith(buf: Uint8Array, sig: number[]) {
  return sig.every((b, i) => buf[i] === b);
}

/** Checks the real file bytes instead of trusting the browser's MIME type. */
function sniff(mime: string, buf: Uint8Array): string | null {
  switch (mime) {
    case "image/jpeg":
      return startsWith(buf, [0xff, 0xd8, 0xff]) ? null : "JPG файл биш байна.";
    case "image/png":
      return startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ? null : "PNG файл биш байна.";
    case "application/pdf":
      return startsWith(buf, [0x25, 0x50, 0x44, 0x46, 0x2d]) ? null : "PDF файл биш байна.";
    case "image/svg+xml": {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(buf).toLowerCase();
      if (!/<svg[\s>]/.test(text)) return "SVG файл биш байна.";
      if (/<script|javascript:|<foreignobject|\son[a-z]+\s*=|<iframe|<embed|<object/.test(text)) return "SVG файлд скрипт агуулагдсан тул хүлээн авах боломжгүй.";
      return null;
    }
    default:
      return "Зөвшөөрөгдөөгүй төрөл.";
  }
}

export async function POST(req: Request) {
  if (!isBackendConfigured()) return fail(503, "not_configured", MESSAGES.notConfigured);
  const body = await readJson(req, 4 * 1024);
  if (!body.ok) return body.res;
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return fail(400, "invalid", MESSAGES.badJson);
  const { action, orderId, attachmentId, grant } = parsed.data;

  if (!(await rateLimit(req, "attachments", 120, 600))) return fail(429, "rate_limited", MESSAGES.rateLimited);

  const db = adminClient();
  const { data: order, error: oErr } = await db
    .from("website_orders")
    .select("id, upload_grant_hash, upload_grant_expires_at")
    .eq("id", orderId)
    .maybeSingle();
  if (oErr) return fail(500, "server", MESSAGES.server);
  const expired = !order?.upload_grant_expires_at || new Date(order.upload_grant_expires_at).getTime() < Date.now();
  if (!order || !order.upload_grant_hash || expired || !sameHash(order.upload_grant_hash, sha256(grant))) {
    return fail(403, "forbidden", "Файл илгээх эрхийн хугацаа дууссан. Файлаа Drive холбоосоор эсвэл бидэнтэй холбогдож илгээнэ үү.");
  }

  const { data: att, error: aErr } = await db
    .from("order_attachments")
    .select("id, order_id, storage_path, mime_type, size_bytes, upload_status")
    .eq("id", attachmentId)
    .eq("order_id", orderId)
    .maybeSingle<Attachment>();
  if (aErr) return fail(500, "server", MESSAGES.server);
  if (!att) return fail(404, "not_found", "Хавсралт олдсонгүй.");

  if (att.upload_status === "uploaded") return ok({ status: "uploaded" });
  if (att.upload_status === "rejected" || att.upload_status === "expired") {
    return fail(409, att.upload_status, "Энэ файлыг дахин илгээх боломжгүй. Drive холбоосоор илгээнэ үү.");
  }

  const bucket = db.storage.from(BUCKETS.attachments);

  if (action === "ticket") {
    const { data: signed, error } = await bucket.createSignedUploadUrl(att.storage_path);
    if (error) {
      // The object may already be there (upload finished, confirmation lost).
      return ok({ status: "maybe_uploaded", token: null, path: att.storage_path });
    }
    return ok({ status: "pending", token: signed.token, path: att.storage_path });
  }

  // action === "complete"
  const { data: blob, error: dErr } = await bucket.download(att.storage_path);
  if (dErr || !blob) {
    await db.from("order_attachments").update({ upload_status: "failed" }).eq("id", att.id);
    return fail(409, "not_uploaded", "Файл серверт хүрээгүй байна. Дахин илгээнэ үү.");
  }
  const buf = new Uint8Array(await blob.arrayBuffer());
  let problem: string | null = null;
  if (buf.byteLength === 0 || buf.byteLength > MAX_FILE_BYTES) problem = "Файлын хэмжээ зөвшөөрөгдөөгүй.";
  else if (buf.byteLength !== Number(att.size_bytes)) problem = "Файл бүрэн илгээгдээгүй байна.";
  else problem = sniff(att.mime_type, buf);

  if (problem) {
    await bucket.remove([att.storage_path]);
    const incomplete = problem === "Файл бүрэн илгээгдээгүй байна.";
    await db.from("order_attachments").update({ upload_status: incomplete ? "failed" : "rejected" }).eq("id", att.id);
    return fail(422, incomplete ? "incomplete" : "rejected", problem);
  }

  const { error: uErr } = await db
    .from("order_attachments")
    .update({ upload_status: "uploaded", uploaded_at: new Date().toISOString() })
    .eq("id", att.id);
  if (uErr) return fail(500, "server", MESSAGES.server);
  return ok({ status: "uploaded" });
}
