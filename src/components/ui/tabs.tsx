"use client";

import { type ComponentProps } from "react";
import { GlassActiveIndicator } from "@/components/glass/GlassActiveIndicator";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

// Adapted from shadcn/ui Tabs (MIT). See THIRD_PARTY_NOTICES.md.
// Use Tabs when each option swaps a panel; use Segmented for a filter or view toggle.
export const Tabs = TabsPrimitive.Root;

/** The sliding pill measures its target, because layoutId would need Motion's larger domMax bundle. */
export function TabsList({
  className,
  children,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("ax-segment ax-optical-nav", className)}
      {...props}
    >
      <GlassActiveIndicator
        selection="tabs"
        selector='[role="tab"][data-state="active"]'
      />
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn("ax-segment-item", className)}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "ax-in-sm mt-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        className,
      )}
      {...props}
    />
  );
}
