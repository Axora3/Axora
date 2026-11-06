"use client";

import type { ComponentProps, ReactNode } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

// Adapted from shadcn/ui Tooltip (MIT). See THIRD_PARTY_NOTICES.md.
// Touch screens have no hover, so a tooltip may add detail but never hold the only copy of it.
export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn("ax-popover z-(--ax-z-tooltip) max-w-[260px] rounded-inner bg-band px-2.5 py-1.5 text-caption font-semibold text-on-band shadow-popover", className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

/** One-line use: <Tooltip label="Хуулах"><button …/></Tooltip>. The child must accept a ref and focus. */
export function Tooltip({ label, children, side, delayDuration = 200 }: { label: ReactNode; children: ReactNode; side?: ComponentProps<typeof TooltipPrimitive.Content>["side"]; delayDuration?: number }) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{label}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}
