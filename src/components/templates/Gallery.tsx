"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { PreviewImage, PreviewStyle, TemplateCategory } from "@/lib/templates/types";
import { TemplatePreview } from "./TemplatePreview";

const DRAWN = [
  { label: "Ерөнхий", long: "Ерөнхий харагдац", transform: "none", origin: "center" },
  { label: "Дээд хэсэг", long: "Ойроос — дээд хэсэг", transform: "scale(1.7)", origin: "30% 25%" },
  { label: "Доод хэсэг", long: "Ойроос — доод хэсэг", transform: "scale(1.7)", origin: "70% 80%" },
];

/**
 * Product gallery. Real uploaded images when available; otherwise the drawn
 * mock-up with three zoomed views. Buttons on desktop, swipe + dots on phones.
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
    <section aria-label="Зургийн цомог" className="flex flex-col gap-3">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-[18px] max-[899px]:aspect-auto max-[899px]:h-[290px] max-[899px]:rounded-[22px]"
        style={{ background: style.tint }}
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        }}
      >
        {cur.img ? (
          <Image src={cur.img.url} alt={cur.img.alt} fill sizes="(max-width: 900px) 100vw, 560px" className="object-cover" priority={i === 0} />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center p-7 transition-transform duration-[450ms] [transition-timing-function:cubic-bezier(.2,.7,.2,1)]"
            style={{ transform: (cur as (typeof DRAWN)[number]).transform, transformOrigin: (cur as (typeof DRAWN)[number]).origin }}
          >
            <TemplatePreview category={category} s={style} size="lg" />
          </div>
        )}
        <span aria-live="polite" className="absolute bottom-3 left-3 rounded-[7px] bg-tabbar px-[9px] py-[5px] text-xs font-bold text-ink max-[899px]:top-3 max-[899px]:bottom-auto">
          <span className="min-[900px]:hidden">
            {i + 1} / {count} ·{" "}
          </span>
          {cur.long}
        </span>
      </div>

      {count > 1 && (
        <>
          <div role="group" aria-label="Зураг сонгох" className="hidden grid-cols-3 gap-2.5 min-[900px]:grid">
            {slides.map((s, n) => (
              <button
                key={n}
                type="button"
                aria-pressed={i === n}
                onClick={() => go(n)}
                className="ax-btn min-h-14 rounded-xl p-2 text-[13px] font-bold text-ink"
                style={{ background: style.tint, border: i === n ? "2px solid var(--ax-brand)" : "1px solid var(--ax-line)" }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Слайд сонгох" className="-mt-1.5 flex justify-center gap-0.5 min-[900px]:hidden">
            {slides.map((s, n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n + 1}-р слайд: ${s.label}`}
                aria-pressed={i === n}
                onClick={() => go(n)}
                className="inline-flex h-8 w-11 cursor-pointer items-center justify-center border-0 bg-transparent"
              >
                <span
                  className="h-1.5 rounded-md transition-[width,background-color] duration-[250ms]"
                  style={{ width: i === n ? 22 : 6, background: i === n ? "var(--ax-brand)" : "var(--ax-line-mid)" }}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
