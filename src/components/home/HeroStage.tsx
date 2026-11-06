"use client";

import type { PointerEvent, ReactNode } from "react";
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

const SPRING = { stiffness: 120, damping: 20, mass: 0.6 };

/**
 * Tilts the product stage a little toward the pointer. Motion values update
 * without re-rendering React. Touch and reduced motion get a still stage.
 */
export function HeroStage({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-3, 3]), SPRING);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [2.4, -2.4]), SPRING);

  function track(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - box.left) / box.width - 0.5);
    y.set((event.clientY - box.top) / box.height - 0.5);
  }

  return (
    <m.div
      role="img"
      aria-label="Бүтээгдэхүүний жишээ: кофе шопын веб, Excel төсөв, Notion самбар"
      className="ax-stage ax-light"
      style={{ rotateX, rotateY, transformPerspective: 1500 }}
      onPointerMove={track}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </m.div>
  );
}
