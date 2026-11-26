"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { AxoraGlass } from "./AxoraGlass";
/** One moving lens per group; geometry settles after selection/resize transitions. */
export function GlassActiveIndicator({
  selection,
  selector = '[aria-current="page"], .ax-header-more-active',
}: {
  selection: string;
  selector?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null),
    reduced = useReducedMotion();
  const [box, setBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  useLayoutEffect(() => {
    const root = ref.current?.parentElement;
    if (!root) return;
    const measure = () => {
      const target = root.querySelector<HTMLElement>(selector);
      if (!target || !target.getClientRects().length) {
        setBox(null);
        return;
      }
      const a = root.getBoundingClientRect(),
        b = target.getBoundingClientRect();
      setBox({
        x: b.x - a.x - root.clientLeft + root.scrollLeft,
        y: b.y - a.y - root.clientTop + root.scrollTop,
        width: b.width,
        height: b.height,
      });
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    const selectionObserver = new MutationObserver(measure);
    selectionObserver.observe(root, {
      subtree: true,
      attributes: true,
      attributeFilter: [
        "aria-selected",
        "data-state",
        "aria-pressed",
        "aria-current",
      ],
    });
    observer?.observe(root);
    for (const e of root.children) if (e !== ref.current) observer?.observe(e);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      selectionObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [selection, selector]);
  return (
    <span ref={ref} aria-hidden="true" className="ax-indicator-anchor">
      {box && (
        <m.span
          className="ax-active-lens"
          initial={false}
          animate={box}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", duration: 0.3, bounce: 0 }
          }
        >
          <AxoraGlass preset="lens" />
        </m.span>
      )}
    </span>
  );
}
