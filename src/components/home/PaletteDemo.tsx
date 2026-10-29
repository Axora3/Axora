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
  const primary = config.colors.primary;
  const bg = config.colors.bg;
  const secondary = config.colors.secondary;
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
    <section
      aria-labelledby="demo-title"
      className="mx-auto grid max-w-[1240px] items-center gap-[clamp(32px,5vw,72px)] px-[clamp(16px,4vw,40px)] py-14 [grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr))] min-[900px]:py-28"
    >
      <div className="ax-reveal flex flex-col gap-[22px]">
        <span className="text-[13px] font-extrabold tracking-[0.08em] text-brand uppercase">Live demo</span>
        <h2 id="demo-title" className="text-[clamp(28px,3.4vw,44px)] leading-[1.12] font-extrabold tracking-[-0.025em]">
          Өнгөө сонго — вэб <span className="serif">шууд</span> өөрчлөгдөнө.
        </h2>
        <p className="text-[17px] leading-relaxed text-muted">
          Palette дээр дарахад товч, badge, холбоос, суурь өнгө зэрэг жишээ вебийн бодит элементүүд солигдоно.
        </p>
        <div role="group" aria-label="Өнгөний palette" className="grid grid-cols-2 gap-2.5 min-[480px]:grid-cols-3">
          {PALETTES.map((p) => {
            const on = config.palette === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => setPalette(p.id)}
                className="ax-btn flex min-h-14 items-center gap-2.5 rounded-xl bg-surface px-3 py-2 text-left text-sm font-bold text-ink"
                style={{ border: on ? "2px solid var(--ax-brand)" : "1px solid var(--ax-line)" }}
              >
                <span className="flex shrink-0">
                  <span className="h-[22px] w-[22px] rounded-full border-2 border-surface shadow-[0_0_0_1px_var(--ax-line)]" style={{ background: p.primary }} />
                  <span className="-ml-2 h-[22px] w-[22px] rounded-full border-2 border-surface shadow-[0_0_0_1px_var(--ax-line)]" style={{ background: p.secondary }} />
                </span>
                {p.label}
              </button>
            );
          })}
        </div>
        <Link
          href="/builder"
          className="ax-btn ax-primary inline-flex min-h-[52px] items-center gap-2.5 self-start rounded-xl bg-primary px-[22px] text-base font-bold text-on-primary no-underline"
        >
          Бүрэн туршиж үзэх
          <span className="ax-arrow">
            <ArrowRight />
          </span>
        </Link>
      </div>

      <div
        className="ax-reveal ax-tr ax-light overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_40px_80px_-50px_rgba(23,37,30,.45)]"
        style={vars}
        aria-live="polite"
      >
        <div className="flex h-10 items-center gap-2 border-b border-line bg-soft-2 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E1A28F]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E8CF84]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#9CC59B]" />
          <span className="ml-3 text-xs text-muted">Жишээ веб — {cur?.label ?? "Өөрийн өнгө"}</span>
        </div>
        <div className="flex flex-col gap-[22px] p-[clamp(18px,3vw,32px)]" style={{ background: "var(--d-bg)", color: "var(--d-text)" }}>
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 font-extrabold tracking-[0.02em]">
              <span className="h-[22px] w-[22px] rounded-[7px]" style={{ background: "var(--d-p)" }} />
              Нарс студи
            </span>
            <span className="hidden gap-3.5 font-semibold min-[420px]:flex" style={{ color: "var(--d-muted)" }}>
              <span className="underline underline-offset-[3px]" style={{ color: "var(--d-p)" }}>
                Нүүр
              </span>
              <span>Үйлчилгээ</span>
              <span>Холбоо</span>
            </span>
          </div>
          <div className="flex flex-col gap-3 py-2">
            <span className="self-start rounded-md px-[9px] py-[5px] text-[11px] font-extrabold tracking-[0.06em]" style={{ background: "var(--d-s)", color: "var(--d-text)" }}>
              ШИНЭ
            </span>
            <span className="text-[clamp(24px,2.6vw,34px)] leading-[1.1] font-extrabold tracking-[-0.02em]">Таны бизнес, таны өнгө.</span>
            <span className="max-w-[32em] text-sm leading-[1.55]" style={{ color: "var(--d-muted)" }}>
              Үйлчилгээгээ танилцуулж, захиалгаа онлайнаар аваарай.
            </span>
            <span className="mt-1 flex flex-wrap gap-2.5">
              <span className="rounded-[9px] px-4 py-[11px] text-[13px] font-bold" style={{ background: "var(--d-p)", color: "var(--d-on)" }}>
                Цаг авах
              </span>
              <span className="rounded-[9px] border-[1.5px] px-4 py-2.5 text-[13px] font-bold" style={{ borderColor: "var(--d-p)", color: "var(--d-p)" }}>
                Үйлчилгээ үзэх
              </span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex flex-col gap-1.5 rounded-xl p-3"
                style={n === 1 ? { background: "var(--d-s)" } : { border: "1px solid var(--d-line)" }}
              >
                <span className="aspect-[1.6] w-full rounded-lg" style={{ background: n === 1 ? "var(--d-p)" : "var(--d-s)", opacity: n === 1 ? 0.85 : 1 }} />
                <span className="text-xs font-bold">Үйлчилгээ {n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
