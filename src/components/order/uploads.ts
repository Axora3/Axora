"use client";

import { EXT_TO_MIME, extOf } from "@/lib/order/attachments";
import type { FileFieldId } from "@/lib/order/questions";
import { postJson } from "@/lib/client/submit";
import { browserClient } from "@/lib/supabase/browser";

export type FileStatus = "selected" | "uploading" | "uploaded" | "failed" | "rejected";

export type LocalFile = {
  ref: string;
  field: FileFieldId;
  file: File;
  name: string;
  size: number;
  status: FileStatus;
  error?: string;
  attachmentId?: string;
  path?: string;
  token?: string | null;
};

export type OrderReceipt = { orderId: string; reference: string; grant: string };

const BUCKET = "order-attachments";

type AttachRes = { ok: true; status: string; token?: string | null; path?: string };

async function complete(order: OrderReceipt, attachmentId: string): Promise<{ status: FileStatus; error?: string }> {
  const res = await postJson<AttachRes>("/api/orders/attachments", { action: "complete", orderId: order.orderId, attachmentId, grant: order.grant });
  if (res.ok) return { status: "uploaded" };
  if (res.code === "rejected" || res.code === "expired" || res.code === "forbidden") return { status: "rejected", error: res.message };
  return { status: "failed", error: res.message };
}

/**
 * Sends one file straight to Storage through the server-issued signed URL,
 * then asks the server to verify the bytes. Safe to call again on retry:
 * it fetches a new ticket and recognises a file that already arrived.
 */
export async function uploadOne(order: OrderReceipt, f: LocalFile): Promise<{ status: FileStatus; error?: string }> {
  if (!f.attachmentId) return { status: "failed", error: "Хавсралтын бүртгэл олдсонгүй." };
  let path = f.path;
  let token = f.token ?? null;

  if (!token) {
    const t = await postJson<AttachRes>("/api/orders/attachments", { action: "ticket", orderId: order.orderId, attachmentId: f.attachmentId, grant: order.grant });
    if (!t.ok) return { status: t.code === "forbidden" || t.code === "rejected" || t.code === "expired" ? "rejected" : "failed", error: t.message };
    if (t.status === "uploaded") return { status: "uploaded" };
    if (t.status === "maybe_uploaded") return complete(order, f.attachmentId);
    token = t.token ?? null;
    path = t.path ?? path;
  }
  if (!token || !path) return { status: "failed", error: "Илгээх эрх авахад алдаа гарлаа." };

  const client = browserClient();
  if (!client) return { status: "failed", error: "Сервертэй холбогдож чадсангүй." };
  const ext = extOf(f.name);
  try {
    const { error } = await client.storage.from(BUCKET).uploadToSignedUrl(path, token, f.file, {
      contentType: ext ? EXT_TO_MIME[ext] : "application/octet-stream",
      upsert: false,
    });
    if (error) {
      // Already there (an earlier attempt finished but its confirmation was lost).
      if (/exist|duplicate|409/i.test(error.message)) return complete(order, f.attachmentId);
      return { status: "failed", error: "Файл илгээхэд алдаа гарлаа. Дахин оролдоно уу." };
    }
  } catch {
    return { status: "failed", error: "Сүлжээний алдаа гарлаа. Дахин оролдоно уу." };
  }
  return complete(order, f.attachmentId);
}
