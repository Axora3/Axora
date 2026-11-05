"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";

// Adapted from Motion Primitives AnimatedGroup (MIT, ibelick).
// https://github.com/ibelick/motion-primitives/blob/main/components/core/animated-group.tsx
// AXORA keeps SSR content visible and removes movement with reduced motion.
export function AnimatedGroup({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <div className={className}>
      {Children.toArray(children).map((child, index) => (
        <m.div
          key={isValidElement(child) ? child.key ?? index : index}
          className="min-w-0 [&>*]:h-full"
          initial={false}
          whileInView={reduced ? undefined : { y: [8, 0] }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.35, delay: Math.min(index, 5) * 0.045, ease: "easeOut" }}
        >
          {child}
        </m.div>
      ))}
    </div>
  );
}
