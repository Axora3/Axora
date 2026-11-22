"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import { Close, LogoMark } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { type IconName } from "@/components/ui/icon";
import { useDialog } from "@/components/ui/use-dialog";

export type NavLink = { href: string; label: string; icon: IconName };

/** A self-contained spatial surface; only its content scrolls, never the page. */
export function MobileNav({ open, onClose, links, more, current }: { open: boolean; onClose: () => void; links: NavLink[]; more: NavLink[]; current?: string }) {
  const ref = useDialog<HTMLDivElement>(open, onClose);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const root = document.querySelector<HTMLElement>(".ax-public");
    const header = document.querySelector<HTMLElement>(".ax-site-header");
    const dock = document.querySelector<HTMLElement>(".ax-mobile-dock");
    const opener = header?.querySelector<HTMLButtonElement>(".ax-header-menu-toggle");
    const nodes = [root, header, dock].filter((node): node is HTMLElement => Boolean(node));
    const previous = nodes.map((node) => node.inert);
    nodes.forEach((node) => { node.inert = true; });
    document.body.classList.add("ax-spatial-menu-open");
    return () => {
      nodes.forEach((node, index) => { node.inert = previous[index]; });
      document.body.classList.remove("ax-spatial-menu-open");
      opener?.focus();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          key="spatial-menu"
          className="ax-spatial-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.18 }}
        >
          <div ref={ref} id="ax-mobile-menu" role="dialog" aria-modal="true" aria-label="Цэс" className="ax-spatial-menu">
            <div className="ax-spatial-light" aria-hidden="true" />
            <header className="ax-spatial-header">
              <Link href="/" onClick={onClose} aria-label="AXORA нүүр" className="ax-spatial-brand"><LogoMark /><span>AXORA</span></Link>
              <div className="ax-spatial-controls">
                <ThemeToggle tone="band" />
                <button type="button" aria-label="Цэс хаах" data-autofocus onClick={onClose} className="ax-spatial-close"><Close size={20} /></button>
              </div>
            </header>
            <div className="ax-spatial-scroll">
              <nav aria-label="Гар утасны цэс" className="ax-spatial-tiles">
                {links.map((link, index) => (
                  <m.div key={link.href} className={`ax-spatial-tile ax-spatial-tile-${index}`}
                    initial={reduced ? false : { opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 210, damping: 26, delay: reduced ? 0 : index * 0.035 }}>
                    <Link href={link.href} onClick={onClose} aria-current={current === link.href ? "page" : undefined}>{link.label}</Link>
                  </m.div>
                ))}
              </nav>
              <nav aria-label="Бусад хуудас" className="ax-spatial-secondary">
                {more.map((link) => <Link key={link.href} href={link.href} onClick={onClose} aria-current={current === link.href ? "page" : undefined}>{link.label}</Link>)}
              </nav>
              <m.div className="ax-spatial-cta" initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : 0.2, duration: 0.2 }}>
                <Link href="/builder" onClick={onClose} className="ax-spatial-primary">Вебсайт бүтээх</Link>
                <Link href="/order" onClick={onClose} className="ax-spatial-order">Үнийн санал авах</Link>
              </m.div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
