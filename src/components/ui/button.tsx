import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "lime" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";
const variants: Record<Variant, string> = {
  primary: "ax-button-primary",
  secondary: "",
  lime: "ax-button-lime",
  quiet: "ax-button-quiet",
  danger: "ax-button-danger",
};
const sizes: Record<Size, string> = { sm: "ax-button-sm", md: "", lg: "ax-button-lg" };

/** Shared class recipe also supports Next Link and existing form controls. */
export function buttonStyles(variant: Variant = "secondary", className = "", size: Size = "md") {
  return `ax-button ${variants[variant]} ${sizes[size]} ${className}`;
}

export function Button({ variant = "secondary", size = "md", className = "", type = "button", ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} data-slot="button" className={buttonStyles(variant, className, size)} {...props} />;
}
