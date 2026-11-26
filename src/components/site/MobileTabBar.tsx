"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Form, Grid, Home, Sliders } from "@/components/icons";
import { AxoraGlass } from "@/components/glass/AxoraGlass";
import { GlassActiveIndicator } from "@/components/glass/GlassActiveIndicator";

const TABS = [
  { href: "/", label: "Нүүр", Icon: Home, match: (p: string) => p === "/" },
  {
    href: "/templates",
    label: "Загварууд",
    Icon: Grid,
    match: (p: string) => p.startsWith("/templates"),
  },
  {
    href: "/builder",
    label: "Builder",
    Icon: Sliders,
    match: (p: string) => p.startsWith("/builder") || p.startsWith("/services"),
  },
  {
    href: "/order",
    label: "Анкет",
    Icon: Form,
    match: (p: string) => p.startsWith("/order"),
  },
];

/**
 * Bottom navigation for phones and small tablets (<900px), as in the mobile
 * design. Hidden on pages with their own sticky action bar (template detail, order, builder).
 */
export function MobileTabBar({ pathname }: { pathname: string }) {
  const hidden =
    /^\/templates\/[^/]+/.test(pathname) ||
    /^\/learn\/[^/]+/.test(pathname) ||
    pathname.startsWith("/order") ||
    pathname.startsWith("/builder") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dev");

  useEffect(() => {
    document.body.classList.toggle("has-tabbar", !hidden);
    return () => document.body.classList.remove("has-tabbar");
  }, [hidden]);

  if (hidden) return null;
  return (
    <nav
      aria-label="Доод цэс"
      className="ax-mobile-dock ax-optical-host ax-optical-nav fixed z-40 grid grid-cols-4 min-[900px]:hidden"
    >
      <AxoraGlass preset="navigation" />
      <GlassActiveIndicator selection={pathname} />
      {TABS.map(({ href, label, Icon, match }) => {
        const on = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`ax-dock-link ax-btn flex flex-col items-center justify-center gap-[3px] text-[11px] no-underline ${on ? "font-extrabold text-ink" : "font-bold text-muted"}`}
          >
            <span className="inline-flex h-7 w-[52px] items-center justify-center">
              <Icon size={20} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
