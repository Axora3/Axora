"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AxoraLogo } from "@/components/brand/AxoraLogo";
import { Menu as MenuIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { buttonStyles } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { MobileNav, type NavLink } from "./MobileNav";
import { AxoraGlass } from "@/components/glass/AxoraGlass";
import { GlassActiveIndicator } from "@/components/glass/GlassActiveIndicator";
const NAV: NavLink[] = [
  { href: "/", label: "Нүүр", icon: "home" },
  { href: "/templates", label: "Загварууд", icon: "layout-grid" },
  { href: "/services", label: "Үйлчилгээ", icon: "monitor" },
  { href: "/builder", label: "Веб бүтээгч", icon: "adjustments" },
  { href: "/contact", label: "Холбоо барих", icon: "message" },
];

/** Existing destinations that are not in the main five, so nothing becomes unreachable. */
const MORE: NavLink[] = [
  { href: "/english-words", label: "English Words", icon: "list-check" },
  { href: "/bundles", label: "Багцууд", icon: "layers" },
  { href: "/portfolio", label: "Портфолио", icon: "photo" },
  { href: "/learn", label: "Сургалт", icon: "list-check" },
  { href: "/blog", label: "Нийтлэл", icon: "file-text" },
  { href: "/favorites", label: "Хадгалсан", icon: "heart" },
  { href: "/compare", label: "Харьцуулах", icon: "swap" },
];

/** The persistent public shell is the only owner of this primary navigation. */
export function SiteHeader() {
  const pathname = usePathname();
  const current = [...NAV, ...MORE].find((n) =>
    n.href === "/"
      ? pathname === "/"
      : pathname === n.href || pathname.startsWith(n.href + "/"),
  )?.href;
  const [open, setOpen] = useState(false);
  const [drawerReady, setDrawerReady] = useState(false);
  return (
    <header className="ax-site-header ax-optical-host sticky z-(--ax-z-sticky) text-on-band">
      <AxoraGlass preset="navigation" />
      <div className="ax-header-inner mx-auto flex h-16 items-center gap-6">
        <Link
          href="/"
          aria-label="AXORA — Нүүр хуудас"
          className="ax-header-brand inline-flex min-h-11 items-center no-underline text-on-band"
        >
          <AxoraLogo />
        </Link>
        <nav
          aria-label="Үндсэн цэс"
          className="ax-header-nav ax-optical-nav hidden items-center desk:flex"
        >
          <GlassActiveIndicator selection={current ?? pathname} />
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={n.href === current ? "page" : undefined}
              className="ax-nav-link"
            >
              {n.label}
            </Link>
          ))}
          <Menu
            label="Бусад хуудас"
            trigger="Бусад"
            triggerClassName={`ax-nav-link cursor-pointer border-0 bg-transparent ${MORE.some((n) => n.href === current) ? "ax-header-more-active" : ""}`}
          >
            {MORE.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                role="menuitem"
                aria-current={n.href === current ? "page" : undefined}
                className="ax-menu-item text-ink no-underline"
              >
                {n.label}
              </Link>
            ))}
          </Menu>
        </nav>
        <div className="ax-header-actions ml-auto flex items-center gap-2">
          <ThemeToggle tone="band" />
          <Link
            href="/builder"
            className={buttonStyles(
              "lime",
              "ax-header-cta ax-optical-host relative ax-btn hidden sm:inline-flex",
            )}
          >
            <AxoraGlass preset="control"/>
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
            className="ax-header-menu-toggle ax-btn inline-flex h-11 w-11 items-center justify-center rounded-full border border-band-ring bg-transparent text-on-band desk:hidden"
          >
            <MenuIcon size={20} />
          </button>
        </div>
      </div>
      {drawerReady && (
        <MobileNav
          open={open}
          onClose={() => setOpen(false)}
          links={NAV}
          more={MORE}
          current={current}
        />
      )}
    </header>
  );
}
