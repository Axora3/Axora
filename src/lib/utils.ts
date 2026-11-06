import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teaches tailwind-merge the AXORA scales. Without this, `text-caption` reads as a
// text colour and would wrongly cancel `text-ink`.
const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["2xs", "caption", "body"],
      radius: ["inner", "control", "popover", "card", "panel"],
      shadow: ["xs", "card", "raised", "popover"],
    },
  },
});

/** Joins class names; a later Tailwind utility replaces an earlier conflicting one. */
export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
