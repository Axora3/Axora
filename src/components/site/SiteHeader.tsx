"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronLeft, Close, LogoMark, Menu } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useDialog } from "@/components/ui/use-dialog";

export const NAV = [
  { href: "/templates", label: "Загварууд" },
  { href: "/bundles", label: "Багцууд" },
  { href: "/services", label: "Веб хөгжүүлэлт" },
  { href: "/portfolio", label: "Портфолио" },
  { href: "/learn", label: "Сургалт" },
  { href: "/contact", label: "Тусламж" },
];

type Props = {
  /** "main": full navigation. "compact": logo, page label and a back link (builder, order). */
  variant?: "main" | "compact";
  label?: string;
  back?: { href: string; label: string };
  /** Mobile (<900px) shows a back bar with this title instead of the logo bar. */
  mobileBack?: { href: string; label: string; title: string };
  wide?: boolean;
  /** Which main-nav item is the current page (set by the page, so no runtime URL read is needed). */
  active?: string;
};

export function SiteHeader({ variant = "main", label, back, mobileBack, wide, active: current }: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useDialog<HTMLDivElement>(open, () => setOpen(false));
  const max = wide ? "max-w-[1400px] px-[clamp(16px,3vw,32px)]" : "max-w-[1240px] px-[clamp(16px,4vw,40px)]";

  return (
    <header className="ax-site-header sticky top-0 z-30 border-b border-line bg-header backdrop-blur-[18px]">
      {mobileBack && (
        <div className="flex h-[60px] items-center gap-2 px-3 min-[900px]:hidden">
          <Link
            href={mobileBack.href}
            aria-label={mobileBack.label}
            className="ax-btn inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink"
          >
            <ChevronLeft size={22} />
          </Link>
          <span className="flex-1 truncate text-base font-extrabold">{mobileBack.title}</span>
          <ThemeToggle />
        </div>
      )}

      <div
        className={`mx-auto flex items-center justify-between gap-4 ${max} ${variant === "compact" ? "h-[68px]" : "h-[60px] min-[900px]:h-[72px]"} ${mobileBack ? "max-[899px]:hidden" : ""}`}
      >
        <Link href="/" aria-label="AXORA нүүр" className="flex min-h-11 items-center gap-2.5 text-ink no-underline">
          <LogoMark />
          <span className="text-[19px] font-extrabold tracking-[0.08em]">AXORA</span>
        </Link>

        {variant === "main" ? (
          <>
            <nav aria-label="Үндсэн цэс" className="hidden items-center gap-0.5 rounded-full border border-line-soft bg-surface/65 p-1 text-[13px] font-semibold min-[1100px]:flex">
              {NAV.map((n) => {
                const active = n.href === current;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`ax-link inline-flex min-h-9 items-center rounded-full px-3 no-underline transition-colors ${active ? "bg-soft text-brand" : "text-muted hover:bg-soft-2"}`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/favorites" aria-label="Хадгалсан загварууд" className="ax-btn hidden h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-brand min-[1280px]:inline-flex"><Icon name="heart" size={20} /></Link>
              <ThemeToggle />
              <Link
                href="/order"
                className="ax-btn ax-primary hidden min-h-11 items-center rounded-[11px] bg-primary px-[18px] text-[15px] font-bold text-on-primary min-[1100px]:inline-flex"
              >
                Үнийн санал авах
              </Link>
              <button
                type="button"
                aria-label="Цэс нээх"
                aria-expanded={open}
                aria-controls="ax-mobile-menu"
                onClick={() => setOpen(true)}
                className="ax-btn inline-flex h-11 w-11 items-center justify-center rounded-[11px] border border-line bg-surface text-ink min-[1100px]:hidden"
              >
                <Menu size={20} />
              </button>
            </div>
          </>
        ) : (
          <>
            {label && <span className="hidden text-sm font-bold text-muted sm:inline">{label}</span>}
            <span className="flex items-center gap-2">
              <ThemeToggle />
            {back && (
              <Link href={back.href} className="ax-link inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-ink no-underline">
                <ArrowLeft size={16} />
                {back.label}
              </Link>
            )}
            </span>
          </>
        )}
      </div>

      {open && createPortal(
        <div
          ref={dialogRef}
          id="ax-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Цэс"
          className="fixed inset-0 z-50 flex h-dvh flex-col overflow-y-auto overscroll-contain bg-sunken p-4 pb-[calc(16px+env(safe-area-inset-bottom))] [animation:axFade_.2s_ease_both]"
        >
          <div className="flex h-14 items-center justify-between">
            <span className="text-[19px] font-extrabold tracking-[0.08em]">AXORA</span>
            <button
              type="button"
              aria-label="Цэс хаах"
              data-autofocus
              onClick={() => setOpen(false)}
              className="ax-btn inline-flex h-11 w-11 items-center justify-center rounded-[11px] border border-line bg-surface text-ink"
            >
              <Close size={20} />
            </button>
          </div>
          <nav aria-label="Гар утасны цэс" className="mt-6 flex flex-col">
            {[{ href: "/", label: "Нүүр" }, ...NAV].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="border-b border-line px-1 py-[18px] text-[22px] font-bold text-ink no-underline"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/order"
            onClick={() => setOpen(false)}
            className="ax-btn ax-primary mt-6 flex min-h-[52px] shrink-0 items-center justify-center rounded-xl bg-primary text-[17px] font-bold text-on-primary no-underline"
          >
            Үнийн санал авах
          </Link>
        </div>, document.body
      )}
    </header>
  );
}
