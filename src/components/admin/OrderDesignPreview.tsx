"use client";

import { useState } from "react";
import { DemoPreview } from "@/components/builder/DemoPreview";
import type { BuilderConfig } from "@/lib/builder/config";

/** The public builder preview, re-rendered from the order's saved snapshot. */
export function OrderDesignPreview({ config }: { config: BuilderConfig }) {
  const [w, setW] = useState<"100%" | "768px" | "390px">("100%");
  return (
    <section aria-label="Сэргээсэн demo preview" className="flex flex-col gap-2">
      <div role="group" aria-label="Төхөөрөмж" className="flex flex-wrap gap-1 self-start rounded-xl bg-soft-3 p-1">
        {(
          [
            ["100%", "Desktop"],
            ["768px", "Tablet"],
            ["390px", "Mobile"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} type="button" aria-pressed={w === v} onClick={() => setW(v)} className={`min-h-11 rounded-[9px] border-0 px-3.5 text-sm font-bold ${w === v ? "bg-surface" : "bg-transparent text-muted"}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-[18px] border border-line bg-soft p-3">
        <div className="ax-light mx-auto overflow-hidden rounded-xl border border-line-mid bg-white" style={{ width: w, maxWidth: w === "100%" ? "100%" : undefined }}>
          <DemoPreview config={config} logo={null} animKey={0} />
        </div>
      </div>
      <p className="text-[13px] text-muted">Лого хэрэглэгчийн төхөөрөмж дээр л харагдсан тул энд сэргээгдэхгүй.</p>
    </section>
  );
}
