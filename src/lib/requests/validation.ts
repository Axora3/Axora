import { z } from "zod";
import { metaSchema } from "@/lib/order/schema";

/** Template purchase request + contact message rules, shared by browser and server. */

export const CHANNELS = {
  phone: { label: "Утас", contactLabel: "Утасны дугаар", type: "tel", mode: "tel" },
  email: { label: "Имэйл", contactLabel: "Имэйл хаяг", type: "email", mode: "email" },
  messenger: { label: "Messenger", contactLabel: "Messenger нэр эсвэл холбоос", type: "text", mode: "text" },
} as const;
export type Channel = keyof typeof CHANNELS;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function contactError(channel: Channel, value: string): string {
  const v = value.trim();
  if (!v) return `${CHANNELS[channel].contactLabel} оруулна уу.`;
  if (channel === "email" && !EMAIL_RE.test(v)) return "Имэйл хаяг буруу байна. Жишээ: ner@mail.mn";
  if (channel === "phone" && v.replace(/\D/g, "").length < 8) return "Утасны дугаар 8 оронтой байх ёстой.";
  if (v.length > 200) return "Хэт урт байна.";
  if (v.length < 3) return "Хэт богино байна.";
  return "";
}

/** For the contact form where one field holds either phone or email. */
export function phoneOrEmailError(value: string): string {
  const c = value.trim();
  if (!c) return "Утас эсвэл имэйлээ оруулна уу.";
  if (c.includes("@") ? !EMAIL_RE.test(c) : c.replace(/\D/g, "").length < 8) return "Утас (8 орон) эсвэл зөв имэйл оруулна уу.";
  return "";
}

export const templateRequestSchema = z.object({
  idempotencyKey: z.uuid(),
  slug: z.string().regex(/^[a-z0-9-]{1,120}$/),
  name: z.string().trim().min(1).max(120),
  channel: z.enum(["phone", "email", "messenger"]),
  contact: z.string().trim().min(1).max(200),
  note: z.string().trim().max(2000).optional().default(""),
  meta: metaSchema,
});
export type TemplateRequestInput = z.infer<typeof templateRequestSchema>;

export const contactMessageSchema = z.object({
  idempotencyKey: z.uuid(),
  name: z.string().trim().min(1).max(120),
  contact: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(3000),
  meta: metaSchema,
});
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
