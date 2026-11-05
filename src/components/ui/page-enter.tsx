"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";

/** Server-rendered children remain readable before hydration. */
export function PageEnter({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return <m.div initial={false} animate={{ opacity: reduced ? 1 : [0.96, 1] }} transition={{ duration: 0.22 }}>{children}</m.div>;
}
