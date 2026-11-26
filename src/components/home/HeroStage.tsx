"use client";
import type { ReactNode } from "react";

/** The foreground is still, so small product text remains readable. */
export function HeroStage({ children }: { children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label="Бүтээгдэхүүний жишээ: кофе шопын веб, Excel төсөв, Notion самбар"
      className="ax-stage ax-light fg-product-stage"
    >
      {children}
    </div>
  );
}
