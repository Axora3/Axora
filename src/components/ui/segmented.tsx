"use client";

import { m } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Option<T extends string> = { value: T; label: ReactNode; ariaLabel?: string };

/**
 * Single-choice segmented control with a sliding pill.
 * Adapted from the shadcn/ui Tabs recipe (MIT) without Radix: these are filter
 * and view toggles, so plain pressed buttons are the correct semantics.
 * The pill measures its target rather than using layoutId, which would pull in
 * Motion's larger domMax feature bundle for this one effect. Before hydration
 * CSS styles the pressed item directly, so server HTML is never unmarked.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
  itemClassName = "",
}: {
  options: readonly Option<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  className?: string;
  itemClassName?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; width: number } | null>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // ResizeObserver fires once on observe, which also covers the first measure.
    const observer = new ResizeObserver(() => {
      const active = element.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (active) setPill({ x: active.offsetLeft, width: active.offsetWidth });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={root} role="group" aria-label={label} data-ready={pill ? "" : undefined} className={`ax-segment ${className}`}>
      {pill && <m.span aria-hidden="true" className="ax-segment-pill" initial={false} animate={{ x: pill.x, width: pill.width }} transition={{ type: "spring", duration: 0.32, bounce: 0.12 }} />}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          aria-label={option.ariaLabel}
          onClick={() => onChange(option.value)}
          className={`ax-segment-item ${itemClassName}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
