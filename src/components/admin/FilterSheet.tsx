"use client";

import { useState } from "react";
import { Filter } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";

/**
 * The same filter form inline on desktop (≥768px) and in a bottom sheet on
 * phones. `children` is a plain GET form, so filtering works without JS.
 */
export function FilterSheet({ children, active = 0, title = "Шүүлтүүр" }: { children: React.ReactNode; active?: number; title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="max-md:hidden">{children}</div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="ax-btn inline-flex min-h-11 cursor-pointer items-center gap-2 self-start rounded-xl border border-line-strong bg-surface px-3.5 text-sm font-bold text-ink md:hidden"
      >
        <Filter size={17} />
        {title}
        {active > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-lime px-1.5 text-[11px] font-extrabold">{active}</span>}
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={title}>
        {/* Submitting navigates; the sheet closes with the new page. */}
        <div onSubmit={() => setOpen(false)}>{children}</div>
      </BottomSheet>
    </>
  );
}
