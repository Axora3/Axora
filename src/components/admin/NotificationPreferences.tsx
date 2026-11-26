"use client";
import { useSyncExternalStore } from "react";

const KEY = "axora.admin.notifications.unread-only";
const EVENT = "axora-notification-preference";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}
export function useUnreadNotificationPreference() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

export function NotificationPreferences() {
  const unreadOnly = useUnreadNotificationPreference();
  return (
    <div className="p-[18px]">
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-blue-600"
          checked={unreadOnly}
          onChange={(event) => {
            try {
              localStorage.setItem(KEY, String(event.target.checked));
              window.dispatchEvent(new Event(EVENT));
            } catch {
              /* Device storage is optional. */
            }
          }}
        />
        <span>
          Товч жагсаалтад зөвхөн уншаагүй мэдэгдэл харуулах
          <span className="mt-1 block text-muted">
            Энэ хөтөч дээр хадгалагдана. Бүх мэдэгдэл мэдэгдлийн төвд хэвээр
            байна.
          </span>
        </span>
      </label>
    </div>
  );
}
