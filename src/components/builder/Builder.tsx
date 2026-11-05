"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Desktop, Phone, Tablet } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { FieldError } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/segmented";
import { BUSINESS_TYPES, PALETTES, STYLES, STYLE_IDS, TYPES, buildDemoTheme, normalizeHex, type BuilderConfig } from "@/lib/builder/config";
import { useBuilder } from "./BuilderProvider";
import { DemoPreview } from "./DemoPreview";

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const LOGO_MAX = 2 * 1024 * 1024;

const DEVICES = {
  desktop: { label: "Desktop", width: 1280, DeviceIcon: Desktop },
  tablet: { label: "Tablet", width: 768, DeviceIcon: Tablet },
  mobile: { label: "Mobile", width: 390, DeviceIcon: Phone },
} as const;
type Device = keyof typeof DEVICES;
const DEVICE_OPTIONS = (Object.keys(DEVICES) as Device[]).map((value) => {
  const { label, DeviceIcon } = DEVICES[value];
  return { value, ariaLabel: label, label: <><DeviceIcon size={18} /><span className="max-[640px]:hidden">{label}</span></> };
});

const SECTIONS: { id: "type" | "style" | "color" | "content"; label: string; title: string; hint: string; icon: IconName }[] = [
  { id: "type", label: "Төрөл", title: "Вебийн төрөл", hint: "Бизнест тань ойр жишээг сонгоно уу.", icon: "layout-grid" },
  { id: "style", label: "Хэв маяг", title: "Дизайны хэв маяг", hint: "Үсгийн хэв, булан, зайг хамтад нь солино.", icon: "layers" },
  { id: "color", label: "Өнгө", title: "Өнгө", hint: "Бэлэн palette сонгох эсвэл HEX кодоо оруулна уу.", icon: "adjustments" },
  { id: "content", label: "Агуулга", title: "Агуулгаа турших", hint: "Нэр, гарчиг, товчны текстээ бичээрэй.", icon: "pencil" },
];
type SectionId = (typeof SECTIONS)[number]["id"];

const COLOR_FIELDS: [keyof BuilderConfig["colors"], string][] = [
  ["primary", "Үндсэн"],
  ["secondary", "Нэмэлт"],
  ["bg", "Суурь"],
];

const textInput = "ax-control min-h-11 px-3 text-base";

function FieldLabel({ htmlFor, children, count, max }: { htmlFor: string; children: React.ReactNode; count?: number; max?: number }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-sm font-bold">
      {children}
      {max !== undefined && <span className="text-xs font-semibold text-muted tabular-nums">{count}/{max}</span>}
    </label>
  );
}

/**
 * Renders the demo at the device's real width and scales it to the space
 * available. The demo re-flows with container queries, so the frame must be
 * truly 1280px wide for "Desktop" to show the desktop layout.
 */
