import type { ComponentProps } from "react";

// Adapted from shadcn/ui Card (MIT). See THIRD_PARTY_NOTICES.md.
// Native markup keeps this composition usable in Server Components.
export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div data-slot="card" className={`ax-surface min-w-0 ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={`flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4 ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={`p-5 ${className}`} {...props} />;
}
