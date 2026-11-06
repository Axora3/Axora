"use client";

import Image from "next/image";
import { AnimatePresence, m } from "motion/react";
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { PreviewImage, PreviewStyle, TemplateCategory } from "@/lib/templates/types";
import { TemplatePreview } from "./TemplatePreview";

const DRAWN = [
  { label: "Ерөнхий", long: "Ерөнхий харагдац", transform: "none", origin: "center" },
  { label: "Дээд хэсэг", long: "Ойроос — дээд хэсэг", transform: "scale(1.7)", origin: "30% 25%" },
  { label: "Доод хэсэг", long: "Ойроос — доод хэсэг", transform: "scale(1.7)", origin: "70% 80%" },
];

const arrow = "ax-btn absolute top-1/2 z-[1] hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-tabbar text-ink shadow-card backdrop-blur disabled:cursor-not-allowed disabled:opacity-40 nav:inline-flex";

/**
 * Product gallery. Real uploaded images when available; otherwise the drawn
 * mock-up with three zoomed views. Arrows and thumbnails on desktop, swipe and
 * dots on phones, arrow keys everywhere.
 */
export function Gallery({ category, style, images, title }: { category: TemplateCategory; style: PreviewStyle; images: PreviewImage[]; title: string }) {
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);
  const slides = images.length
    ? images.map((img, n) => ({ label: `Зураг ${n + 1}`, long: img.alt || `${title} — зураг ${n + 1}`, img }))
    : DRAWN.map((d) => ({ ...d, img: null as PreviewImage | null }));
  const count = slides.length;
  const go = (n: number) => setI(Math.max(0, Math.min(count - 1, n)));
  const cur = slides[i];

  return (
    <section
      aria-label="Зургийн цомог"
      className="flex flex-col gap-3"
      tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        go(i + (event.key === "ArrowRight" ? 1 : -1));
      }}
    >
      <div
        className="ax-light relative aspect-[4/3] overflow-hidden rounded-card border border-line sm:aspect-[16/10]"
        style={{ background: style.tint }}
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        }}
      >
        <AnimatePresence initial={false}>
          <m.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transitions.enter}>
            {cur.img ? (
              <Image src={cur.img.url} alt={cur.img.alt} fill sizes="(max-width: 999px) 100vw, 780px" className="object-cover" priority={i === 0} />
            ) : (
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center p-7"
                style={{ transform: (cur as (typeof DRAWN)[number]).transform, transformOrigin: (cur as (typeof DRAWN)[number]).origin }}
              >
                <TemplatePreview category={category} s={style} size="lg" />
              </div>
            )}
          </m.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <button type="button" aria-label="Өмнөх зураг" disabled={i === 0} onClick={() => go(i - 1)} className={cn(arrow, "left-3")}>
              <Icon name="chevron-left" size={20} />
            </button>
            <button type="button" aria-label="Дараах зураг" disabled={i === count - 1} onClick={() => go(i + 1)} className={cn(arrow, "right-3")}>
              <Icon name="chevron-right" size={20} />
            </button>
          </>
        )}

        <span aria-live="polite" className="absolute bottom-3 left-3 z-[1] max-w-[calc(100%-24px)] truncate rounded-inner bg-tabbar px-[9px] py-[5px] text-xs font-bold text-ink">
          {count > 1 && <>{i + 1} / {count} · </>}
          {cur.long}
        </span>
      </div>

      {count > 1 && (
        <>
          <div role="group" aria-label="Зураг сонгох" className="hidden gap-2.5 nav:flex">
            {slides.map((s, n) => (
              <button
                key={n}
                type="button"
                aria-pressed={i === n}
                aria-label={s.long}
                onClick={() => go(n)}
                className={cn("ax-btn ax-option relative min-h-16 flex-1 cursor-pointer items-center justify-center overflow-hidden p-2 text-[13px] font-bold", s.img && "aspect-[16/10] max-w-[160px] p-0")}
              >
                {s.img ? <Image src={s.img.url} alt="" fill sizes="160px" className="object-cover" /> : s.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Слайд сонгох" className="-mt-1.5 flex justify-center gap-0.5 nav:hidden">
            {slides.map((s, n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n + 1}-р слайд: ${s.label}`}
                aria-pressed={i === n}
                onClick={() => go(n)}
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent"
              >
                <span className="h-1.5 rounded-md transition-[width,background-color] duration-[250ms]" style={{ width: i === n ? 22 : 6, background: i === n ? "var(--ax-brand)" : "var(--ax-line-mid)" }} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
