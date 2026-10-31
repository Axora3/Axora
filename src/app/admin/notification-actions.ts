"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DENIED, requireAdminAction, type ActionResult } from "@/lib/admin/auth";
import { ADMIN_MODULE_MIGRATION_HINT, isMissingMigration } from "@/lib/admin/db-errors";

const itemInput = z.object({ id: z.uuid(), read: z.boolean() });

function fail(error: { code?: string } | null) {
  return isMissingMigration(error)
    ? { ok: false as const, code: "migration", message: ADMIN_MODULE_MIGRATION_HINT }
    : { ok: false as const, code: "server", message: "Мэдэгдлийн төлөв хадгалагдсангүй. Дахин оролдоно уу." };
}

function refresh() {
  revalidatePath("/admin/notifications");
  revalidatePath("/admin", "layout");
}

export async function setNotificationReadAction(input: z.input<typeof itemInput>): Promise<ActionResult> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const p = itemInput.safeParse(input);
  if (!p.success) return { ok: false, code: "invalid", message: "Мэдэгдэл олдсонгүй." };
  const { data, error } = await ctx.db.from("admin_notifications").update({ read_at: p.data.read ? new Date().toISOString() : null })
    .eq("id", p.data.id).eq("admin_id", ctx.user.id).select("id");
  if (error) return fail(error);
  if (!data?.length) return { ok: false, code: "not_found", message: "Мэдэгдэл олдсонгүй." };
  refresh();
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const ctx = await requireAdminAction();
  if (!ctx) return DENIED;
  const { error } = await ctx.db.from("admin_notifications").update({ read_at: new Date().toISOString() })
    .eq("admin_id", ctx.user.id).is("read_at", null);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}
