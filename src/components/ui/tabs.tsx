"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { m } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Adapted from shadcn/ui Tabs (MIT). See THIRD_PARTY_NOTICES.md.
// Use Tabs when each option swaps a panel; use Segmented for a filter or view toggle.
export const Tabs = TabsPrimitive.Root;

/** The sliding pill measures its target, because layoutId would need Motion's larger domMax bundle. */
export function TabsList({ className, children, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  const root = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; width: number } | null>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      const active = element.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      if (active) setPill({ x: active.offsetLeft, width: active.offsetWidth });
    };
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    const selection = new MutationObserver(measure);
    selection.observe(element, { subtree: true, attributes: true, attributeFilter: ["data-state"] });
    return () => {
      resize.disconnect();
      selection.disconnect();
    };
  }, []);

  return (
    <TabsPrimitive.List ref={root} data-slot="tabs-list" data-ready={pill ? "" : undefined} className={cn("ax-segment", className)} {...props}>
      {pill && <m.span aria-hidden="true" className="ax-segment-pill" initial={false} animate={{ x: pill.x, width: pill.width }} transition={transitions.spring} />}
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger data-slot="tabs-trigger" className={cn("ax-segment-item", className)} {...props} />;
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("ax-in-sm mt-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus", className)} {...props} />;
}
