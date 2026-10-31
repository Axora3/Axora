import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { NotificationReadControl } from "@/components/admin/NotificationControls";
import { Body, LoadFailed, Notice, PageHeader, Panel, btn } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { ADMIN_MODULE_MIGRATION_HINT, isMissingMigration } from "@/lib/admin/db-errors";
import { fmtDateTime } from "@/lib/admin/labels";
import { notificationEntityHref } from "@/lib/admin/notifications";
import { NOTIFICATION_TYPES } from "@/lib/admin/projects";

export const metadata = { title: "Мэдэгдлийн дэлгэрэнгүй" };

async function NotificationDetail({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireAdminPage();
  if (context.kind !== "ok") return null;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db, user } = context.ctx;
  const { data: item, error } = await db.from("admin_notifications")
    .select("id,event_type,title,body,entity_type,entity_id,created_at,read_at")
    .eq("id", id).eq("admin_id", user.id).maybeSingle();
  if (isMissingMigration(error)) return <Body><Notice tone="warn">{ADMIN_MODULE_MIGRATION_HINT}</Notice></Body>;
  if (error) return <Body><LoadFailed what="мэдэгдлийг" /></Body>;
  if (!item) notFound();
  const href = notificationEntityHref(item.entity_type, item.entity_id);
  return <>
    <PageHeader title={item.title} crumbs={[{ href: "/admin/notifications", label: "Мэдэгдэл" }]}
      description={`${NOTIFICATION_TYPES[item.event_type] ?? item.event_type} · ${fmtDateTime(item.created_at)}`}
      actions={<NotificationReadControl id={item.id} read={!!item.read_at} />} />
    <Body><Panel title="Мэдэгдлийн мэдээлэл"><div className="space-y-4 p-[18px]">
      <p className="text-sm font-bold text-muted">{item.read_at ? `Уншсан · ${fmtDateTime(item.read_at)}` : "Уншаагүй"}</p>
      <p className="whitespace-pre-wrap break-words text-base leading-relaxed">{item.body || "Нэмэлт тайлбар байхгүй."}</p>
      <div className="flex flex-wrap gap-2">
        {href && <Link href={href} className={btn.primary}>Холбоотой бичлэг нээх</Link>}
        <Link href="/admin/notifications" className={btn.ghost}>Жагсаалт руу буцах</Link>
      </div>
    </div></Panel></Body>
  </>;
}

export default function NotificationDetailPage(props: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<AdminPageSkeleton />}><NotificationDetail {...props} /></Suspense>;
}
