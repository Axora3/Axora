import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Adapted from shadcn/ui Card (MIT). See THIRD_PARTY_NOTICES.md.
// Native markup keeps this composition usable in Server Components.
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card" className={cn("ax-surface min-w-0", className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("text-[17px] font-extrabold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("ax-caption", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex flex-wrap items-center gap-2.5 border-t border-line-soft px-5 py-4", className)} {...props} />;
}
