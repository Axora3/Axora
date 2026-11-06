"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Desktop, LogoMark, Phone, Plus, Tablet } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icon, type IconName } from "@/components/ui/icon";
import { Input, Label, Textarea } from "@/components/ui/input";
import { FieldError } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/segmented";
import { BUILDER_STYLE_IDS, BUSINESS_TYPES, PALETTES, STYLES, TYPES, buildDemoTheme, normalizeHex, type BuilderConfig, type BusinessType } from "@/lib/builder/config";
import { cn } from "@/lib/utils";
import { useBuilder } from "./BuilderProvider";
import { DemoPreview } from "./DemoPreview";

// Matches what the order form accepts, so an uploaded logo can travel with the order.
const LOGO_ACCEPT = "image/png,image/jpeg,image/svg+xml,.png,.jpg,.jpeg,.svg";
const LOGO_RE = /\.(png|jpe?g|svg)$/i;
const LOGO_MAX = 2 * 1024 * 1024;

const DEVICES = {
  desktop: { label: "Desktop", width: 1280, DeviceIcon: Desktop },
  tablet: { label: "Tablet", width: 768, DeviceIcon: Tablet },
  mobile: { label: "Mobile", width: 390, DeviceIcon: Phone },
} as const;
type Device = keyof typeof DEVICES;
const DEVICE_OPTIONS = (Object.keys(DEVICES) as Device[]).map((value) => {
  const { label, DeviceIcon } = DEVICES[value];
  return { value, ariaLabel: label, label: <><DeviceIcon size={18} /><span className="max-[1199px]:hidden">{label}</span></> };
});

const TYPE_ICONS: Record<BusinessType, IconName> = { cafe: "clipboard", beauty: "calendar", shop: "cube", portfolio: "photo" };

const COLOR_FIELDS: [keyof BuilderConfig["colors"], string][] = [
  ["primary", "Үндсэн"],
  ["secondary", "Нэмэлт"],
  ["bg", "Суурь"],
];

const TEXT_FIELDS = [
  { key: "name", label: "Вебсайтын нэр", max: 40 },
  { key: "headline", label: "Гол гарчиг", max: 70 },
  { key: "desc", label: "Тайлбар", max: 160, long: true },
  { key: "cta", label: "CTA текст", max: 24 },
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="ax-details border-b border-line px-5">
      <summary className="!min-h-14 !py-3 !text-[15px] !font-extrabold">
        <h2 className="text-inherit">{title}</h2>
        <span aria-hidden="true" className="ax-details-icon !h-8 !w-8"><Plus size={14} strokeWidth={2.4} /></span>
      </summary>
      <div className="flex flex-col gap-3 pb-5">{children}</div>
    </details>
  );
}

/**
 * Renders the demo at the device's real width and scales it to the space
 * available. The demo re-flows with container queries, so the frame must be
 * truly 1280px wide for "Desktop" to show the desktop layout.
 */
