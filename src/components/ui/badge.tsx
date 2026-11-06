import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Follows the shadcn/ui Badge recipe (MIT). See THIRD_PARTY_NOTICES.md.
const badge = cva("ax-badge", {
  variants: {
    tone: {
      brand: "",
      solid: "ax-badge-solid",
      lime: "ax-badge-lime",
      neutral: "bg-neutral-bg text-neutral",
      info: "bg-info-bg text-info",
      success: "bg-success-bg text-success",
      warn: "ax-badge-warn",
      danger: "bg-danger-bg text-danger-ink",
    },
  },
  defaultVariants: { tone: "brand" },
});

/** Status is always carried by the text or an icon as well, never by colour alone. */
export function Badge({ tone, className, ...props }: ComponentProps<"span"> & VariantProps<typeof badge>) {
  return <span data-slot="badge" className={cn(badge({ tone }), className)} {...props} />;
}
