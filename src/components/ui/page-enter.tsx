"use client";

import type { ReactNode } from "react";
import { m } from "motion/react";

/** Keep route content free of stacking contexts so foreground clouds and footer content can layer independently of global hands. */
export function PageEnter({ children }: { children: ReactNode }) {
  return (
    <m.div className="ax-route-content" initial={false}>
      {children}
    </m.div>
  );
}
