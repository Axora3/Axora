"use client";

import type { ComponentProps } from "react";
import { Check } from "lucide-react";
import { DropdownMenu as DropdownPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

// Adapted from shadcn/ui DropdownMenu (MIT). See THIRD_PARTY_NOTICES.md.
export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;
export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;

export function DropdownMenuContent({ className, sideOffset = 6, align = "end", ...props }: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        collisionPadding={8}
        className={cn("ax-popover z-(--ax-z-popover) min-w-[220px] rounded-popover border border-line bg-popover p-1.5 text-popover-foreground shadow-popover", className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, variant, ...props }: ComponentProps<typeof DropdownPrimitive.Item> & { variant?: "danger" }) {
  return <DropdownPrimitive.Item data-slot="dropdown-menu-item" data-variant={variant} className={cn("ax-popover-item", className)} {...props} />;
}

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof DropdownPrimitive.RadioItem>) {
  return (
    <DropdownPrimitive.RadioItem data-slot="dropdown-menu-radio-item" className={cn("ax-popover-item justify-between", className)} {...props}>
      {children}
      <DropdownPrimitive.ItemIndicator>
        <Check aria-hidden="true" size={16} />
      </DropdownPrimitive.ItemIndicator>
    </DropdownPrimitive.RadioItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Label>) {
  return <DropdownPrimitive.Label data-slot="dropdown-menu-label" className={cn("px-2.5 py-1.5 text-xs font-bold text-muted", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Separator>) {
  return <DropdownPrimitive.Separator data-slot="dropdown-menu-separator" className={cn("my-1.5 h-px bg-line-soft", className)} {...props} />;
}
