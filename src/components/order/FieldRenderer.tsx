"use client";

import Link from "next/link";
import { Plus } from "@/components/icons";
import { FieldError } from "@/components/ui/Notice";
import { STYLES, TYPES, luminance, paletteLabel, readableOn, type BuilderConfig } from "@/lib/builder/config";
import { NONE_FEATURE, OTHER, contactExtraLabel, normalizeHexAnswer, type AnswerValue, type Answers, type Field } from "@/lib/order/questions";
import { CONSENT_LABEL, CONSENT_NOTE } from "./copy";

type Props = {
  f: Field;
  a: Answers;
  set: (id: string, v: AnswerValue) => void;
  error?: string;
  /** Disclosure state for the two toggle buttons. */
  linksOpen: boolean;
  domainHelp: boolean;
  onToggle: (id: string) => void;
  builder: BuilderConfig | null;
};

const req = (
  <>
    <span aria-hidden="true" className="text-danger">
      {" "}
      *
    </span>
    <span className="sr-only"> (заавал)</span>
  </>
);

const borderFor = (bad: boolean) => ({ border: bad ? "2px solid var(--ax-danger)" : "1px solid var(--ax-line-strong)" });

export function FieldRenderer({ f, a, set, error, linksOpen, domainHelp, onToggle, builder }: Props) {
  const fid = `f-${f.id}`;
  const hintId = `h-${f.id}`;
  const errId = `e-${f.id}`;
  const describedBy = [f.hint ? hintId : "", error ? errId : ""].filter(Boolean).join(" ") || undefined;
  const str = (k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
  const label = f.id === "q38x" ? contactExtraLabel(a) : f.label;
  const errEl = error ? <FieldError id={errId}>{error}</FieldError> : null;
  const hintEl = f.hint ? (
    <span id={hintId} className="text-[13px] leading-normal text-muted">
      {f.hint}
    </span>
  ) : null;

  switch (f.kind) {
    case "toggle": {
      const open = f.id === "tLinks" ? linksOpen : domainHelp;
      return (
        <button
          type="button"
          onClick={() => onToggle(f.id)}
          aria-expanded={open}
          className="ax-btn ax-ghost inline-flex min-h-[46px] items-center gap-2.5 self-start rounded-[11px] border border-dashed border-[#9AA89F] bg-surface px-4 text-left text-sm font-bold text-ink"
        >
          <span className="inline-flex transition-transform duration-200" style={{ transform: open ? "rotate(45deg)" : "none" }}>
            <Plus size={16} strokeWidth={2.4} />
          </span>
          {f.label}
        </button>
      );
    }

    case "note": {
      let text = f.label;
      if (f.id === "nContact") {
        text =
          a.q38 === "Утас"
            ? `Бид 4-р асуултад оруулсан утас руу холбогдоно${str("q4") ? `: ${str("q4")}` : "."}`
            : `Бид 5-р асуултад оруулсан имэйл рүү бичнэ${str("q5") ? `: ${str("q5")}` : "."}`;
      }
      return <p className="rounded-xl bg-soft-2 px-3.5 py-3 text-sm leading-relaxed text-muted">{text}</p>;
    }

    case "builder": {
      if (!builder) {
        return (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-dashed border-[#9AA89F] px-4 py-3.5 text-sm leading-normal text-muted">
            <span>Live demo дээр өнгө, хэв маягаа туршвал энд автоматаар бөглөгдөнө.</span>
            <Link href="/builder" className="inline-flex min-h-11 items-center font-bold">
              Вебээ загварчлах
            </Link>
          </div>
        );
      }
      const { bg, primary, secondary } = builder.colors;
      return (
        <div className="ax-in-sm grid gap-4 rounded-2xl border border-line-mid bg-soft p-4 [grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr))]">
          <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-line p-3.5" style={{ background: bg, color: luminance(bg) < 0.2 ? "#EEF0EC" : "#17251E" }}>
            <span className="text-xs font-extrabold">{builder.name}</span>
            <span className="text-lg leading-tight font-extrabold">{builder.headline}</span>
            <span className="self-start rounded-lg px-3 py-2 text-xs font-bold" style={{ background: primary, color: readableOn(primary) }}>
              {builder.cta}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 text-sm leading-normal">
            <span className="font-extrabold text-brand">Live demo-оос дамжсан тохиргоо</span>
            <span>
              Төрөл: <strong>{TYPES[builder.type].label}</strong>
            </span>
            <span>
              Хэв маяг: <strong>{STYLES[builder.style].label}</strong>
            </span>
            <span className="flex flex-wrap items-center gap-1.5">
              Өнгө: <strong>{paletteLabel(builder)}</strong>
              {[primary, secondary, bg].map((c, i) => (
                <span key={i} className="h-4 w-4 rounded-full border border-line-strong" style={{ background: c }} title={c} />
              ))}
            </span>
            <Link href="/builder" className="inline-flex min-h-11 items-center font-bold">
              Demo дээр өөрчлөх
            </Link>
          </div>
        </div>
      );
    }

    case "input":
    case "textarea": {
      const common = {
        id: fid,
        value: str(f.id),
        placeholder: f.ph,
        maxLength: f.max,
        "aria-invalid": !!error,
        "aria-describedby": describedBy,
        "aria-required": f.req || undefined,
        style: borderFor(!!error),
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(f.id, e.target.value),
      };
      return (
        <div className="flex flex-col gap-2">
          <label htmlFor={fid} className="text-[15px] leading-snug font-bold">
            {f.n}. {label}
            {f.req && req}
          </label>
          {hintEl}
          {f.kind === "input" ? (
            <input {...common} type={f.type ?? "text"} autoComplete={f.auto ?? "off"} inputMode={f.mode} className="min-h-[50px] w-full rounded-[11px] bg-bg px-3.5 text-base text-ink" />
          ) : (
            <textarea {...common} rows={3} className="w-full resize-y rounded-[11px] bg-bg px-3.5 py-3 text-base leading-normal text-ink" />
          )}
          {errEl}
        </div>
      );
    }

    case "radio":
    case "multi": {
      const multi = f.kind === "multi";
      const cur = multi ? (Array.isArray(a[f.id]) ? (a[f.id] as string[]) : []) : str(f.id);
      const otherOn = !!f.other && (multi ? (cur as string[]).includes(OTHER) : cur === OTHER);
      const otherErr = !!error && error.includes("Бусад");
      const toggle = (lab: string) => {
        if (!multi) return set(f.id, lab);
        let list = [...(cur as string[])];
        if (list.includes(lab)) list = list.filter((x) => x !== lab);
        else if (lab === NONE_FEATURE) list = [NONE_FEATURE];
        else list = [...list.filter((x) => x !== NONE_FEATURE), lab];
        set(f.id, list);
      };
      return (
        <div className="flex flex-col gap-2">
          <fieldset className="ax-fs" aria-describedby={describedBy} aria-required={f.req || undefined}>
            <legend className="mb-2 p-0 text-[15px] leading-snug font-bold">
              {f.n}. {label}
              {f.req && req}
            </legend>
            {f.hint && (
              <span id={hintId} className="mb-2 block text-[13px] leading-normal text-muted">
                {f.hint}
              </span>
            )}
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(210px,100%),1fr))]">
              {f.opts!.map((lab, j) => {
                const on = multi ? (cur as string[]).includes(lab) : cur === lab;
                return (
                  <label
                    key={lab}
                    htmlFor={`${fid}-${j}`}
                    className="ax-opt flex min-h-[50px] cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[15px] leading-snug font-semibold transition-colors"
                    style={{ border: on ? "2px solid var(--ax-brand)" : error && !otherErr ? "1px solid var(--ax-danger)" : "1px solid var(--ax-line-strong)", background: on ? "var(--ax-soft)" : "#fff" }}
                  >
                    <input
                      id={`${fid}-${j}`}
                      type={multi ? "checkbox" : "radio"}
                      name={`n-${f.id}`}
                      checked={on}
                      onChange={() => toggle(lab)}
                      aria-invalid={!!error || undefined}
                      className="m-0 h-5 w-5 shrink-0"
                    />
                    {lab}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {otherOn && (
            <div className="ax-in-sm flex flex-col gap-1.5 border-l-2 border-lime pl-3.5">
              <label htmlFor={`${fid}o`} className="text-sm font-bold">
                Бусад — тодруулна уу{req}
              </label>
              <input
                id={`${fid}o`}
                type="text"
                maxLength={300}
                value={str(f.id + "o")}
                onChange={(e) => set(f.id + "o", e.target.value)}
                aria-invalid={otherErr}
                aria-describedby={otherErr ? errId : undefined}
                className="min-h-12 rounded-[11px] bg-bg px-3.5 text-base text-ink"
                style={borderFor(otherErr)}
              />
            </div>
          )}
          {errEl}
        </div>
      );
    }

    case "color": {
      const unknown = !!f.unknown && a[f.id + "u"] === true;
      const hv = normalizeHexAnswer(str(f.id));
      return (
        <div className="flex flex-col gap-2">
          <label htmlFor={fid} className="text-[15px] leading-snug font-bold">
            {f.n}. {label}
            {f.req && req}
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              className="ax-color h-[50px] w-[50px] cursor-pointer rounded-[11px] border border-line-strong bg-surface p-[3px] disabled:opacity-50"
              type="color"
              aria-label={`${label} — өнгө сонгох`}
              value={(hv ?? "#245C45").toLowerCase()}
              disabled={unknown}
              onChange={(e) => set(f.id, e.target.value.toUpperCase())}
            />
            <input
              id={fid}
              type="text"
              spellCheck={false}
              autoCapitalize="characters"
              maxLength={7}
              placeholder="#245C45"
              value={str(f.id)}
              disabled={unknown}
              onChange={(e) => set(f.id, e.target.value)}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              className="min-h-[50px] w-40 rounded-[11px] bg-bg px-3.5 font-mono text-base text-ink uppercase disabled:opacity-50"
              style={borderFor(!!error)}
            />
            {f.unknown && (
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={unknown} onChange={(e) => set(f.id + "u", e.target.checked)} className="m-0 h-5 w-5" />
                Өнгөө мэдэхгүй, санал авъя
              </label>
            )}
          </div>
          {errEl}
        </div>
      );
    }

    case "consent":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2.5 rounded-[14px] bg-bg p-4" style={{ border: error ? "2px solid var(--ax-danger)" : "1px solid var(--ax-line)" }}>
            <label htmlFor={fid} className="flex cursor-pointer items-start gap-3 text-[15px] leading-normal font-bold">
              <input
                id={fid}
                type="checkbox"
                checked={a.q39 === true}
                onChange={(e) => set("q39", e.target.checked)}
                aria-invalid={!!error}
                aria-describedby={[hintId, error ? errId : ""].filter(Boolean).join(" ")}
                className="m-0 mt-px h-[22px] w-[22px] shrink-0"
              />
              <span>
                {f.n}. {CONSENT_LABEL}
                {req}
              </span>
            </label>
            <span id={hintId} className="pl-[34px] text-sm leading-normal text-muted">
              {CONSENT_NOTE}
            </span>
          </div>
          {errEl}
        </div>
      );

    default:
      return null;
  }
}
