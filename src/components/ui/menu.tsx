"use client";

import { m, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type Place = { top?: number; bottom?: number; left?: number; right?: number };

/**
 * Dropdown menu following the shadcn/ui DropdownMenu behaviour without Radix:
 * arrow keys, Home/End, Escape returns focus, outside press or scroll closes.
 * It is placed with fixed coordinates, so table scroll containers cannot clip it.
 * Children are real links and buttons with the `ax-menu-item` class.
 */
export function Menu({ label, trigger, triggerClassName = "", children }: { label: string; trigger: ReactNode; triggerClassName?: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const [place, setPlace] = useState<Place | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const open = place !== null;

  function toggle() {
    if (open || !button.current) return setPlace(null);
    const box = button.current.getBoundingClientRect();
    const up = window.innerHeight - box.bottom < 240;
    const fromRight = box.right > 260;
    setPlace({
      ...(up ? { bottom: window.innerHeight - box.top + 6 } : { top: box.bottom + 6 }),
      ...(fromRight ? { right: document.documentElement.clientWidth - box.right } : { left: box.left }),
    });
  }

  useEffect(() => {
    if (!open) return;
    const items = () => Array.from(menu.current?.querySelectorAll<HTMLElement>(".ax-menu-item") ?? []);
    items()[0]?.focus();
    const close = () => setPlace(null);
    const onDown = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        button.current?.focus();
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const list = items();
        const i = list.indexOf(document.activeElement as HTMLElement);
        const n = e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length;
        list[n]?.focus();
      } else if (e.key === "Tab") close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button ref={button} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle} className={triggerClassName}>
        {trigger}
      </button>
      {open && (
        <m.div
          ref={menu}
          id={id}
          role="menu"
          aria-label={label}
          initial={reduced ? false : { opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
          onClick={() => setPlace(null)}
          className="ax-menu"
          style={place}
        >
          {children}
        </m.div>
      )}
    </>
  );
}
