"use client";

import { useState } from "react";
import { Plus } from "@/components/icons";
import { FAQ } from "@/lib/site";

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="ax-reveal flex flex-col border-t border-line">
      {FAQ.map((f, i) => {
        const on = open === i;
        return (
          <div key={f.q} className="border-b border-line">
            <h3>
              <button
                type="button"
                id={`faq-b-${i}`}
                aria-expanded={on}
                aria-controls={`faq-p-${i}`}
                onClick={() => setOpen(on ? -1 : i)}
                className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent py-[18px] text-left text-lg font-bold text-ink"
              >
                {f.q}
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-line transition-transform duration-[250ms]"
                  style={{ background: on ? "var(--ax-lime)" : "#fff", transform: on ? "rotate(45deg)" : "none" }}
                >
                  <Plus size={16} strokeWidth={2.2} />
                </span>
              </button>
            </h3>
            <div
              id={`faq-p-${i}`}
              role="region"
              aria-labelledby={`faq-b-${i}`}
              hidden={!on}
              className="ax-in-sm pr-[52px] pb-[22px] text-base leading-[1.65] text-muted"
            >
              {f.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