function DeviceFrame({ device, slug, children }: { device: Device; slug: string; children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const virtual = DEVICES[device].width;
  const scale = available ? Math.min(1, available / virtual) : 1;

  useEffect(() => {
    if (!outer.current || !inner.current) return;
    const widthObserver = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    const heightObserver = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    widthObserver.observe(outer.current);
    heightObserver.observe(inner.current);
    return () => {
      widthObserver.disconnect();
      heightObserver.disconnect();
    };
  }, []);

  return (
    <div ref={outer} className="w-full min-w-0">
      <div
        className="bx-frame ax-light mx-auto overflow-hidden rounded-2xl border border-line-mid bg-white shadow-raised transition-[width] duration-300 ease-out"
        style={{ width: available ? Math.round(virtual * scale) : "100%", maxWidth: "100%" }}
      >
        <div className="flex h-9 items-center gap-[7px] border-b border-line bg-soft-2 px-3.5">
          <span className="h-[9px] w-[9px] rounded-full bg-[#E1A28F]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#E8CF84]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#9CC59B]" />
          <span className="ml-2.5 truncate text-xs text-muted">{slug}.mn — жишээ</span>
        </div>
        <div className="overflow-hidden" style={{ height: height ? Math.ceil(height * scale) : undefined }}>
          <div ref={inner} className="origin-top-left" style={{ width: virtual, transform: scale < 1 ? `scale(${scale})` : undefined }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Studio layout: section rail, one settings panel at a time, and the canvas.
 * On phones the rail becomes the bottom bar, with Preview as its last item.
 * All state still lives in BuilderProvider, so /order receives the same config.
 */
export function Builder() {
  const b = useBuilder();
  const { config } = b;
  const [device, setDevice] = useState<Device>("desktop");
  const [section, setSection] = useState<SectionId>("type");
  const [previewing, setPreviewing] = useState(false);
  const [anim, setAnim] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [logoErr, setLogoErr] = useState("");
  const theme = buildDemoTheme(config);
  const index = SECTIONS.findIndex((s) => s.id === section);
  const current = SECTIONS[index];

  // A 1280px layout scaled onto a phone is unreadable, so phones start on Mobile.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the viewport is only known after mount
    if (window.matchMedia("(max-width: 767px)").matches) setDevice("mobile");
  }, []);

  const bump = () => setAnim((a) => a + 1);
  const draftOf = (k: string) => drafts[k] ?? config.colors[k as keyof BuilderConfig["colors"]];
  const open = (id: SectionId) => {
    setSection(id);
    setPreviewing(false);
  };

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

  const cta = (
    <Link href="/order" onClick={b.commit} className={buttonStyles("primary", "whitespace-nowrap")}>
      Энэ загвараар үнийн санал авах
      <ArrowRight size={16} />
    </Link>
  );

  return (
    <div className="ax-studio max-[959px]:pb-[calc(76px+env(safe-area-inset-bottom))]">
      <nav aria-label="Тохиргооны хэсгүүд" className="fixed inset-x-0 bottom-0 z-30 flex gap-1 border-t border-line bg-tabbar px-2 pt-1.5 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur-[12px] min-[960px]:static min-[960px]:flex-col min-[960px]:gap-1.5 min-[960px]:border-t-0 min-[960px]:border-r min-[960px]:bg-surface min-[960px]:p-2.5">
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" aria-pressed={!previewing && section === s.id} onClick={() => open(s.id)} className="ax-rail-item">
            <Icon name={s.icon} size={20} />
            {s.label}
          </button>
        ))}
        <button type="button" aria-pressed={previewing} onClick={() => setPreviewing(true)} className="ax-rail-item min-[960px]:hidden">
          <Icon name="eye" size={20} />
          Харах
        </button>
      </nav>

      <aside aria-label="Тохиргоо" className={`flex min-h-0 min-w-0 flex-col bg-surface min-[960px]:border-r min-[960px]:border-line ${previewing ? "max-[959px]:hidden" : ""}`}>
        <div key={section} className="ax-in-sm flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-5">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-extrabold text-muted tabular-nums">Алхам {index + 1} / {SECTIONS.length}</p>
            <h2 className="text-[22px] leading-tight font-extrabold tracking-[-0.018em]">{current.title}</h2>
            <p className="text-sm leading-relaxed text-muted">{current.hint}</p>
          </div>

          {section === "type" && (
            <div className="grid gap-2">
              {BUSINESS_TYPES.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={config.type === k}
                  onClick={() => {
                    b.setType(k);
                    bump();
                  }}
                  className="ax-btn ax-option min-h-16 flex-col items-start justify-center gap-0.5 px-3.5 py-2.5 text-left"
                >
                  <span className="text-[15px] leading-snug font-extrabold">{TYPES[k].label}</span>
                  <span className="text-[13px] font-semibold text-muted">{TYPES[k].sub}</span>
                </button>
              ))}
            </div>
          )}

          {section === "style" && (
            <div className="grid grid-cols-2 gap-2">
              {STYLE_IDS.map((k) => {
                const s = STYLES[k];
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={config.style === k}
                    onClick={() => {
                      b.setStyle(k);
                      bump();
                    }}
                    className="ax-btn ax-option min-h-[96px] flex-col items-start justify-between gap-1 p-3 text-left"
                    style={k === "dark" ? { background: "var(--ax-band)", color: "var(--ax-on-band)" } : undefined}
                  >
                    <span aria-hidden="true" className="text-[30px] leading-none" style={{ fontFamily: s.fh, fontStyle: s.hst, fontWeight: s.hw }}>
                      Аа
                    </span>
                    <span className="text-[13px] leading-tight font-bold">{s.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {section === "color" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={config.palette === p.id}
                    onClick={() => {
                      b.setPalette(p.id);
                      setDrafts({});
                    }}
                    className="ax-btn ax-option min-h-[52px] items-center gap-2.5 px-2.5 py-2 text-left text-[13px] font-bold"
                  >
                    <span aria-hidden="true" className="flex shrink-0">
                      {[p.primary, p.secondary, p.bg].map((color, i) => (
                        <span key={i} className={`h-[18px] w-[18px] rounded-full border border-line-strong ${i ? "-ml-1.5" : ""}`} style={{ background: color }} />
                      ))}
                    </span>
                    <span className="truncate">{p.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2.5 border-t border-line-soft pt-4">
                {COLOR_FIELDS.map(([k, label]) => {
                  const draft = draftOf(k);
                  const valid = !!normalizeHex(draft);
                  return (
                    <div key={k} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2.5">
                        <label htmlFor={`hex-${k}`} className="w-[64px] shrink-0 text-sm font-bold">{label}</label>
                        <div className="relative min-w-0 flex-1">
                          <input
                            className="ax-color absolute top-1.5 left-1.5 z-[1] h-8 w-8 cursor-pointer rounded-inner border border-line-strong bg-surface p-0"
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
                            onBlur={() => {
                              const normalized = normalizeHex(draft);
                              if (normalized) setDrafts((c) => ({ ...c, [k]: normalized }));
                            }}
                            aria-invalid={!valid}
                            aria-describedby={valid ? undefined : `hex-err-${k}`}
                            className="ax-control pr-3 pl-12 font-mono text-base uppercase"
                          />
                        </div>
                      </div>
                      {!valid && (
                        <span className="pl-[74px]">
                          <FieldError id={`hex-err-${k}`}>HEX буруу байна. Жишээ: #245C45</FieldError>
                        </span>
                      )}
                    </div>
                  );
                })}
                {theme.warnings.length > 0 && (
                  <div role="status" className="flex flex-col gap-1 rounded-control border border-warn-line bg-warn-bg px-3 py-2.5 text-[13px] leading-normal font-semibold text-warn-ink">
                    {theme.warnings.map((w) => (
                      <span key={w}><Icon name="circle-alert" size={16} /> {w}</span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {section === "content" && (
            <div className="flex flex-col gap-3.5">
              {(
                [
                  ["name", "Бизнесийн нэр", 40],
                  ["headline", "Гол гарчиг", 70],
                ] as const
              ).map(([k, label, max]) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor={`bx-${k}`} count={config[k].length} max={max}>{label}</FieldLabel>
                  <input id={`bx-${k}`} type="text" maxLength={max} value={config[k]} onChange={(e) => b.setText(k, e.target.value)} className={textInput} />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="bx-desc" count={config.desc.length} max={160}>Богино тайлбар</FieldLabel>
                <textarea id="bx-desc" rows={3} maxLength={160} value={config.desc} onChange={(e) => b.setText("desc", e.target.value)} className="ax-control resize-y px-3 py-2.5 text-base" />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="bx-cta" count={config.cta.length} max={24}>CTA текст</FieldLabel>
                <input id="bx-cta" type="text" maxLength={24} value={config.cta} onChange={(e) => b.setText("cta", e.target.value)} className={textInput} />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="bx-logo">Лого (заавал биш)</FieldLabel>
                <input
                  id="bx-logo"
                  type="file"
                  accept={LOGO_TYPES.join(",")}
                  onChange={onLogo}
                  aria-describedby="bx-logo-note"
                  className="ax-control min-h-11 cursor-pointer p-1 text-sm file:mr-3 file:min-h-9 file:cursor-pointer file:rounded-inner file:border-0 file:bg-soft file:px-3 file:text-sm file:font-bold file:text-ink"
                />
                <span id="bx-logo-note" className="text-[13px] leading-normal" style={{ color: logoErr ? "var(--ax-danger)" : "var(--ax-muted)", fontWeight: logoErr ? 700 : 400 }}>
                  {logoErr
                    ? <><Icon name="x" size={16} /> {logoErr}</>
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
                    className={buttonStyles("secondary", "self-start", "sm")}
                  >
                    Лого хасах
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-line p-3">
          <button
            type="button"
            aria-label="Анхны төлөвт буцаах"
            title="Анхны төлөвт буцаах"
            onClick={() => {
              b.reset();
              setDrafts({});
              setLogoErr("");
              bump();
            }}
            className={buttonStyles("quiet", "px-3")}
          >
            <Icon name="refresh" size={18} />
          </button>
          <span className="flex-1" />
          {index > 0 && (
            <button type="button" aria-label="Өмнөх" onClick={() => open(SECTIONS[index - 1].id)} className={buttonStyles("secondary", "px-3")}>
              <ArrowLeft size={18} />
            </button>
          )}
          {index < SECTIONS.length - 1 ? (
            <button type="button" onClick={() => open(SECTIONS[index + 1].id)} className={buttonStyles("primary")}>
              {SECTIONS[index + 1].label}
              <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={() => setPreviewing(true)} className={buttonStyles("primary", "min-[960px]:hidden")}>
              Харах
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </aside>

      <section aria-label="Урьдчилан харах" className={`ax-canvas flex min-h-0 min-w-0 flex-col ${previewing ? "" : "max-[959px]:hidden"}`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-b border-line bg-surface px-[clamp(12px,2vw,20px)] py-2.5">
          <div className="flex items-center gap-2.5">
            <Segmented label="Төхөөрөмж" options={DEVICE_OPTIONS} value={device} onChange={setDevice} />
            <span className="ax-badge ax-badge-solid tabular-nums">{DEVICES[device].width}px</span>
          </div>
          <div className="max-[959px]:w-full max-[959px]:[&>a]:w-full">{cta}</div>
        </div>
        <div tabIndex={0} aria-label="Загварын preview" className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-[clamp(12px,2.4vw,32px)]">
          <DeviceFrame device={device} slug={TYPES[config.type].slug}>
            <DemoPreview config={config} logo={b.logo} animKey={anim} />
          </DeviceFrame>
          <p className="mt-3 text-center text-[13px] leading-normal text-muted">Жишээ агуулга, үнэ нь зөвхөн харагдах байдлыг үзүүлэх зорилготой.</p>
        </div>
      </section>
    </div>
  );
}
