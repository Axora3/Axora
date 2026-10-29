"use client";

import Link from "next/link";
import { useState } from "react";
import { Desktop, Phone, Tablet } from "@/components/icons";
import { FieldError } from "@/components/ui/Notice";
import { BUSINESS_TYPES, PALETTES, STYLES, STYLE_IDS, TYPES, buildDemoTheme, normalizeHex, type BuilderConfig } from "@/lib/builder/config";
import { useBuilder } from "./BuilderProvider";
import { DemoPreview } from "./DemoPreview";

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const LOGO_MAX = 2 * 1024 * 1024;

const DEVICES = {
  desktop: { label: "Desktop", width: "100%", max: "1180px", note: "Бүтэн өргөн", Icon: Desktop },
  tablet: { label: "Tablet", width: "768px", max: "none", note: "768px өргөн", Icon: Tablet },
  mobile: { label: "Mobile", width: "390px", max: "none", note: "390px өргөн", Icon: Phone },
} as const;
type Device = keyof typeof DEVICES;

const COLOR_FIELDS: [keyof BuilderConfig["colors"], string][] = [
  ["primary", "Үндсэн"],
  ["secondary", "Нэмэлт"],
  ["bg", "Суурь"],
];

const fs = "ax-fs rounded-[18px] border border-line bg-surface p-[18px]";
const legend = "float-left mb-3 w-full p-0 text-[13px] font-extrabold tracking-[0.06em] text-brand uppercase";
const textInput = "min-h-11 w-full rounded-[10px] border border-line-strong bg-sunken px-3 text-base text-ink";

