"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Check, Monitor, Moon, Sun } from "@/components/icons";
import type { ThemePref } from "./theme-script";
import { getThemePref, setThemePref, subscribeTheme } from "./theme-store";

const OPTIONS: { id: ThemePref; label: string; hint: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Цайвар", hint: "Үргэлж цайвар", Icon: Sun },
  { id: "dark", label: "Бараан", hint: "Үргэлж бараан", Icon: Moon },
  { id: "system", label: "Систем", hint: "Төхөөрөмжийн тохиргоог дагана", Icon: Monitor },
];

/** Keeps the OS/other-tab listeners alive on every page (mounted once in the root layout). */
export function ThemeSync() {
  useSyncExternalStore(subscribeTheme, getThemePref, () => "system");
  return null;
}

/**
 * Sun/moon button with a small menu for Light / Dark / System.
 * The icon is chosen by CSS from <html data-theme>, so server HTML and the
 * first client render are identical (no hydration mismatch, no flash).
 */
export function ThemeToggle({ tone = "default", className = "" }: { tone?: "default" | "band"; className?: string }) {
  // null on the server and during hydration; the real value right after.
  const pref = useSyncExternalStore<ThemePref | null>(subscribeTheme, getThemePref, () => null);
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const items = () => Array.from(menu.current?.querySelectorAll<HTMLButtonElement>("[role=menuitemradio]") ?? []);
    (items().find((el) => el.getAttribute("aria-checked") === "true") ?? items()[0])?.focus();
    const onDown = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        btn.current?.focus();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
        e.preventDefault();
        const list = items();
        const i = list.indexOf(document.activeElement as HTMLButtonElement);
        const n = e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length;
        list[n]?.focus();
      } else if (e.key === "Tab") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = OPTIONS.find((o) => o.id === pref);
  const label = `Өнгөний горим${current ? `: ${current.label}` : ""}`;
  const look =
    tone === "band"
      ? "border-band-ring bg-transparent text-on-band hover:bg-band-hover"
      : "border-line bg-surface text-ink hover:border-line-mid";

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={btn}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => setOpen((v) => !v)}
        className={`ax-theme-btn inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border ${look}`}
      >
        <span className="ax-theme-moon ax-theme-ic">
          <Moon size={19} />
        </span>
        <span className="ax-theme-sun ax-theme-ic">
          <Sun size={19} />
        </span>
      </button>
      {open && (
        <div
          ref={menu}
          id={`${id}-menu`}
          role="menu"
          aria-label="Өнгөний горим"
          className="absolute top-[calc(100%+6px)] right-0 z-[80] flex w-[232px] flex-col gap-0.5 rounded-2xl border border-line bg-elevated p-1.5 text-ink shadow-[0_24px_48px_-24px_var(--ax-shadow)] [animation:axUpSm_.18s_ease_both]"
        >
          {OPTIONS.map(({ id: o, label: l, hint, Icon }) => (
            <button
              key={o}
              type="button"
              role="menuitemradio"
              aria-checked={pref === o}
              onClick={() => {
                setThemePref(o);
                setOpen(false);
                btn.current?.focus();
              }}
              className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-[11px] border-0 px-3 text-left ${pref === o ? "bg-soft" : "bg-transparent hover:bg-soft-2"}`}
            >
              <Icon size={18} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-bold">{l}</span>
                <span className="text-xs text-muted">{hint}</span>
              </span>
              {pref === o && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
