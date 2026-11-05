import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger";
const variants: Record<Variant, string> = {
  primary: "ax-button-primary",
  secondary: "",
  quiet: "ax-button-quiet",
  danger: "ax-button-danger",
};

/** Shared class recipe also supports Next Link and existing form controls. */
export function buttonStyles(variant: Variant = "secondary", className = "") {
  return `ax-button ${variants[variant]} ${className}`;
}

export function Button({ variant = "secondary", className = "", type = "button", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type={type} data-slot="button" className={buttonStyles(variant, className)} {...props} />;
}
