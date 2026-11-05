"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DENIED, requireAdminAction, type ActionFail, type ActionResult } from "@/lib/admin/auth";
import { isMissingMigration } from "@/lib/admin/db-errors";
import { ORDER_PAYMENT_MIGRATION_HINT } from "@/lib/order/payment";

const CONFLICT: ActionFail = { ok: false, code: "conflict", message: "Энэ захиалгыг өөр цонхноос өөрчилсөн байна. Хуудсаа сэргээнэ үү." };
const FAILED: ActionFail = { ok: false, code: "server", message: "Хадгалж чадсангүй. Холболтоо шалгаад дахин оролдоно уу." };

const fail = (error: { code?: string }): ActionFail => (isMissingMigration(error) ? { ok: false, code: "migration", message: ORDER_PAYMENT_MIGRATION_HINT } : FAILED);

function refresh(id: string) {
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

const quote = z.object({ id: z.uuid(), expected: z.string().min(10), amount: z.number().int().positive().max(999_999_999_999) });

/** Sets the agreed amount. The payment link is created once and stays the same when the amount changes. */
export async function saveOrderQuoteAction(input: z.input<typeof quote>): Promise<ActionResult<{ updatedAt: string; token: string }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = quote.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Дүнгээ 0-ээс их бүхэл тоогоор оруулна уу." };
  const { data: cur, error: readError } = await ctx.db.from("website_orders").select("payment_status, payment_token, updated_at").eq("id", p.data.id).maybeSingle();
  if (readError) return fail(readError);
  if (!cur) return { ok: false, code: "not_found", message: "Захиалга олдсонгүй." };
  if (cur.updated_at !== p.data.expected) return CONFLICT;
  if (cur.payment_status === "paid") return { ok: false, code: "paid", message: "Төлөгдсөн захиалгын дүнг өөрчлөхгүй. Эхлээд “Төлөгдөөгүй” болгоно уу." };
  const token = cur.payment_token ?? randomBytes(24).toString("base64url");
  const { data, error } = await ctx.db.from("website_orders").update({ quote_amount: p.data.amount, payment_token: token }).eq("id", p.data.id).eq("updated_at", p.data.expected).select("updated_at");
  if (error) return fail(error);
  if (!data?.length) return CONFLICT;
  refresh(p.data.id);
  return { ok: true, updatedAt: data[0].updated_at, token };
}

const paid = z.object({ id: z.uuid(), expected: z.string().min(10), paid: z.boolean() });

/** An admin's own record after checking the bank; nothing here verifies the transfer. */
export async function setOrderPaidAction(input: z.input<typeof paid>): Promise<ActionResult<{ updatedAt: string }>> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = paid.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Утга буруу байна." };
  const { data, error } = await ctx.db
    .from("website_orders")
    .update({ payment_status: p.data.paid ? "paid" : "unpaid", paid_at: p.data.paid ? new Date().toISOString() : null })
    .eq("id", p.data.id)
    .eq("updated_at", p.data.expected)
    .select("updated_at");
  if (error) return fail(error);
  if (!data?.length) return CONFLICT;
  refresh(p.data.id);
  return { ok: true, updatedAt: data[0].updated_at };
}
