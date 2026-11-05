"use client";

import type { ComponentProps, PointerEvent } from "react";

/**
 * Pointer-following highlight for a group of `.ax-spot` cards. The idea follows
 * Motion Primitives' Spotlight (MIT, ibelick), rebuilt with one delegated
 * listener and CSS variables so moving the pointer never re-renders React.
 * The glow itself is CSS, and is removed for touch and reduced motion.
 */
export function SpotlightGroup({ onPointerMove, ...props }: ComponentProps<"div">) {
  function track(event: PointerEvent<HTMLDivElement>) {
    onPointerMove?.(event);
    if (event.pointerType !== "mouse") return;
    const card = (event.target as Element).closest<HTMLElement>(".ax-spot");
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty("--ax-x", `${event.clientX - box.left}px`);
    card.style.setProperty("--ax-y", `${event.clientY - box.top}px`);
  }
  return <div onPointerMove={track} {...props} />;
}
