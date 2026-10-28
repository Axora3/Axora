"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Form, Grid, Home, Sliders } from "@/components/icons";

const TABS = [
  { href: "/", label: "Нүүр", Icon: Home, match: (p: string) => p === "/" },
  { href: "/templates", label: "Загварууд", Icon: Grid, match: (p: string) => p.startsWith("/templates") },
  { href: "/builder", label: "Live demo", Icon: Sliders, match: (p: string) => p.startsWith("/builder") || p.startsWith("/services") },
  { href: "/order", label: "Анкет", Icon: Form, match: (p: string) => p.startsWith("/order") },
];

/**
 * Bottom navigation for phones and small tablets (<900px), as in the mobile
 * design. Hidden on pages with their own sticky action bar (template detail).
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const hidden = /^\/templates\/[^/]+/.test(pathname);

  useEffect(() => {
    document.body.classList.toggle("has-tabbar", !hidden);
    return () => document.body.classList.remove("has-tabbar");
  }, [hidden]);

  if (hidden) return null;
  return (
    <nav
      aria-label="Доод цэс"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-[rgba(255,255,255,0.96)] px-2 pt-1.5 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur-[12px] min-[900px]:hidden"
    >
      {TABS.map(({ href, label, Icon, match }) => {
        const on = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`ax-btn flex min-h-[54px] flex-col items-center justify-center gap-[3px] text-[11px] no-underline ${on ? "font-extrabold text-ink" : "font-bold text-muted"}`}
          >
            <span className={`inline-flex h-7 w-[52px] items-center justify-center rounded-[14px] ${on ? "bg-lime" : ""}`}>
              <Icon size={20} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
