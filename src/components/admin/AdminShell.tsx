"use client";
import { GlassActiveIndicator } from "@/components/glass/GlassActiveIndicator";
import { AxoraGlass } from "@/components/glass/AxoraGlass";

import { AxoraMonogram } from "@/components/brand/AxoraLogo";
import { Menu as MenuIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  Sidebar,
  SidebarGroup,
  SidebarLink,
  sidebarItemStyles,
} from "@/components/ui/sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { useDialog } from "@/components/ui/use-dialog";
import { browserAuthClient } from "@/lib/admin/browser-auth";
import { AdminMobileTopBar, AdminSearch, AdminTopBar } from "./AdminTopBar";
import { ADMIN_NAV, NAV_GROUPS, isActive, type NavItem } from "./nav";
import { ADMIN_SIDEBAR_KEY } from "./sidebar-preference";
import {
  AdminNotifications,
  type HeaderNotification,
} from "./AdminNotifications";

type Counts = {
  orders: number | null;
  requests: number | null;
  support: number | null;
  notifications: number | null;
};

export function LogoBadge() {
  return (
    <span className="ax-admin-brand flex items-center gap-3">
      <span className="ax-admin-brand-mark inline-flex h-8 w-8 items-center justify-center rounded-inner bg-lime">
        <AxoraMonogram width={24} height={24} />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-[17px] font-semibold tracking-[0.04em]">
          AXORA<span className="font-normal text-band-faint"> /</span>
        </span>
        <span className="text-[11px] font-normal text-band-faint">
          Admin workspace
        </span>
      </span>
    </span>
  );
}

export function SignOutButton({
  className = "",
  menuItem = false,
}: {
  className?: string;
  menuItem?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <>
      <button
        type="button"
        role={menuItem ? "menuitem" : undefined}
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
      {error && (
        <p role="alert" className="px-3 text-sm">
          Гарч чадсангүй. Холболтоо шалгаад дахин оролдоно уу.
        </p>
      )}
    </>
  );
}

/* ---------- chrome context: lets page headers open the mobile menu ---------- */

const ChromeCtx = createContext<{
  openMenu: () => void;
  menuOpen: boolean;
  email: string;
  unread: number | null;
  notifications: HeaderNotification[] | null;
}>({
  openMenu: () => {},
  menuOpen: false,
  email: "",
  unread: 0,
  notifications: [],
});
export const useAdminChrome = () => useContext(ChromeCtx);

