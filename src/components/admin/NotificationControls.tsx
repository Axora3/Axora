"use client";

import { runAdminAction } from "@/lib/admin/action-client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markAllNotificationsReadAction, setNotificationReadAction } from "@/app/admin/notification-actions";
import { useToast } from "@/components/ui/Toast";
import { btn } from "./ui";

export function NotificationReadControl({ id, read }: { id: string; read: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  return <button className={btn.ghost} disabled={pending} onClick={() => start(async () => {
    const result = await runAdminAction(() => setNotificationReadAction({ id, read: !read }));
    if (!result.ok) return toast({ kind: "err", text: result.message });
    toast({ kind: "ok", text: read ? "Уншаагүйд тэмдэглэлээ." : "Уншсанд тэмдэглэлээ." });
    router.refresh();
  })}>{pending ? "Хадгалж байна…" : read ? "Уншаагүй болгох" : "Уншсанд тэмдэглэх"}</button>;
}

export function MarkAllNotificationsRead({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  return <button className={btn.ghost} disabled={pending || disabled} onClick={() => start(async () => {
    const result = await runAdminAction(() => markAllNotificationsReadAction());
    if (!result.ok) return toast({ kind: "err", text: result.message });
    toast({ kind: "ok", text: "Бүх мэдэгдлийг уншсанд тэмдэглэлээ." });
    router.refresh();
  })}>{pending ? "Хадгалж байна…" : "Бүгдийг уншсанд тэмдэглэх"}</button>;
}
