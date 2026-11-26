"use server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content/service";
import { requireAdminAction } from "@/lib/admin/auth";
import {
  businessDate,
  MAX_MONEY,
  quoteItemSchema,
  workflowSettingsSchema,
  type AdminWorkflow,
} from "@/lib/order-workflow/contracts";
import { scheduleForOrder } from "@/lib/order-workflow/server";
import { flushOrderEmails } from "@/lib/order-workflow/email";
const envelope = z.object({
  orderId: z.uuid(),
  key: z.uuid(),
  action: z.enum([
    "save_quote",
    "send_quote",
    "review_payment",
    "verify_payment",
    "start",
    "complete",
    "deliver",
    "change_deadline",
    "update_progress",
    "cancel",
    "retry_email",
  ]),
  input: z.record(z.string(), z.unknown()),
});
const money = z.number().int().min(0).max(MAX_MONEY);
const schemas = {
  save_quote: z.object({
    expectedVersion: z.number().int().min(0),
    items: z.array(quoteItemSchema).min(1).max(100),
    discount: money,
    effortDays: z.number().int().min(1).max(3650).nullable(),
    notes: z.string().trim().max(4000),
    reason: z.string().trim().min(3).max(2000),
  }),
  send_quote: z.object({
    version: z.number().int().positive(),
    reviewResolved: z.boolean(),
  }),
  review_payment: z.object({ message: z.string().trim().min(3).max(2000) }),
  verify_payment: z.object({
    amount: money.refine((n) => n > 0),
    deadline: businessDate,
    scheduleRevision: z.number().int().min(0),
    customerNote: z.string().trim().max(2000).optional(),
    reason: z.string().trim().max(2000),
  }),
  start: z.object({}),
  complete: z.object({
    url: z.union([
      z.literal(""),
      z.url().refine((u) => u.startsWith("https://")),
    ]),
  }),
  deliver: z.object({ url: z.url().refine((u) => u.startsWith("https://")) }),
  change_deadline: z.object({
    deadline: businessDate,
    reason: z.string().trim().min(3).max(2000),
  }),
  update_progress: z.object({
    progress: z.number().int().min(0).max(99),
    remainingDays: z.number().int().min(0).max(3650),
    priority: z.number().int().min(-10000).max(10000),
  }),
  cancel: z.object({ reason: z.string().trim().min(3).max(2000) }),
  retry_email: z.object({ id: z.uuid(), reason: z.string().trim().max(2000) }),
};
export async function orderWorkflowAction(
  raw: unknown,
): Promise<
  { ok: true; workflow: AdminWorkflow } | { ok: false; message: string }
> {
  const ctx = await requireAdminAction();
  if (!ctx) return { ok: false, message: "Админ эрх шаардлагатай." };
  const parsed = envelope.safeParse(raw);
  if (!parsed.success)
    return { ok: false, message: "Мэдээллийн бүтэц буруу байна." };
  const { orderId, key, action } = parsed.data;
  const valid = schemas[action].safeParse(parsed.data.input);
  if (!valid.success)
    return {
      ok: false,
      message: "Дүн, огноо, тайлбар болон шаардлагатай талбаруудаа шалгана уу.",
    };
  let input: Record<string, unknown> = { ...valid.data };
  try {
    if (action === "verify_payment") {
      const proposed = await scheduleForOrder(orderId);
      if (proposed.revision !== input.scheduleRevision)
        return {
          ok: false,
          message:
            "Ажлын дараалал өөрчлөгдсөн. Шинэ огноог шалгаад дахин батална уу.",
        };
      input = {
        ...input,
        suggestion: proposed.suggestion,
        effortDays: proposed.effortDays,
      };
    }
    if (action === "save_quote")
      input.trackingToken = randomBytes(24).toString("base64url");
    const { data, error } = await ctx.db.rpc("website_order_admin_command", {
      p_order: orderId,
      p_action: action,
      p_key: key,
      p_input: input,
    });
    if (error)
      return {
        ok: false,
        message:
          "Хадгалсангүй. Үнийн хувилбар, төлбөрийн дүн, банкны баталгаажуулалт эсвэл ажлын төлөв өөрчлөгдсөн байна. Хуудсыг шинэчилж шалгана уу.",
      };
    await flushOrderEmails(3);
    const { data: refreshed } = await ctx.db.rpc("website_order_admin_view", {
      p_order: orderId,
    });
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/orders/" + orderId);
    return { ok: true, workflow: (refreshed ?? data) as AdminWorkflow };
  } catch {
    return {
      ok: false,
      message:
        "Үйлчилгээ түр боломжгүй байна. Өмнөх мэдээллээ шинэчилж шалгаад дахин оролдоно уу.",
    };
  }
}
export async function orderScheduleAction(orderId: string) {
  if (!(await requireAdminAction()) || !z.uuid().safeParse(orderId).success)
    return null;
  try {
    return await scheduleForOrder(orderId);
  } catch (e) {
    console.error(
      "[orders] schedule unavailable:",
      e instanceof Error ? e.message : "unknown",
    );
    return null;
  }
}
export async function saveWorkflowSettingsAction(raw: unknown) {
  const ctx = await requireAdminAction();
  if (!ctx) return { ok: false, message: "Админ эрх шаардлагатай." };
  const parsed = workflowSettingsSchema
    .safeExtend({ expectedVersion: z.uuid() })
    .safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Тохиргоогоо шалгана уу.",
    };
  const input = {
    ...parsed.data,
    pricing: { ...parsed.data.pricing, version: crypto.randomUUID() },
  };
  const { data, error } = await ctx.db.rpc("website_order_admin_command", {
    p_order: null,
    p_action: "save_settings",
    p_key: crypto.randomUUID(),
    p_input: input,
  });
  if (error)
    return {
      ok: false,
      message:
        "Хадгалсангүй. Өөр цонхны өөрчлөлт эсвэл migration-ийг шалгана уу.",
    };
  revalidatePath("/admin/settings");
  revalidatePath("/order");
  updateTag(CONTENT_TAG);
  return {
    ok: true,
    message: "Тохиргоо хадгаллаа. Өмнө зөвшөөрсөн үнийн санал өөрчлөгдөхгүй.",
    version: String(data.version),
  };
}
