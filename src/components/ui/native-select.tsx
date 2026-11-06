import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * The default select: server-safe, works before hydration, and gives phones their
 * own picker. Reach for the Radix Select (select.tsx) only when an option needs
 * rich content. The chevron comes from select.ax-control in globals.css.
 */
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return <select data-slot="native-select" className={cn("ax-control px-3 text-base", className)} {...props} />;
}
