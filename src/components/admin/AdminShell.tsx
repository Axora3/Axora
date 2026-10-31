"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Close, Menu } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ToastProvider } from "@/components/ui/Toast";
import { useDialog } from "@/components/ui/use-dialog";
import { browserAuthClient } from "@/lib/admin/browser-auth";
import { ADMIN_NAV, isActive, type NavItem } from "./nav";

type Counts = { orders: number | null; requests: number | null; support: number | null; notifications: number | null };

export function LogoBadge() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] bg-lime">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20L12 4l8 16h-4.2L12 12.2 8.2 20z" fill="currentColor" />
        </svg>
      </span>
      <span className="text-[17px] font-extrabold tracking-[0.08em]">AXORA</span>
      <span className="rounded-[5px] border border-band-ring px-1.5 py-[3px] text-[10.5px] font-extrabold text-lime">ADMIN</span>
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

const ChromeCtx = createContext<{ openMenu: () => void; email: string }>({ openMenu: () => {}, email: "" });
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
      <Menu size={20} />
    </button>
  );
}

function Badge({ n, label, on }: { n: number | null; label?: string; on?: boolean }) {
  if (n === null) return <span title="Тоог ачаалж чадсангүй" aria-label={`${label ?? "Мэдэгдлийн"} тоо тодорхойгүй`} className="text-xs text-band-muted">—</span>;
  if (n <= 0) return null;
  return (
    <span
      className={`inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[11px] px-1.5 text-[11.5px] font-extrabold tabular-nums ${on ? "bg-band text-lime" : "bg-band-chip text-on-band"}`}
    >
      <span aria-hidden="true">{n > 99 ? "99+" : n}</span>
      <span className="sr-only">
        {n} {label}
      </span>
    </span>
  );
}

function SideContent({ counts, email, onNavigate }: { counts: Counts; email: string; onNavigate?: () => void }) {
  const path = usePathname();
  const link = "flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[14.5px] font-semibold no-underline transition-colors";
  return (
    <>
      <nav aria-label="Админ цэс" className="flex flex-col gap-4">
        {(["Үндсэн", "Удирдлага", "Систем"] as const).map((group) => (
          <div key={group} className="flex flex-col gap-0.5">
            <span className="mx-3 my-1 text-[11px] font-extrabold tracking-[0.1em] text-band-faint uppercase">{group}</span>
            {ADMIN_NAV.filter((item) => item.group === group).map((n) => {
              const on = isActive(n, path);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={onNavigate}
                  aria-current={on ? "page" : undefined}
                  className={`${link} ${on ? "bg-lime font-extrabold text-on-lime" : "text-band-muted hover:bg-band-hover hover:text-on-band"}`}
                >
                  <n.Icon size={18} />
                  <span className="flex-1">{n.label}</span>
                  {n.count && <Badge n={counts[n.count]} label={n.countLabel} on={on} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-1">
        <span className="mx-3 my-1 text-[11px] font-extrabold tracking-[0.1em] text-band-faint uppercase">Бусад</span>
        <a href="/" target="_blank" rel="noopener noreferrer" className={`${link} text-band-muted hover:bg-band-hover hover:text-on-band`}>
          Сайт харах ↗
        </a>
        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-band-hover p-2.5">
          <span aria-hidden="true" className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-band-line text-[13px] font-extrabold uppercase">
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
      </div>
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
      className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 rounded-t-[22px] bg-band px-2 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] text-on-band shadow-[0_-12px_30px_-18px_rgba(0,0,0,.5)] transition-transform duration-200 min-[1024px]:hidden ${typing ? "pointer-events-none translate-y-full" : ""}`}
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
            className={`ax-btn flex min-h-[54px] flex-col items-center justify-center gap-[3px] text-[11px] no-underline ${on ? "font-extrabold text-on-band" : "font-bold text-band-muted"}`}
          >
            <span className={`relative inline-flex h-7 w-[52px] items-center justify-center rounded-[14px] ${on ? "bg-lime" : ""}`}>
              <n.Icon size={20} />
              {c > 0 && (
                <span className="absolute -top-1 right-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] bg-lime px-[5px] text-[10.5px] font-extrabold tabular-nums ring-2 ring-band">
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

export function AdminShell({ counts, email, children }: { counts: Counts; email: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const ref = useDialog<HTMLDivElement>(open, () => setOpen(false));
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the drawer after navigation
  useEffect(() => setOpen(false), [path]);

  return (
    <ChromeCtx.Provider value={{ openMenu: () => setOpen(true), email }}>
      <ToastProvider>
        <div className="flex min-h-dvh bg-bg-admin">
          <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col gap-6 overflow-y-auto bg-band px-3.5 py-5 text-on-band min-[1024px]:flex">
            <Link href="/admin" aria-label="AXORA Admin нүүр" className="px-2 py-1 text-on-band no-underline">
              <LogoBadge />
            </Link>
            <SideContent counts={counts} email={email} />
          </aside>

          {/* Bottom padding keeps the last card and primary buttons clear of the tab bar. */}
          <div className="flex min-w-0 flex-1 flex-col pb-[calc(84px+env(safe-area-inset-bottom))] min-[1024px]:pb-0">{children}</div>

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
                    <ThemeToggle tone="band" />
                    <button type="button" data-autofocus aria-label="Цэс хаах" onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border-0 bg-band-hover text-on-band">
                      <Close size={20} />
                    </button>
                  </span>
                </div>
                <SideContent counts={counts} email={email} onNavigate={() => setOpen(false)} />
              </div>
            </div>
          )}
        </div>
      </ToastProvider>
    </ChromeCtx.Provider>
  );
}
