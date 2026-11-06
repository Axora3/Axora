import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Placeholder block in the shape of what is coming. Decorative: mark the region around it aria-busy. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden="true" data-slot="skeleton" className={cn("ax-sk rounded-inner", className)} {...props} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" data-slot="skeleton-text" className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className={cn("ax-sk h-3.5 rounded", index === lines - 1 && lines > 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}
