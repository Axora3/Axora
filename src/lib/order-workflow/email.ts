import "server-only";
import nodemailer from "nodemailer";
import { adminClient } from "@/lib/supabase/server";
import { isEmailConfigured } from "@/lib/server/email";
import { buildOrderEmail, type OrderEmailPayload } from "./email-message";
type Mail = {
  id: string;
  lease_token: string;
  event_type: string;
  payload: OrderEmailPayload;
};
export async function flushOrderEmails(limit = 5) {
  if (!isEmailConfigured()) return { sent: 0, configured: false };
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin || !/^https?:\/\//.test(origin))
    return { sent: 0, configured: false };
  const db = adminClient();
  const { data, error } = await db.rpc("website_order_email_claim", {
    p_limit: limit,
  });
  if (error) return { sent: 0, configured: true };
  let sent = 0;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 5000,
    socketTimeout: 10000,
  });
  try {
    for (const m of (data ?? []) as Mail[]) {
      let success = false,
        code = "smtp_failed";
      let messageId: string | null = null;
      try {
        const p = m.payload;
        const info = await transport.sendMail({
          from: process.env.EMAIL_FROM || `AXORA <${process.env.SMTP_USER}>`,
          to: p.to,
          messageId: `<axora-order-${m.id}@${new URL(origin).hostname}>`,
          ...buildOrderEmail(m.event_type, p, origin),
        });
        success = info.accepted.length > 0;
        messageId = info.messageId;
      } catch (e) {
        const failure = e as {
          code?: string;
          command?: string;
          responseCode?: number;
        };
        code =
          failure.command === "DATA" && !failure.responseCode
            ? "delivery_uncertain"
            : String(failure.code ?? "smtp_failed").slice(0, 80);
      }
      if (success && messageId) {
        try {
          await db.rpc("website_order_email_receipt", {
            p_id: m.id,
            p_lease: m.lease_token,
            p_message_id: messageId,
          });
        } catch {
          /* SMTP acceptance remains authoritative; never resend solely for receipt storage. */
        }
      }
      await db.rpc("website_order_email_finish", {
        p_id: m.id,
        p_lease: m.lease_token,
        p_sent: success,
        p_error: success ? null : code,
      });
      if (success) sent++;
    }
  } finally {
    transport.close();
  }
  return { sent, configured: true };
}
