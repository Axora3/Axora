"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronLeft, Close, LogoMark, Menu } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Icon } from "@/components/ui/icon";
import { buttonStyles } from "@/components/ui/button";
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
  /** "band" merges the header into the dark hero below it. */
  tone?: "default" | "band";
};

export function SiteHeader({ variant = "main", label, back, mobileBack, wide, active: current, tone = "default" }: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useDialog<HTMLDivElement>(open, () => setOpen(false));
  const band = tone === "band";
  const max = wide ? "max-w-none px-[clamp(16px,2vw,24px)]" : "max-w-[1240px] px-[clamp(16px,4vw,40px)]";
  const iconButton = `ax-btn inline-flex h-11 w-11 items-center justify-center rounded-control border ${band ? "border-band-ring bg-transparent text-on-band" : "border-line bg-surface text-ink"}`;

  return (
    <header className={`ax-site-header sticky top-0 z-30 border-b ${band ? "ax-on-band border-band-line bg-band text-on-band" : "border-line bg-header backdrop-blur-[18px]"}`}>
      {mobileBack && (
        <div className="flex h-[60px] items-center gap-2 px-3 min-[900px]:hidden">
          <Link href={mobileBack.href} aria-label={mobileBack.label} className="ax-btn inline-flex h-11 w-11 items-center justify-center rounded-control text-ink">
            <ChevronLeft size={22} />
          </Link>
          <span className="flex-1 truncate text-base font-extrabold">{mobileBack.title}</span>
          <ThemeToggle />
        </div>
      )}

      <div className={`mx-auto flex items-center gap-6 ${max} ${variant === "compact" ? "h-[68px]" : "h-[60px] min-[900px]:h-[72px]"} ${mobileBack ? "max-[899px]:hidden" : ""}`}>
        <Link href="/" aria-label="AXORA нүүр" className={`flex min-h-11 items-center gap-2.5 no-underline ${band ? "text-on-band" : "text-ink"}`}>
          <LogoMark />
          <span className="text-[18px] font-extrabold tracking-[0.08em]">AXORA</span>
        </Link>

        {variant === "main" ? (
          <>
            <nav aria-label="Үндсэн цэс" className="hidden items-center min-[1100px]:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} aria-current={n.href === current ? "page" : undefined} className="ax-nav-link">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/favorites" aria-label="Хадгалсан загварууд" className={`${iconButton} max-[1099px]:hidden`}>
                <Icon name="heart" size={20} />
              </Link>
              <ThemeToggle tone={band ? "band" : "default"} />
              <Link href="/order" className={buttonStyles(band ? "lime" : "primary", "ax-btn hidden min-[1100px]:inline-flex")}>
                Үнийн санал авах
              </Link>
              <button type="button" aria-label="Цэс нээх" aria-expanded={open} aria-controls="ax-mobile-menu" onClick={() => setOpen(true)} className={`${iconButton} min-[1100px]:hidden`}>
                <Menu size={20} />
              </button>
            </div>
          </>
        ) : (
          <>
            {label && <span className="hidden border-l border-line pl-5 text-sm font-bold text-muted sm:inline">{label}</span>}
            <span className="ml-auto flex items-center gap-3">
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

      {open &&
        createPortal(
          <div
            ref={dialogRef}
            id="ax-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Цэс"
            className="fixed inset-0 z-50 flex h-dvh flex-col overflow-y-auto overscroll-contain bg-band p-4 pb-[calc(16px+env(safe-area-inset-bottom))] text-on-band [animation:axFade_.2s_ease_both]"
          >
            <div className="flex h-14 items-center justify-between">
              <span className="text-[18px] font-extrabold tracking-[0.08em]">AXORA</span>
              <button type="button" aria-label="Цэс хаах" data-autofocus onClick={() => setOpen(false)} className="ax-btn inline-flex h-11 w-11 items-center justify-center rounded-control border border-band-ring bg-transparent text-on-band">
                <Close size={20} />
              </button>
            </div>
            <nav aria-label="Гар утасны цэс" className="mt-6 flex flex-col">
              {[{ href: "/", label: "Нүүр" }, ...NAV, { href: "/favorites", label: "Хадгалсан" }].map((n, index) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="ax-in-sm border-b border-band-line px-1 py-4 text-[26px] font-extrabold tracking-[-0.02em] text-on-band no-underline"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <Link href="/order" onClick={() => setOpen(false)} className={buttonStyles("lime", "mt-auto w-full shrink-0", "lg")}>
              Үнийн санал авах
            </Link>
          </div>,
          document.body,
        )}
    </header>
  );
}
