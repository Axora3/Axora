"use client";

import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { createPortal } from "react-dom";
import { Close, LogoMark } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { buttonStyles } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { useDialog } from "@/components/ui/use-dialog";
import { overlayVariants, transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string; icon: IconName };

/**
 * Slide-in navigation drawer. Mount it on first open, because it portals to
 * document.body, which does not exist during server rendering.
 */
export function MobileNav({ open, onClose, links, more, current }: { open: boolean; onClose: () => void; links: NavLink[]; more: NavLink[]; current?: string }) {
  const ref = useDialog<HTMLDivElement>(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="nav" className="fixed inset-0 z-(--ax-z-drawer)">
          <m.div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-overlay" variants={overlayVariants} initial="hidden" animate="visible" exit="exit" />
          <m.div
            ref={ref}
            id="ax-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Цэс"
            initial={{ x: "100%" }}
            animate={{ x: 0, transition: transitions.enter }}
            exit={{ x: "100%", transition: transitions.exit }}
            className="absolute inset-y-0 right-0 isolate flex w-[min(420px,100%)] flex-col overflow-y-auto overscroll-contain bg-band p-4 pb-[calc(16px+env(safe-area-inset-bottom))] text-on-band shadow-raised"
          >
            <div aria-hidden="true" className="ax-aurora opacity-50" />
            <div className="flex min-h-14 items-center justify-between gap-2">
              <Link href="/" onClick={onClose} aria-label="AXORA нүүр" className="flex min-h-11 items-center gap-2.5 text-on-band no-underline">
                <LogoMark />
                <span className="text-[18px] font-extrabold tracking-[0.08em]">AXORA</span>
              </Link>
              <span className="flex items-center gap-2">
                <ThemeToggle tone="band" />
                <button type="button" aria-label="Цэс хаах" data-autofocus onClick={onClose} className="ax-btn inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-control border border-band-ring bg-transparent text-on-band">
                  <Close size={20} />
                </button>
              </span>
            </div>

            <nav aria-label="Гар утасны цэс" className="mt-5 flex flex-col gap-1">
              {links.map((n, index) => {
                const on = n.href === current;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={onClose}
                    aria-current={on ? "page" : undefined}
                    style={{ animationDelay: `${index * 35}ms` }}
                    className={cn("ax-in-sm flex min-h-14 items-center gap-3.5 rounded-control px-3 text-[20px] font-extrabold tracking-[-0.015em] no-underline transition-colors", on ? "bg-lime text-on-lime" : "text-on-band hover:bg-band-hover")}
                  >
                    <Icon name={n.icon} size={20} className={on ? undefined : "text-lime"} />
                    {n.label}
                  </Link>
                );
              })}
            </nav>

            <nav aria-label="Бусад хуудас" className="mt-5 border-t border-band-line pt-4">
              <div className="grid grid-cols-2 gap-1">
                {more.map((n) => (
                  <Link key={n.href} href={n.href} onClick={onClose} aria-current={n.href === current ? "page" : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-[14px] font-bold text-band-muted no-underline transition-colors hover:bg-band-hover hover:text-on-band aria-[current=page]:text-lime">
                    <Icon name={n.icon} size={16} />
                    {n.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="mt-auto flex shrink-0 flex-col gap-2 pt-6">
              <Link href="/builder" onClick={onClose} className={buttonStyles("lime", "w-full", "lg")}>
                Вебсайт бүтээх
              </Link>
              <Link href="/order" onClick={onClose} className="ax-button border-band-ring bg-transparent text-on-band hover:bg-band-hover">
                Үнийн санал авах
              </Link>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