function DeviceFrame({ device, slug, children }: { device: Device; slug: string; children: ReactNode }) {
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
        data-device={device}
        className="bx-frame ax-light mx-auto overflow-hidden rounded-2xl border border-line-mid bg-white shadow-raised"
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
 * Visual editor: toolbar on top, every control in one panel on the left, the live
 * preview in the centre. On phones the panel and the preview take turns.
 * All state lives in BuilderProvider, so /order receives the same config.
 */
export function Builder() {
  const b = useBuilder();
  const { config } = b;
  const [device, setDevice] = useState<Device>("desktop");
  const [previewing, setPreviewing] = useState(false);
  const [anim, setAnim] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [logoErr, setLogoErr] = useState("");
  const logoInput = useRef<HTMLInputElement>(null);
  const theme = buildDemoTheme(config);

  // A 1280px layout scaled onto a phone is unreadable, so phones start on Mobile.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the viewport is only known after mount
    if (window.matchMedia("(max-width: 767px)").matches) setDevice("mobile");
  }, []);

  const bump = () => setAnim((a) => a + 1);
  const draftOf = (k: keyof BuilderConfig["colors"]) => drafts[k] ?? config.colors[k];

  function onLogo(file: File | undefined) {
    if (!file) return;
    if (logoInput.current) logoInput.current.value = "";
    if (!LOGO_RE.test(file.name)) return setLogoErr("Зөвхөн PNG, JPG, SVG файл сонгоно уу.");
    if (file.size > LOGO_MAX) return setLogoErr("Файл 2MB-аас их байна. Жижиг файл сонгоно уу.");
    setLogoErr("");
    b.setLogo(file);
  }

  function resetAll() {
    b.reset();
    setDrafts({});
    setLogoErr("");
    bump();
  }

  return (
    <>
      <header className="sticky top-0 z-(--ax-z-sticky) flex h-[60px] items-center gap-2 border-b border-line bg-surface px-3 min-[960px]:gap-3 min-[960px]:px-4">
        <Link href="/" aria-label="AXORA нүүр" className="flex min-h-11 shrink-0 items-center gap-2.5 text-ink no-underline">
          <LogoMark />
          <span className="text-[17px] font-extrabold tracking-[0.08em] max-[640px]:hidden">AXORA</span>
        </Link>
        <span className="border-l border-line pl-3 text-sm font-bold text-muted max-[1099px]:hidden">Website Builder</span>

        <div className="mx-auto flex min-w-0 items-center gap-2">
          <Segmented label="Төхөөрөмж" options={DEVICE_OPTIONS} value={device} onChange={setDevice} />
          <span className="ax-badge ax-badge-solid tabular-nums max-[767px]:hidden">{DEVICES[device].width}px</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="max-[767px]:hidden"><ThemeToggle /></span>
          <Dialog>
            <DialogTrigger aria-label="Анхны төлөвт буцаах" className={buttonStyles("secondary", "max-[767px]:w-11 max-[767px]:px-0")}>
              <Icon name="refresh" size={18} />
              <span className="max-[1099px]:hidden">Reset</span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Бүх тохиргоог буцаах уу?</DialogTitle>
                <DialogDescription>Төрөл, хэв маяг, өнгө, бичсэн текст, лого бүгд анхны төлөвт орно.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose className={buttonStyles("secondary")}>Болих</DialogClose>
                <DialogClose onClick={resetAll} className={buttonStyles("danger")}>Буцаах</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Link href="/order" onClick={b.commit} className={buttonStyles("primary", "whitespace-nowrap max-[767px]:px-3")}>
            <span className="max-[480px]:sr-only">Захиалга руу</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <div className="ax-studio max-[959px]:pb-[calc(68px+env(safe-area-inset-bottom))]">
        <nav aria-label="Харагдац" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-line bg-tabbar px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur-[12px] min-[960px]:hidden">
          <button type="button" aria-pressed={!previewing} onClick={() => setPreviewing(false)} className="ax-option min-h-11 items-center justify-center gap-2 text-sm font-bold">
            <Icon name="adjustments" size={18} />
            Тохируулах
          </button>
          <button type="button" aria-pressed={previewing} onClick={() => setPreviewing(true)} className="ax-option min-h-11 items-center justify-center gap-2 text-sm font-bold">
            <Icon name="eye" size={18} />
            Харах
          </button>
        </nav>

        <aside aria-label="Тохиргоо" className={cn("min-h-0 min-w-0 overflow-y-auto overscroll-contain bg-surface min-[960px]:border-r min-[960px]:border-line", previewing && "max-[959px]:hidden")}>
          <Section title="Бизнесийн төрөл">
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
                  className="ax-btn ax-option min-h-14 items-center gap-3 px-3.5 py-2 text-left"
                >
                  <Icon name={TYPE_ICONS[k]} size={20} className="text-brand" />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[15px] leading-snug font-extrabold">{TYPES[k].label}</span>
                    <span className="text-[13px] font-semibold text-muted">{TYPES[k].sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Дизайны хэв маяг">
            <div className="grid gap-2">
              {BUILDER_STYLE_IDS.map((k) => {
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
                    className="ax-btn ax-option min-h-16 items-center gap-3.5 px-3.5 py-2 text-left"
                  >
                    <span aria-hidden="true" className="w-10 shrink-0 text-center text-[28px] leading-none" style={{ fontFamily: s.fh, fontStyle: s.hst, fontWeight: s.hw }}>Аа</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[15px] font-extrabold">{s.label}</span>
                      <span className="text-[13px] leading-snug font-semibold text-muted">{s.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Өнгө">
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
                  className="ax-btn ax-option min-h-[48px] items-center gap-2.5 px-2.5 py-2 text-left text-[13px] font-bold"
                >
                  <span aria-hidden="true" className="flex shrink-0">
                    {[p.primary, p.secondary, p.bg].map((color, i) => (
                      <span key={i} className={cn("h-[18px] w-[18px] rounded-full border border-line-strong", i > 0 && "-ml-1.5")} style={{ background: color }} />
                    ))}
                  </span>
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 border-t border-line-soft pt-3">
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
                        <Input
                          id={`hex-${k}`}
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
                          className="pl-12 font-mono uppercase"
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
              <Button
                size="sm"
                variant="quiet"
                className="self-start"
                onClick={() => {
                  b.resetColors();
                  setDrafts({});
                }}
              >
                <Icon name="refresh" size={16} />
                Өнгийг буцаах
              </Button>
            </div>
          </Section>

          <Section title="Агуулга">
            {TEXT_FIELDS.map((field) => {
              const id = `bx-${field.key}`;
              return (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={id} className="flex items-baseline justify-between gap-2">
                    {field.label}
                    <span className="text-xs font-semibold text-muted tabular-nums">{config[field.key].length}/{field.max}</span>
                  </Label>
                  {"long" in field ? (
                    <Textarea id={id} rows={3} maxLength={field.max} value={config[field.key]} onChange={(e) => b.setText(field.key, e.target.value)} />
                  ) : (
                    <Input id={id} maxLength={field.max} value={config[field.key]} onChange={(e) => b.setText(field.key, e.target.value)} />
                  )}
                </div>
              );
            })}
          </Section>

          <Section title="Лого">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-control border border-line bg-soft text-xl font-extrabold text-brand">
                {b.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimisable asset
                  <img src={b.logo.url} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span aria-hidden="true">{(config.name.trim()[0] || "A").toUpperCase()}</span>
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="truncate text-sm font-bold">{b.logo ? b.logo.name : "Лого оруулаагүй — эхний үсгийг ашиглана"}</span>
                <span className="flex flex-wrap gap-2">
                  <label htmlFor="bx-logo" className={buttonStyles("secondary", "cursor-pointer has-[:focus-visible]:outline-2", "sm")}>
                    <Icon name="upload" size={16} />
                    {b.logo ? "Солих" : "Лого оруулах"}
                    <input ref={logoInput} id="bx-logo" type="file" accept={LOGO_ACCEPT} aria-describedby="bx-logo-note" onChange={(e) => onLogo(e.target.files?.[0])} className="sr-only" />
                  </label>
                  {b.logo && <Button size="sm" variant="quiet" onClick={() => b.setLogo(null)}>Хасах</Button>}
                </span>
              </div>
            </div>
            {logoErr ? <FieldError id="bx-logo-note">{logoErr}</FieldError> : (
              <span id="bx-logo-note" className="ax-caption">PNG, JPG, SVG · 2MB хүртэл. Захиалга илгээх хүртэл зөвхөн энэ хөтөч дээр хадгалагдана.</span>
            )}
          </Section>
        </aside>

        <section aria-label="Урьдчилан харах" className={cn("ax-canvas min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain p-[clamp(12px,2.4vw,32px)]", !previewing && "max-[959px]:hidden")} tabIndex={0}>
          <DeviceFrame device={device} slug={TYPES[config.type].slug}>
            <DemoPreview config={config} logo={b.logo} animKey={anim} />
          </DeviceFrame>
          <p className="mt-3 text-center text-[13px] leading-normal text-muted">Цэс, үнэ зэрэг нь жишээ. Таны бичсэн нэр, гарчиг, тайлбар, CTA, лого шууд харагдана.</p>
        </section>
      </div>
    </>
  );
}
