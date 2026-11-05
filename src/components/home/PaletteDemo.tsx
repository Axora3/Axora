"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { useBuilder } from "@/components/builder/BuilderProvider";
import { PALETTES, luminance, mix } from "@/lib/builder/config";

/**
 * Home-page palette teaser. It writes to the shared builder state, so the
 * colour picked here is already selected when the visitor opens /builder.
 */
export function PaletteDemo() {
  const { config, setPalette } = useBuilder();
  const cur = PALETTES.find((p) => p.id === config.palette);
  const { primary, bg, secondary } = config.colors;
  const dark = luminance(bg) < 0.2;
  const text = dark ? "#EEF0F6" : mix(primary, "#111614", 0.82);
  const vars = {
    "--d-bg": bg,
    "--d-text": text,
    "--d-muted": mix(text, bg, 0.32),
    "--d-p": primary,
    "--d-on": luminance(primary) > 0.35 ? "#17251E" : "#FFFFFF",
    "--d-s": secondary,
    "--d-line": mix(text, bg, 0.84),
  } as React.CSSProperties;

  return (
    <div aria-labelledby="demo-title" role="group" className="flex h-full flex-col gap-5 rounded-card border border-line bg-surface p-[clamp(18px,2.4vw,28px)]">
      <div className="flex flex-col gap-2">
        <span className="ax-eyebrow">Live demo</span>
        <h3 id="demo-title" className="ax-h3">
          Өнгөө сонго — вэб <span className="serif">шууд</span> өөрчлөгдөнө.
        </h3>
      </div>
      <div role="group" aria-label="Өнгөний palette" className="flex flex-wrap gap-2">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={config.palette === p.id}
            onClick={() => setPalette(p.id)}
            className="ax-btn ax-option min-h-11 items-center gap-2 rounded-full px-3 text-[13px] font-bold"
          >
            <span aria-hidden="true" className="flex shrink-0">
              <span className="h-4 w-4 rounded-full border border-line-strong" style={{ background: p.primary }} />
              <span className="-ml-1.5 h-4 w-4 rounded-full border border-line-strong" style={{ background: p.secondary }} />
            </span>
            {p.label}
          </button>
        ))}
      </div>

      <div className="ax-light flex flex-1 flex-col overflow-hidden rounded-2xl border border-line" style={vars} aria-live="polite">
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line bg-soft-2 px-3.5">
          <span className="h-2 w-2 rounded-full bg-[#E1A28F]" />
          <span className="h-2 w-2 rounded-full bg-[#E8CF84]" />
          <span className="h-2 w-2 rounded-full bg-[#9CC59B]" />
          <span className="ml-2 truncate text-xs text-muted">Жишээ веб — {cur?.label ?? "Өөрийн өнгө"}</span>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-[clamp(16px,2vw,24px)] transition-colors duration-300" style={{ background: "var(--d-bg)", color: "var(--d-text)" }}>
          <span className="flex items-center gap-2 text-[13px] font-extrabold">
            <span className="h-[22px] w-[22px] rounded-[7px]" style={{ background: "var(--d-p)" }} />
            Нарс студи
          </span>
          <span className="text-[clamp(22px,2.4vw,32px)] leading-[1.1] font-extrabold tracking-[-0.02em]">Таны бизнес, таны өнгө.</span>
          <span className="max-w-[32em] text-sm leading-[1.55]" style={{ color: "var(--d-muted)" }}>
            Үйлчилгээгээ танилцуулж, захиалгаа онлайнаар аваарай.
          </span>
          <span className="flex flex-wrap gap-2.5">
            <span className="rounded-[9px] px-4 py-[11px] text-[13px] font-bold" style={{ background: "var(--d-p)", color: "var(--d-on)" }}>Цаг авах</span>
            <span className="rounded-[9px] border-[1.5px] px-4 py-2.5 text-[13px] font-bold" style={{ borderColor: "var(--d-p)", color: "var(--d-p)" }}>Үйлчилгээ үзэх</span>
          </span>
          <div className="mt-auto grid grid-cols-3 gap-2.5 pt-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col gap-1.5 rounded-xl p-2.5" style={n === 1 ? { background: "var(--d-s)" } : { border: "1px solid var(--d-line)" }}>
                <span className="aspect-[1.6] w-full rounded-lg" style={{ background: n === 1 ? "var(--d-p)" : "var(--d-s)", opacity: n === 1 ? 0.85 : 1 }} />
                <span className="truncate text-xs font-bold">Үйлчилгээ {n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link href="/builder" className="ax-link inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-bold text-brand no-underline">
        Бүрэн туршиж үзэх
        <span className="ax-arrow"><ArrowRight size={16} /></span>
      </Link>
    </div>
  );
}
