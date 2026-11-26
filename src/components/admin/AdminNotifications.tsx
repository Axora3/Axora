"use client";

import Link from "next/link";
import { AxoraGlass } from "@/components/glass/AxoraGlass";
import { Popover } from "radix-ui";
import { Icon } from "@/components/ui/icon";
import { fmtDateTime } from "@/lib/admin/labels";
import { useUnreadNotificationPreference } from "./NotificationPreferences";

export type HeaderNotification = {
  id: string;
  title: string;
  created_at: string;
  read_at: string | null;
};

/** Read-only preview of the authenticated admin's existing notification centre. */
export function AdminNotifications({
  unread,
  items,
  tone = "default",
}: {
  unread: number | null;
  items: HeaderNotification[] | null;
  tone?: "default" | "band";
}) {
  const count = unread ?? 0;
  const unreadOnly = useUnreadNotificationPreference();
  const visibleItems =
    items?.filter((item) => !unreadOnly || !item.read_at) ?? null;
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={count ? `Мэдэгдэл, ${count} уншаагүй` : "Мэдэгдэл"}
          className={`ax-btn relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control border ${tone === "band" ? "border-band-ring bg-transparent text-on-band" : "border-line bg-surface text-ink"}`}
        >
          <Icon name="bell" size={20} />
          {count > 0 && (
            <span aria-hidden="true" className="ax-admin-unread">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="ax-admin-notification-popover ax-optical-host ax-optical-panel"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          aria-label="Сүүлийн мэдэгдэл"
        >
          <AxoraGlass preset="panel" />
          <div className="flex items-center justify-between gap-3 border-b border-line-soft p-4">
            <h2 className="text-sm font-semibold">Мэдэгдэл</h2>
            <span className="text-xs text-muted">
              {unread === null ? "Тоо тодорхойгүй" : `${count} уншаагүй`}
            </span>
          </div>
          {items === null ? (
            <p role="alert" className="p-4 text-sm text-danger-ink">
              Мэдэгдэл ачаалж чадсангүй. Мэдэгдлийн төвөөс дахин шалгана уу.
            </p>
          ) : !visibleItems?.length ? (
            <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
              <Icon name="bell" size={24} className="text-faint" />
              <p className="text-sm">Одоогоор мэдэгдэл алга</p>
              <p className="text-xs text-muted">Шинэ үйл явдал энд харагдана</p>
            </div>
          ) : (
            <ul className="m-0 max-h-[360px] list-none overflow-y-auto p-0">
              {visibleItems.map((item) => (
                <li key={item.id}>
                  <Popover.Close asChild>
                    <Link
                      href={`/admin/notifications/${item.id}`}
                      className="flex gap-3 border-b border-line-soft px-4 py-3 text-sm no-underline hover:bg-sunken"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.read_at ? "bg-line-strong" : "bg-brand"}`}
                      />
                      <span className="min-w-0">
                        <span className="block break-words text-ink">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          {fmtDateTime(item.created_at)} ·{" "}
                          {item.read_at ? "Уншсан" : "Уншаагүй"}
                        </span>
                      </span>
                    </Link>
                  </Popover.Close>
                </li>
              ))}
            </ul>
          )}
          <Popover.Close asChild>
            <Link
              href="/admin/settings#notification-preferences"
              className="flex min-h-11 items-center border-t border-line-soft px-4 text-sm text-muted no-underline"
            >
              Мэдэгдлийн тохиргоо
            </Link>
          </Popover.Close>
          <Popover.Close asChild>
            <Link
              href="/admin/notifications"
              className="flex min-h-11 items-center justify-between border-t border-line-soft px-4 text-xs text-brand no-underline"
            >
              Бүх мэдэгдэл харах
              <Icon name="arrow-right" size={14} />
            </Link>
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