/** Mobile header button that opens the secondary menu (content, activity, settings, sign out). */
export function AdminMenuButton({
  tone = "default",
}: {
  tone?: "default" | "band";
}) {
  const { openMenu, menuOpen } = useAdminChrome();
  return (
    <button
      type="button"
      aria-label="Бусад цэс"
      aria-haspopup="dialog"
      aria-controls="admin-drawer"
      aria-expanded={menuOpen}
      onClick={openMenu}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border min-[1024px]:hidden ${tone === "band" ? "border-band-ring bg-transparent text-on-band" : "border-line bg-surface text-ink"}`}
    >
      <MenuIcon aria-hidden="true" size={20} strokeWidth={1.75} />
    </button>
  );
}

/** The header and mobile header share the same authenticated notification preview. */
export function AdminBell({ tone = "default" }: { tone?: "default" | "band" }) {
  const { unread, notifications } = useAdminChrome();
  return (
    <AdminNotifications unread={unread} items={notifications} tone={tone} />
  );
}

function Badge({
  n,
  label,
  on,
}: {
  n: number | null;
  label?: string;
  on?: boolean;
}) {
  if (n === null)
    return (
      <span
        title="Тоог ачаалж чадсангүй"
        aria-label={`${label ?? "Мэдэгдлийн"} тоо тодорхойгүй`}
        className="text-xs text-band-muted"
      >
        —
      </span>
    );
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

/** Shared complete navigation; only this section scrolls inside either sidebar. */
function SideContent({
  counts,
  onNavigate,
  collapsed = false,
}: {
  counts: Counts;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const path = usePathname();
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const container = nav.current;
    const active = container?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    if (!container || !active) return;
    const box = container.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.top < box.top) container.scrollTop -= box.top - item.top;
    else if (item.bottom > box.bottom)
      container.scrollTop += item.bottom - box.bottom;
  }, [path, collapsed]);
  return (
    <>
      <nav
        ref={nav}
        aria-label="Админ цэс"
        className="ax-admin-nav flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain"
      >
        {NAV_GROUPS.filter((group) =>
          ADMIN_NAV.some((item) => item.group === group),
        ).map((group) => (
          <SidebarGroup key={group} label={group} collapsed={collapsed}>
            {ADMIN_NAV.filter((item) => item.group === group).map((n) => {
              const on = isActive(n, path);
              return (
                <SidebarLink
                  key={n.href}
                  href={n.href}
                  onClick={onNavigate}
                  active={on}
                  collapsed={collapsed}
                  icon={
                    <n.Icon aria-hidden="true" size={20} className="shrink-0" />
                  }
                  label={n.label}
                  adornment={
                    n.count &&
                    (collapsed ? (
                      !!counts[n.count] && (
                        <span
                          aria-hidden="true"
                          className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-lime ring-2 ring-band"
                        />
                      )
                    ) : (
                      <Badge n={counts[n.count]} label={n.countLabel} on={on} />
                    ))
                  }
                />
              );
            })}
          </SidebarGroup>
        ))}
      </nav>
    </>
  );
}

function DrawerFooter({
  email,
  onNavigate,
}: {
  email: string;
  onNavigate: () => void;
}) {
  const link = sidebarItemStyles;
  return (
    <footer className="ax-admin-drawer-footer">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className={`${link} text-band-muted hover:bg-band-hover hover:text-on-band`}
      >
        Сайт харах <Icon name="external-link" size={16} />
      </a>
      <Link
        href="/admin/settings"
        onClick={onNavigate}
        className="ax-admin-drawer-profile flex min-w-0 items-center gap-2.5 rounded-xl bg-band-hover p-2.5 no-underline"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-control bg-band-line text-[13px] font-extrabold uppercase"
        >
          {email.slice(0, 2)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13.5px] font-bold" title={email}>
            {email}
          </span>
          <span className="text-xs text-band-faint">Админ</span>
        </span>
      </Link>
      <SignOutButton
        className={`${link} w-full cursor-pointer border-0 bg-transparent text-left text-band-muted hover:bg-band-hover hover:text-on-band`}
      />
    </footer>
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
      el instanceof HTMLElement &&
      (el.isContentEditable ||
        (el.matches("input, textarea, select") &&
          !el.matches(
            "[type=checkbox], [type=radio], [type=button], [type=submit], [type=file]",
          )));
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
      className={`ax-admin-dock ax-optical-host ax-optical-nav min-[1024px]:hidden ${typing ? "ax-dock-hidden" : ""}`}
      aria-hidden={typing || undefined}
    >
      <AxoraGlass preset="navigation" />
      <GlassActiveIndicator selection={path} />
      {tabs.map((n) => {
        const on = isActive(n, path);
        const c = n.count ? (counts[n.count] ?? 0) : 0;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={on ? "page" : undefined}
            tabIndex={typing ? -1 : undefined}
            className="ax-dock-item"
          >
            <span className="ax-dock-icon">
              <n.Icon aria-hidden="true" size={20} />
              {c > 0 && (
                <span className="ax-dock-badge" aria-hidden="true">
                  {c > 99 ? "99+" : c}
                </span>
              )}
            </span>
            <span className="ax-dock-label">
              {n.tabLabel}
              {c > 0 && (
                <span className="sr-only">
                  , {c} {n.countLabel}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

const SIDEBAR_KEY = ADMIN_SIDEBAR_KEY;

export function AdminShell({
  counts,
  email,
  children,
  notifications = [],
}: {
  counts: Counts;
  email: string;
  children: React.ReactNode;
  notifications?: HeaderNotification[] | null;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const ref = useDialog<HTMLDivElement>(open, () => setOpen(false));
  const [collapsed, setCollapsed] = useState(false);
  // The saved preference is only readable after mount; SSR always renders expanded.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restores a per-browser preference
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
      document.documentElement.dataset.adminSidebar =
        localStorage.getItem(SIDEBAR_KEY) === "1" ? "collapsed" : "expanded";
    } catch {
      /* storage blocked: stay expanded */
    }
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, value ? "0" : "1");
        document.documentElement.dataset.adminSidebar = value
          ? "expanded"
          : "collapsed";
      } catch {
        /* the choice just lasts for this page */
      }
      return !value;
    });
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the drawer after navigation
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <ChromeCtx.Provider
      value={{
        openMenu: () => setOpen(true),
        menuOpen: open,
        email,
        unread: counts.notifications,
        notifications,
      }}
    >
      <ToastProvider>
        <div className="ax-admin flex min-h-dvh bg-bg-admin">
          <Sidebar
            collapsed={collapsed}
            className="sticky top-0 hidden h-dvh min-[1024px]:flex"
          >
            <Link
              href="/admin"
              aria-label="AXORA Admin нүүр"
              className={`flex min-h-10 items-center py-1 text-on-band no-underline ${collapsed ? "justify-center" : "px-2"}`}
            >
              {collapsed ? (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-inner bg-lime text-on-lime">
                  <Icon name="letter-a" size={18} />
                </span>
              ) : (
                <LogoBadge />
              )}
            </Link>
            <SideContent counts={counts} collapsed={collapsed} />
            <footer className="ax-admin-desktop-footer">
              {!collapsed && (
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ax-admin-site-link"
                >
                  <Icon name="external-link" size={16} />
                  Сайт харах
                  <Icon name="arrow-up-right" size={14} />
                </a>
              )}
              {!collapsed && (
                <div className="ax-admin-sidebar-account">
                  <Link
                    href="/admin/settings"
                    className="flex min-w-0 items-center gap-2 no-underline"
                  >
                    <span className="ax-admin-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs">
                      {email.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-xs text-ink"
                        title={email}
                      >
                        {email}
                      </span>
                      <span className="block text-[11px] text-faint">
                        Админ · Тохиргоо
                      </span>
                    </span>
                  </Link>
                  <SignOutButton className="ax-admin-sidebar-signout" />
                </div>
              )}
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-pressed={collapsed}
                aria-label={collapsed ? "Цэс дэлгэх" : "Цэс хураах"}
                title={collapsed ? "Цэс дэлгэх" : "Цэс хураах"}
                className={`mt-auto flex min-h-11 shrink-0 cursor-pointer items-center gap-3 rounded-control border-0 bg-transparent text-[14px] font-semibold text-band-muted transition-colors hover:bg-band-hover hover:text-on-band ${collapsed ? "justify-center" : "px-3"}`}
              >
                <Icon
                  name={collapsed ? "chevron-right" : "chevron-left"}
                  size={18}
                />
                {!collapsed && "Цэс хураах"}
              </button>
            </footer>
          </Sidebar>

          {/* Bottom padding keeps the last card and primary buttons clear of the tab bar. */}
          <div
            inert={open || undefined}
            className="ax-admin-canvas flex min-w-0 flex-1 flex-col"
          >
            <AdminMobileTopBar />
            <AdminTopBar email={email} />
            {children}
          </div>

          <div
            inert={open || undefined}
            className={open ? "invisible" : undefined}
          >
            <BottomNav counts={counts} />
          </div>

          {open && (
            <div className="fixed inset-0 z-50 min-[1024px]:hidden">
              <div
                aria-hidden="true"
                onClick={() => setOpen(false)}
                className="ax-admin-drawer-overlay absolute inset-0 bg-overlay [animation:axFade_.2s_ease_both]"
              />
              <div
                ref={ref}
                id="admin-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Админ цэс"
                className="ax-admin-mobile-drawer absolute inset-y-0 left-0 flex min-h-0 w-[min(320px,92vw)] flex-col overflow-hidden bg-band text-on-band"
              >
                <header className="ax-admin-drawer-header flex shrink-0 items-center justify-between gap-2">
                  <span className="px-2 text-on-band">
                    <LogoBadge />
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-2">
                    <ThemeToggle tone="band" size={20} />
                    <button
                      type="button"
                      data-autofocus
                      aria-label="Цэс хаах"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-control border-0 bg-band-hover text-on-band"
                    >
                      <Icon name="x" size={20} />
                    </button>
                  </span>
                </header>
                <div className="ax-admin-drawer-search shrink-0">
                  <AdminSearch compact />
                </div>
                <SideContent
                  counts={counts}
                  onNavigate={() => setOpen(false)}
                />
                <DrawerFooter email={email} onNavigate={() => setOpen(false)} />
              </div>
            </div>
          )}
        </div>
      </ToastProvider>
    </ChromeCtx.Provider>
  );
}
