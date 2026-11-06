import type { Transition, Variants } from "motion/react";

/**
 * Motion presets. These mirror the CSS tokens (--ax-duration-*, --ax-ease), so
 * Motion and CSS animations feel like one system. Reduced motion is handled once
 * by MotionConfig in motion-provider.tsx: transforms drop out and fades remain.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const transitions = {
  fast: { duration: 0.16, ease: EASE_OUT },
  enter: { duration: 0.28, ease: EASE_OUT },
  exit: { duration: 0.16, ease: "easeIn" },
  spring: { type: "spring", duration: 0.32, bounce: 0.12 },
} satisfies Record<string, Transition>;

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.enter },
  exit: { opacity: 0, transition: transitions.exit },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: transitions.enter },
  exit: { opacity: 0, y: 8, scale: 0.985, transition: transitions.exit },
};

export const interactions = {
  hoverLift: { y: -3 },
  press: { scale: 0.98 },
} as const;
