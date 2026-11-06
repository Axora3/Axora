import type { ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Follows the shadcn/ui Button recipe (MIT). See THIRD_PARTY_NOTICES.md.
// No `asChild`: put buttonStyles() on a Next Link, which keeps this a Server Component.
const button = cva("ax-button", {
  variants: {
    variant: {
      primary: "ax-button-primary",
      secondary: "",
      lime: "ax-button-lime",
      quiet: "ax-button-quiet",
      danger: "ax-button-danger",
      link: "ax-button-quiet underline underline-offset-4",
    },
    size: {
      sm: "ax-button-sm",
      md: "",
      lg: "ax-button-lg",
      icon: "w-11 px-0",
    },
  },
});

export type ButtonVariant = "primary" | "secondary" | "lime" | "quiet" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

/** Shared class recipe also supports Next Link and existing form controls. */
export function buttonStyles(variant: ButtonVariant = "secondary", className = "", size: ButtonSize = "md") {
  return cn(button({ variant, size }), className);
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className = "",
  type = "button",
  disabled,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize; /** Blocks repeat presses and shows a spinner beside the label. */ loading?: boolean }) {
  return (
    <button type={type} data-slot="button" disabled={disabled || loading} aria-busy={loading || undefined} className={buttonStyles(variant, className, size)} {...props}>
      {loading && <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
