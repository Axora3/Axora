"use client";

import { m, useReducedMotion } from "motion/react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AxoraGlass } from "@/components/glass/AxoraGlass";

type Place = { top: number; left: number; width: number; maxHeight: number };

/**
 * Dropdown menu following the shadcn/ui DropdownMenu behaviour without Radix:
 * arrow keys, Home/End, Escape returns focus, outside press or scroll closes.
 * It is placed with fixed coordinates, so table scroll containers cannot clip it.
 * Children are real links and buttons with the `ax-menu-item` class.
 */
export function Menu({
  label,
  trigger,
  triggerClassName = "",
  children,
}: {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [place, setPlace] = useState<Place | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const open = place !== null;

  function toggle() {
    if (open || !button.current) return setPlace(null);
    const box = button.current.getBoundingClientRect();
    const width = Math.min(236, document.documentElement.clientWidth - 24);
    setPlace({
      top: box.bottom + 10,
      left: Math.max(
        12,
        Math.min(
          box.right - width,
          document.documentElement.clientWidth - width - 12,
        ),
      ),
      width,
      maxHeight: Math.max(80, window.innerHeight - 24),
    });
  }

  useLayoutEffect(() => {
    if (!open || !menu.current || !button.current) return;
    const box = button.current.getBoundingClientRect(),
      height = menu.current.getBoundingClientRect().height;
    const below = window.innerHeight - box.bottom - 22,
      above = box.top - 22;
    const flip = height > below && above > below;
    menu.current.style.maxHeight = `${Math.max(80, flip ? above : below)}px`;
    menu.current.style.top = `${Math.max(12, flip ? box.top - Math.min(height, above) - 10 : box.bottom + 10)}px`;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const items = () =>
      Array.from(
        menu.current?.querySelectorAll<HTMLElement>(".ax-menu-item") ?? [],
      );
    items()[0]?.focus();
    const close = () => setPlace(null);
    const onScroll = (event: Event) => {
      if (
        !(event.target instanceof Node) ||
        !menu.current?.contains(event.target)
      )
        close();
    };
    const onDown = (e: PointerEvent) => {
      if (
        !menu.current?.contains(e.target as Node) &&
        !button.current?.contains(e.target as Node)
      )
        close();
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
        const n =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? list.length - 1
              : (i + (e.key === "ArrowDown" ? 1 : -1) + list.length) %
                list.length;
        list[n]?.focus();
      } else if (e.key === "Tab") close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={toggle}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <m.div
            ref={menu}
            id={id}
            role="menu"
            aria-label={label}
            initial={reduced ? false : { opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            onClick={() => setPlace(null)}
            className="ax-menu ax-optical-host"
            style={place}
          >
            <AxoraGlass preset="panel" />
            {children}
          </m.div>,
          document.body,
        )}
    </>
  );
}
