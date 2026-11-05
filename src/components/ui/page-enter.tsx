"use client";

import type { ReactNode } from "react";
import { m } from "motion/react";

/**
 * Opacity only: a transform here would become the containing block for sticky
 * headers. Server-rendered children stay readable before hydration, and
 * MotionConfig removes the animation for reduced motion.
 */
export function PageEnter({ children }: { children: ReactNode }) {
  return (
    <m.div initial={false} animate={{ opacity: [0.92, 1] }} transition={{ duration: 0.24, ease: "easeOut" }}>
      {children}
    </m.div>
  );
}