export function Builder() {
  const b = useBuilder();
  const { config } = b;
  const [device, setDevice] = useState<Device>("desktop");
  const [tab, setTab] = useState<"cfg" | "prev">("cfg");
  const [anim, setAnim] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [logoErr, setLogoErr] = useState("");
  const theme = buildDemoTheme(config);
  const dv = DEVICES[device];

  const bump = () => setAnim((a) => a + 1);
  const draftOf = (k: string) => drafts[k] ?? config.colors[k as keyof BuilderConfig["colors"]];

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!LOGO_TYPES.includes(f.type)) {
      e.target.value = "";
      setLogoErr("Зөвхөн PNG, JPG, WEBP, SVG файл сонгоно уу.");
      return;
    }
    if (f.size > LOGO_MAX) {
      e.target.value = "";
      setLogoErr("Файл 2MB-аас их байна. Жижиг файл сонгоно уу.");
      return;
    }
    setLogoErr("");
    b.setLogo(f);
  }

  return (
    <>
      <div role="group" aria-label="Харагдац" className="sticky top-[68px] z-20 mt-4 flex gap-1 rounded-xl bg-soft-3 p-1 min-[960px]:hidden">
        {(
          [
            ["cfg", "Тохируулах"],
            ["prev", "Урьдчилан харах"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={tab === k}
            onClick={() => setTab(k)}
            className="min-h-11 flex-1 cursor-pointer rounded-[9px] border-0 text-[15px] font-bold text-ink"
            style={{ background: tab === k ? "var(--ax-elevated)" : "transparent" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-start gap-6">
        <aside aria-label="Тохиргоо" className={`flex min-w-0 flex-[1_1_min(340px,100%)] flex-col gap-3.5 min-[960px]:max-w-[400px] ${tab === "prev" ? "max-[959px]:hidden" : ""}`}>
          <fieldset className={fs}>
            <legend className={legend}>1. Вебийн төрөл</legend>
            <div className="clear-both grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((k) => {
                const on = config.type === k;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      b.setType(k);
                      bump();
                    }}
                    className="ax-btn ax-opt flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-xl px-3 py-2.5 text-left text-ink"
                    style={{ border: on ? "2px solid var(--ax-brand)" : "1px solid var(--ax-line)", background: on ? "var(--ax-soft)" : "var(--ax-surface)" }}
                  >
                    <span className="text-sm font-extrabold">{TYPES[k].label}</span>
                    <span className="text-xs font-semibold text-muted">{TYPES[k].sub}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className={fs}>
            <legend className={legend}>2. Дизайны хэв маяг</legend>
            <div className="clear-both grid grid-cols-3 gap-2">
              {STYLE_IDS.map((k) => {
                const on = config.style === k;
                const s = STYLES[k];
                const dark = k === "dark";
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      b.setStyle(k);
                      bump();
                    }}
                    className="ax-btn ax-opt flex min-h-[72px] flex-col items-start justify-between gap-1 rounded-xl p-2.5 text-left"
                    style={{
                      border: on ? "2px solid var(--ax-brand)" : "1px solid var(--ax-line)",
                      background: dark ? "var(--ax-band)" : on ? "var(--ax-soft)" : "var(--ax-surface)",
                      color: dark ? "var(--ax-on-band)" : "var(--ax-ink)",
                    }}
                  >
                    <span aria-hidden="true" className="text-[22px] leading-none" style={{ fontFamily: s.fh, fontStyle: s.hst, fontWeight: s.hw }}>
                      Аа
                    </span>
                    <span className="text-xs leading-tight font-bold">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className={fs}>
            <legend className={legend}>3. Өнгө</legend>
            <div className="clear-both grid grid-cols-3 gap-2">
              {PALETTES.map((p) => {
                const on = config.palette === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      b.setPalette(p.id);
                      setDrafts({});
                    }}
                    className="ax-btn ax-opt flex min-h-[52px] items-center gap-2 rounded-xl bg-surface px-2.5 py-2 text-left text-[13px] font-bold text-ink"
                    style={{ border: on ? "2px solid var(--ax-brand)" : "1px solid var(--ax-line)" }}
                  >
                    <span className="flex shrink-0">
                      <span className="h-[18px] w-[18px] rounded-full shadow-[0_0_0_2px_var(--ax-surface),0_0_0_3px_var(--ax-line)]" style={{ background: p.primary }} />
                      <span className="-ml-1 h-[18px] w-[18px] rounded-full shadow-[0_0_0_2px_var(--ax-surface),0_0_0_3px_var(--ax-line)]" style={{ background: p.bg }} />
                    </span>
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {COLOR_FIELDS.map(([k, label]) => {
                const draft = draftOf(k);
                const valid = !!normalizeHex(draft);
                return (
                  <div key={k} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                      <label htmlFor={`hex-${k}`} className="w-[72px] shrink-0 text-sm font-bold">
                        {label}
                      </label>
                      <input
                        className="ax-color h-11 w-11 shrink-0 cursor-pointer rounded-[10px] border border-line-strong bg-surface p-[3px]"
                        type="color"
                        aria-label={`${label} өнгө сонгох`}
                        value={config.colors[k].toLowerCase()}
                        onChange={(e) => {
                          const v = e.target.value.toUpperCase();
                          b.setColor(k, v);
                          setDrafts((d) => ({ ...d, [k]: v }));
                        }}
                      />
                      <input
                        id={`hex-${k}`}
                        type="text"
                        inputMode="text"
                        spellCheck={false}
                        autoCapitalize="characters"
                        maxLength={7}
                        value={draft}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setDrafts((d) => ({ ...d, [k]: raw }));
                          const n = normalizeHex(raw);
                          if (n) b.setColor(k, n);
                        }}
                        aria-invalid={!valid}
                        aria-describedby={valid ? undefined : `hex-err-${k}`}
                        className="min-h-11 min-w-0 flex-1 rounded-[10px] bg-sunken px-3 font-mono text-base text-ink uppercase"
                        style={{ border: valid ? "1px solid var(--ax-line-strong)" : "2px solid var(--ax-danger)" }}
                      />
                    </div>
                    {!valid && (
                      <span className="pl-[82px]">
                        <FieldError id={`hex-err-${k}`}>HEX буруу байна. Жишээ: #245C45</FieldError>
                      </span>
                    )}
                  </div>
                );
              })}
              {theme.warnings.length > 0 && (
                <div role="status" className="flex flex-col gap-1 rounded-[10px] border border-warn-line bg-warn-bg px-3 py-2.5 text-[13px] leading-normal font-semibold text-warn-ink">
                  {theme.warnings.map((w) => (
                    <span key={w}>! {w}</span>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          <fieldset className={fs}>
            <legend className={legend}>4. Агуулгаа турших</legend>
            <div className="clear-both flex flex-col gap-3">
              {(
                [
                  ["name", "Бизнесийн нэр", 40],
                  ["headline", "Гол гарчиг", 70],
                ] as const
              ).map(([k, label, max]) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <label htmlFor={`bx-${k}`} className="text-sm font-bold">
                    {label}
                  </label>
                  <input id={`bx-${k}`} type="text" maxLength={max} value={config[k]} onChange={(e) => b.setText(k, e.target.value)} className={textInput} />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bx-desc" className="text-sm font-bold">
                  Богино тайлбар
                </label>
                <textarea
                  id="bx-desc"
                  rows={2}
                  maxLength={160}
                  value={config.desc}
                  onChange={(e) => b.setText("desc", e.target.value)}
                  className="resize-y rounded-[10px] border border-line-strong bg-sunken px-3 py-2.5 text-base text-ink"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bx-cta" className="text-sm font-bold">
                  CTA текст
                </label>
                <input id="bx-cta" type="text" maxLength={24} value={config.cta} onChange={(e) => b.setText("cta", e.target.value)} className={textInput} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bx-logo" className="text-sm font-bold">
                  Лого (заавал биш)
                </label>
                <input id="bx-logo" type="file" accept={LOGO_TYPES.join(",")} onChange={onLogo} aria-describedby="bx-logo-note" className="min-h-11 text-sm" />
                <span id="bx-logo-note" className="text-[13px] leading-normal" style={{ color: logoErr ? "var(--ax-danger)" : "var(--ax-muted)", fontWeight: logoErr ? 700 : 400 }}>
                  {logoErr
                    ? `✕ ${logoErr}`
                    : b.logo
                      ? `“${b.logo.name}” — зөвхөн таны төхөөрөмж дээр харагдаж байна. Серверт илгээгдээгүй.`
                      : "PNG, JPG, WEBP, SVG · 2MB хүртэл. Зөвхөн энэ төхөөрөмж дээр урьдчилан харагдана."}
                </span>
                {b.logo && (
                  <button
                    type="button"
                    onClick={() => {
                      b.setLogo(null);
                      const el = document.getElementById("bx-logo") as HTMLInputElement | null;
                      if (el) el.value = "";
                    }}
                    className="ax-btn ax-ghost min-h-11 self-start rounded-[9px] border border-line-strong bg-surface px-3 text-[13px] font-bold text-ink"
                  >
                    Лого хасах
                  </button>
                )}
              </div>
            </div>
          </fieldset>

          <div className="flex flex-col gap-2.5">
            <Link href="/order" onClick={b.commit} className="ax-btn ax-primary flex min-h-[54px] items-center justify-center gap-2.5 rounded-xl bg-primary text-center text-base font-bold text-on-primary no-underline">
              Энэ загвараар үнийн санал авах
            </Link>
            <button
              type="button"
              onClick={() => {
                b.reset();
                setDrafts({});
                setLogoErr("");
                bump();
              }}
              className="ax-btn ax-ghost min-h-[46px] rounded-xl border border-line-strong bg-surface text-[15px] font-bold text-ink"
            >
              Анхны төлөвт буцаах
            </button>
          </div>
        </aside>

        <section aria-label="Урьдчилан харах" className={`flex min-w-0 flex-[999_1_560px] flex-col gap-3 min-[960px]:sticky min-[960px]:top-[84px] ${tab === "cfg" ? "max-[959px]:hidden" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div role="group" aria-label="Төхөөрөмж" className="flex gap-1 rounded-xl bg-soft-3 p-1">
              {(Object.keys(DEVICES) as Device[]).map((k) => {
                const on = device === k;
                const { Icon, label } = DEVICES[k];
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDevice(k)}
                    className="ax-btn inline-flex min-h-11 items-center gap-2 rounded-[9px] border-0 px-3.5 text-sm font-bold text-ink"
                    style={{ background: on ? "var(--ax-elevated)" : "transparent", boxShadow: on ? "0 1px 2px rgba(23,37,30,.14)" : "none" }}
                  >
                    <Icon />
                    {label}
                  </button>
                );
              })}
            </div>
            <span className="text-[13px] font-bold text-muted">{dv.note}</span>
          </div>

          <div className="flex justify-center overflow-x-auto rounded-[22px] border border-line bg-soft p-[clamp(10px,2vw,24px)]">
            <div
              className="bx-frame ax-light shrink-0 overflow-hidden rounded-2xl border border-line-mid bg-white shadow-[0_30px_60px_-36px_rgba(23,37,30,.5)]"
              style={{ width: dv.width, maxWidth: dv.max }}
            >
              <div className="flex h-9 items-center gap-[7px] border-b border-line bg-soft-2 px-3.5">
                <span className="h-[9px] w-[9px] rounded-full bg-[#E1A28F]" />
                <span className="h-[9px] w-[9px] rounded-full bg-[#E8CF84]" />
                <span className="h-[9px] w-[9px] rounded-full bg-[#9CC59B]" />
                <span className="ml-2.5 truncate text-xs text-muted">{TYPES[config.type].slug}.mn — жишээ</span>
              </div>
              <div aria-live="polite">
                <DemoPreview config={config} logo={b.logo} animKey={anim} />
              </div>
            </div>
          </div>
          <p className="text-[13px] leading-normal text-muted">Жишээ агуулга, үнэ нь зөвхөн харагдах байдлыг үзүүлэх зорилготой.</p>
        </section>
      </div>
    </>
  );
}
