"use client";

import { Icon } from "@/components/ui/icon";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ToastProvider } from "@/components/ui/Toast";
import { useDialog } from "@/components/ui/use-dialog";
import { browserAuthClient } from "@/lib/admin/browser-auth";
import { AdminTopBar } from "./AdminTopBar";
import { ADMIN_NAV, isActive, type NavItem } from "./nav";

type Counts = { orders: number | null; requests: number | null; support: number | null; notifications: number | null };

export function LogoBadge() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-inner bg-lime">
        <Icon name="letter-a" size={18} />
      </span>
      <span className="text-[17px] font-extrabold tracking-[0.08em]">AXORA</span>
      <span className="rounded-inner border border-band-ring px-1.5 py-[3px] text-[10.5px] font-extrabold text-lime">ADMIN</span>
    </span>
  );
}

export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <>
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        setError(false);
        try {
          const client = browserAuthClient();
          if (!client) throw new Error("unavailable");
          const result = await client.auth.signOut();
          if (result.error) throw result.error;
          router.replace("/admin/login?reason=signedout");
          router.refresh();
        } catch {
          setError(true);
        } finally {
          setBusy(false);
        }
      }}
      className={className}
    >
      {busy ? "Гарч байна…" : "Гарах"}
    </button>
    {error && <p role="alert" className="px-3 text-sm">Гарч чадсангүй. Холболтоо шалгаад дахин оролдоно уу.</p>}
    </>
  );
}

/* ---------- chrome context: lets page headers open the mobile menu ---------- */

const ChromeCtx = createContext<{ openMenu: () => void; email: string; unread: number | null }>({ openMenu: () => {}, email: "", unread: 0 });
export const useAdminChrome = () => useContext(ChromeCtx);

