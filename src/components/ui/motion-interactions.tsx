"use client";

import type { ComponentProps, ReactNode } from "react";
import { m } from "motion/react";
import { interactions, transitions } from "@/lib/motion";

/**
 * Motion wrappers. Plain buttons and cards already animate through CSS (.ax-button,
 * .ax-card), so use these only on surfaces that have no recipe of their own.
 * MotionConfig in motion-provider.tsx removes the transforms for reduced motion.
 */

/** Scroll entrance. Adapted from Motion Primitives InView (MIT); content stays visible without JavaScript. */
export function InView({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <m.div className={className} initial={false} whileInView={{ opacity: [0.6, 1], y: [12, 0] }} viewport={{ once: true, amount: 0.12 }} transition={{ ...transitions.enter, delay }}>
      {children}
    </m.div>
  );
}

/** Lifts on hover and presses on tap, for clickable surfaces. */
export function HoverLift({ className, children, ...props }: ComponentProps<typeof m.div>) {
  return (
    <m.div className={className} whileHover={interactions.hoverLift} whileTap={interactions.press} transition={transitions.fast} {...props}>
      {children}
    </m.div>
  );
}

/** Press feedback for a small control that is not an .ax-button. */
export function Pressable({ className, children, type = "button", ...props }: ComponentProps<typeof m.button>) {
  return (
    <m.button type={type} className={className} whileTap={interactions.press} transition={transitions.fast} {...props}>
      {children}
    </m.button>
  );
}
