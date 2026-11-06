"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronLeft, LogoMark, Menu as MenuIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Menu } from "@/components/ui/menu";
import { cn } from "@/lib/utils";
import { MobileNav, type NavLink } from "./MobileNav";

const NAV: NavLink[] = [
  { href: "/", label: "Нүүр", icon: "home" },
  { href: "/templates", label: "Загварууд", icon: "layout-grid" },
  { href: "/services", label: "Үйлчилгээ", icon: "monitor" },
  { href: "/builder", label: "Website Builder", icon: "adjustments" },
  { href: "/contact", label: "Холбоо барих", icon: "message" },
];

/** Existing destinations that are not in the main five, so nothing becomes unreachable. */
const MORE: NavLink[] = [
  { href: "/bundles", label: "Багцууд", icon: "layers" },
  { href: "/portfolio", label: "Портфолио", icon: "photo" },
  { href: "/learn", label: "Сургалт", icon: "list-check" },
  { href: "/blog", label: "Нийтлэл", icon: "file-text" },
  { href: "/favorites", label: "Хадгалсан", icon: "heart" },
  { href: "/compare", label: "Харьцуулах", icon: "swap" },
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
  const [drawerReady, setDrawerReady] = useState(false);
  const band = tone === "band";
  const max = wide ? "max-w-none px-[clamp(16px,2vw,24px)]" : "max-w-[1240px] px-gutter";
  const iconButton = `ax-btn inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-control border ${band ? "border-band-ring bg-transparent text-on-band" : "border-line bg-surface text-ink"}`;
  const moreActive = MORE.some((n) => n.href === current);

  return (
    <header className={cn("ax-site-header sticky top-0 z-(--ax-z-sticky) border-b", band ? "ax-on-band border-band-line bg-band text-on-band" : "border-line bg-header backdrop-blur-[18px]")}>
      {mobileBack && (
        <div className="flex h-[60px] items-center gap-2 px-3 nav:hidden">
          <Link href={mobileBack.href} aria-label={mobileBack.label} className="ax-btn inline-flex h-11 w-11 items-center justify-center rounded-control text-ink">
            <ChevronLeft size={22} />
          </Link>
          <span className="flex-1 truncate text-base font-extrabold">{mobileBack.title}</span>
          <ThemeToggle />
        </div>
      )}

      <div className={cn("mx-auto flex items-center gap-6", max, variant === "compact" ? "h-[68px]" : "h-[60px] nav:h-[72px]", mobileBack && "max-[899px]:hidden")}>
        <Link href="/" aria-label="AXORA нүүр" className={cn("flex min-h-11 items-center gap-2.5 no-underline", band ? "text-on-band" : "text-ink")}>
          <LogoMark />
          <span className="text-[18px] font-extrabold tracking-[0.08em]">AXORA</span>
        </Link>

        {variant === "main" ? (
          <>
            <nav aria-label="Үндсэн цэс" className="hidden items-center desk:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} aria-current={n.href === current ? "page" : undefined} className="ax-nav-link">
                  {n.label}
                </Link>
              ))}
              <Menu
                label="Бусад хуудас"
                triggerClassName={cn("ax-nav-link cursor-pointer gap-1 border-0 bg-transparent", moreActive && "text-ink")}
                trigger={<>Бусад <ChevronDown size={14} /></>}
              >
                {MORE.map((n) => (
                  <Link key={n.href} href={n.href} aria-current={n.href === current ? "page" : undefined} role="menuitem" className="ax-menu-item text-ink no-underline">
                    <Icon name={n.icon} size={16} className="text-brand" />
                    {n.label}
                  </Link>
                ))}
              </Menu>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle tone={band ? "band" : "default"} />
              <Link href="/builder" className={buttonStyles(band ? "lime" : "primary", "ax-btn hidden sm:inline-flex")}>
                Вебсайт бүтээх
              </Link>
              <button
                type="button"
                aria-label="Цэс нээх"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={open ? "ax-mobile-menu" : undefined}
                onClick={() => {
                  setDrawerReady(true);
                  setOpen(true);
                }}
                className={`${iconButton} desk:hidden`}
              >
                <MenuIcon size={20} />
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

      {drawerReady && <MobileNav open={open} onClose={() => setOpen(false)} links={NAV} more={MORE} current={current} />}
    </header>
  );
}