/** Mobile header button that opens the secondary menu (content, activity, settings, sign out). */
export function AdminMenuButton({ tone = "default" }: { tone?: "default" | "band" }) {
  const { openMenu } = useAdminChrome();
  return (
    <button
      type="button"
      aria-label="Бусад цэс"
      aria-haspopup="dialog"
      aria-controls="admin-drawer"
      onClick={openMenu}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border min-[1024px]:hidden ${tone === "band" ? "border-band-ring bg-transparent text-on-band" : "border-line bg-surface text-ink"}`}
    >
      <Icon name="menu" size={20} />
    </button>
  );
}

/** Header shortcut to the notification centre, with the live unread count. */
export function AdminBell({ tone = "default" }: { tone?: "default" | "band" }) {
  const { unread } = useAdminChrome();
  const count = unread ?? 0;
  return (
    <Link
      href="/admin/notifications"
      aria-label={count > 0 ? `Мэдэгдэл, ${count} уншаагүй` : "Мэдэгдэл"}
      className={`ax-btn relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control border no-underline ${tone === "band" ? "border-band-ring bg-transparent text-on-band" : "border-line bg-surface text-ink"}`}
    >
      <Icon name="bell" size={20} />
      {count > 0 && (
        <span aria-hidden="true" className="absolute -top-1 -right-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lime px-1 text-[10.5px] font-extrabold text-on-lime tabular-nums ring-2 ring-surface">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function Badge({ n, label, on }: { n: number | null; label?: string; on?: boolean }) {
  if (n === null) return <span title="Тоог ачаалж чадсангүй" aria-label={`${label ?? "Мэдэгдлийн"} тоо тодорхойгүй`} className="text-xs text-band-muted">—</span>;
  if (n <= 0) return null;
  return (
    <span
      className={`inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-control px-1.5 text-[11.5px] font-extrabold tabular-nums ${on ? "bg-band text-lime" : "bg-band-chip text-on-band"}`}
    >
      <span aria-hidden="true">{n > 99 ? "99+" : n}</span>
      <span className="sr-only">
        {n} {label}
      </span>
    </span>
  );
}

/** Sidebar links. `collapsed` keeps icons with native tooltips; `drawer` adds what the phone header has no room for. */
function SideContent({ counts, email, onNavigate, collapsed = false, drawer = false }: { counts: Counts; email: string; onNavigate?: () => void; collapsed?: boolean; drawer?: boolean }) {
  const path = usePathname();
  const link = "flex min-h-11 items-center gap-3 rounded-control px-3 text-[14px] font-semibold no-underline transition-colors";
  return (
    <>
      <nav aria-label="Админ цэс" className="flex flex-col gap-5">
        {(["Үндсэн", "Удирдлага", "Систем"] as const).map((group) => (
          <div key={group} className="flex flex-col gap-0.5">
            {collapsed ? <span aria-hidden="true" className="mx-3 my-1 h-px bg-band-line" /> : <span className="mx-3 my-1 text-xs font-bold text-band-faint">{group}</span>}
            {ADMIN_NAV.filter((item) => item.group === group).map((n) => {
              const on = isActive(n, path);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={onNavigate}
                  aria-current={on ? "page" : undefined}
                  title={collapsed ? n.label : undefined}
                  className={`${link} ${collapsed ? "relative justify-center px-0" : ""} ${on ? "bg-lime font-extrabold text-on-lime shadow-[inset_0_1px_0_rgb(255_255_255_/_0.25)]" : "text-band-muted hover:bg-band-hover hover:text-on-band"}`}
                >
                  <Icon name={n.icon} size={20} />
                  <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate"}>{n.label}</span>
                  {n.count && (collapsed ? !!counts[n.count] && <span aria-hidden="true" className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-lime ring-2 ring-band" /> : <Badge n={counts[n.count]} label={n.countLabel} on={on} />)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      {drawer && <div className="mt-auto flex flex-col gap-1 border-t border-band-line pt-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className={`${link} text-band-muted hover:bg-band-hover hover:text-on-band`}>
          Сайт харах <Icon name="external-link" size={16} />
        </a>
        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-band-hover p-2.5">
          <span aria-hidden="true" className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-control bg-band-line text-[13px] font-extrabold uppercase">
            {email.slice(0, 2)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13.5px] font-bold" title={email}>
              {email}
            </span>
            <span className="text-xs text-band-faint">Админ</span>
          </span>
        </div>
        <SignOutButton className={`${link} w-full cursor-pointer border-0 bg-transparent text-left text-band-muted hover:bg-band-hover hover:text-on-band`} />
      </div>}
    </>
  );
}

/**
 * Bottom tab bar for phones and small tablets (<1024px). Same config as the
 * sidebar. Badges are live database counts from the layout (new orders /
 * unanswered new requests), independent of any list filter. It steps aside
 * while a form field has focus so the on-screen keyboard and the field stay
 * usable.
 */
function BottomNav({ counts }: { counts: Counts }) {
  const path = usePathname();
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const editable = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.isContentEditable || (el.matches("input, textarea, select") && !el.matches("[type=checkbox], [type=radio], [type=button], [type=submit], [type=file]")));
    const onIn = (e: FocusEvent) => setTyping(editable(e.target));
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);
  const tabs = ADMIN_NAV.filter((n): n is NavItem & { tab: true } => !!n.tab);
  return (
    <nav
      aria-label="Админ үндсэн цэс"
      className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 rounded-t-card bg-band px-2 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] text-on-band shadow-[0_-12px_30px_-18px_rgba(0,0,0,.5)] transition-transform duration-200 min-[1024px]:hidden ${typing ? "pointer-events-none translate-y-full" : ""}`}
      aria-hidden={typing || undefined}
    >
      {tabs.map((n) => {
        const on = isActive(n, path);
        const c = n.count ? counts[n.count] ?? 0 : 0;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={on ? "page" : undefined}
            tabIndex={typing ? -1 : undefined}
            className={`ax-btn flex min-h-13 flex-col items-center justify-center gap-[3px] text-[11px] no-underline ${on ? "font-extrabold text-on-band" : "font-bold text-band-muted"}`}
          >
            <span className={`relative inline-flex h-7 w-[52px] items-center justify-center rounded-control ${on ? "bg-lime" : ""}`}>
              <Icon name={n.icon} size={20} />
              {c > 0 && (
                <span className="absolute -top-1 right-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-inner bg-lime px-[5px] text-[10.5px] font-extrabold tabular-nums ring-2 ring-band">
                  {c > 99 ? "99+" : c}
                </span>
              )}
            </span>
            <span>
              {n.tabLabel}
              {c > 0 && <span className="sr-only">, {c} {n.countLabel}</span>}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

const SIDEBAR_KEY = "axora-admin-sidebar";

export function AdminShell({ counts, email, children }: { counts: Counts; email: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const ref = useDialog<HTMLDivElement>(open, () => setOpen(false));
  const [collapsed, setCollapsed] = useState(false);
  // The saved preference is only readable after mount; SSR always renders expanded.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restores a per-browser preference
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* storage blocked: stay expanded */
    }
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, value ? "0" : "1");
      } catch {
        /* the choice just lasts for this page */
      }
      return !value;
    });
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the drawer after navigation
  useEffect(() => setOpen(false), [path]);

  return (
    <ChromeCtx.Provider value={{ openMenu: () => setOpen(true), email, unread: counts.notifications }}>
      <ToastProvider>
        <div className="flex min-h-dvh bg-bg-admin">
          <aside className={`ax-admin-side sticky top-0 hidden h-dvh shrink-0 flex-col gap-5 overflow-x-hidden overflow-y-auto bg-band px-3 py-4 text-on-band min-[1024px]:flex ${collapsed ? "w-[72px]" : "w-[264px]"}`}>
            <Link href="/admin" aria-label="AXORA Admin нүүр" className={`flex min-h-10 items-center py-1 text-on-band no-underline ${collapsed ? "justify-center" : "px-2"}`}>
              {collapsed ? <span className="inline-flex h-8 w-8 items-center justify-center rounded-inner bg-lime text-on-lime"><Icon name="letter-a" size={18} /></span> : <LogoBadge />}
            </Link>
            <SideContent counts={counts} email={email} collapsed={collapsed} />
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-pressed={collapsed}
              aria-label={collapsed ? "Цэс дэлгэх" : "Цэс хураах"}
              title={collapsed ? "Цэс дэлгэх" : "Цэс хураах"}
              className={`mt-auto flex min-h-11 shrink-0 cursor-pointer items-center gap-3 rounded-control border-0 bg-transparent text-[14px] font-semibold text-band-muted transition-colors hover:bg-band-hover hover:text-on-band ${collapsed ? "justify-center" : "px-3"}`}
            >
              <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={18} />
              {!collapsed && "Цэс хураах"}
            </button>
          </aside>

          {/* Bottom padding keeps the last card and primary buttons clear of the tab bar. */}
          <div className="flex min-w-0 flex-1 flex-col pb-[calc(84px+env(safe-area-inset-bottom))] min-[1024px]:pb-0">
            <AdminTopBar email={email} />
            {children}
          </div>

          <BottomNav counts={counts} />

          {open && (
            <div className="fixed inset-0 z-50 min-[1024px]:hidden">
              <div aria-hidden="true" onClick={() => setOpen(false)} className="absolute inset-0 bg-overlay [animation:axFade_.2s_ease_both]" />
              <div
                ref={ref}
                id="admin-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Админ цэс"
                className="absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col gap-6 overflow-y-auto bg-band px-3.5 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] text-on-band [animation:axSlide_.25s_ease_both]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2 text-on-band">
                    <LogoBadge />
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-2">
                    <ThemeToggle tone="band" size={20} />
                    <button type="button" data-autofocus aria-label="Цэс хаах" onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-control border-0 bg-band-hover text-on-band">
                      <Icon name="x" size={20} />
                    </button>
                  </span>
                </div>
                <SideContent counts={counts} email={email} onNavigate={() => setOpen(false)} drawer />
              </div>
            </div>
          )}
        </div>
      </ToastProvider>
    </ChromeCtx.Provider>
  );
}
