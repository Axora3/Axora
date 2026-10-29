"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { publishContentAction, saveContentDraftAction } from "@/app/admin/content-actions";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { CTA_TARGETS, type SiteContent } from "@/lib/content/schema";
import { btn, field } from "./ui";

type Props = { initial: SiteContent; published: SiteContent | null; updatedAt: string; publishedAt: string | null };

export function ContentEditor(p: Props) {
  const router = useRouter();
  const [c, setC] = useState<SiteContent>(p.initial);
  const [saved, setSaved] = useState(JSON.stringify(p.initial));
  const [expected, setExpected] = useState(p.updatedAt);
  const [publishedAt, setPublishedAt] = useState(p.publishedAt);
  const [isLive, setIsLive] = useState(!!p.published && JSON.stringify(p.published) === JSON.stringify(p.initial));
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string; conflict?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(c) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = (patch: Partial<SiteContent>) => setC((x) => ({ ...x, ...patch }));

  function run(kind: "draft" | "publish") {
    setMsg(null);
    start(async () => {
      const r = kind === "draft" ? await saveContentDraftAction(expected, c) : await publishContentAction(expected, c);
      if (!r.ok) return setMsg({ kind: "err", text: r.message, conflict: r.code === "conflict" });
      setSaved(JSON.stringify(c));
      setExpected(r.updatedAt);
      if (kind === "publish") {
        setPublishedAt(r.publishedAt ?? null);
        setIsLive(true);
        setMsg({ kind: "ok", text: "Нийтлэгдлээ. Сайт шинэ агуулгаар харагдана." });
      } else {
        setIsLive(false);
        setMsg({ kind: "ok", text: "Ноорог хадгалагдлаа. Сайт өөрчлөгдөөгүй — нийтлэх хүртэл хуучин агуулга харагдана." });
      }
    });
  }

  const box = "flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-[18px]";
  const T = ({ label, value, onChange, max, rows }: { label: string; value: string; onChange: (v: string) => void; max: number; rows?: number }) => (
    <label className="flex flex-col gap-1.5">
      <span className={field.label}>{label}</span>
      {rows ? (
        <textarea rows={rows} maxLength={max} className={field.textarea} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input maxLength={max} className={field.input} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
  const Cta = ({ label, k }: { label: string; k: "heroPrimary" | "heroSecondary" }) => (
    <fieldset className="ax-fs grid gap-3 min-[600px]:grid-cols-2">
      <legend className={`${field.label} mb-1.5`}>{label}</legend>
      {T({ label: "Текст", value: c[k].label, max: 30, onChange: (v) => set({ [k]: { ...c[k], label: v } }) })}
      <label className="flex flex-col gap-1.5">
        <span className={field.label}>Холбоос</span>
        <select className={field.input} value={c[k].href} onChange={(e) => set({ [k]: { ...c[k], href: e.target.value } })}>
          {CTA_TARGETS.map(([h, l]) => (
            <option key={h} value={h}>
              {l} ({h})
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
  const moveFaq = (i: number, d: -1 | 1) => {
    const a = [...c.faq];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    set({ faq: a });
  };

  return (
    <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        {preview ? (
          <section aria-label="Нооргийн preview" className="overflow-hidden rounded-[18px] border-2 border-dashed border-brand bg-sunken">
            <p className="bg-primary px-4 py-2 text-sm font-bold text-on-primary">Preview — зөвхөн танд харагдаж байна, нийтлэгдээгүй.</p>
            <div className="pointer-events-none" aria-hidden="true">
              <Hero c={c} />
            </div>
            <div className="px-6 pb-8">
              <h2 className="mb-3 text-2xl font-extrabold">Түгээмэл асуулт</h2>
              <Faq items={c.faq} />
              <p className="mt-6 text-sm text-muted">
                Footer: {c.footerText} · {c.contact.phone} · {c.contact.email}
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className={box} aria-labelledby="c-hero">
              <h2 id="c-hero" className="text-[17px] font-extrabold">Нүүрний гарчиг</h2>
              <div className="grid gap-3 min-[600px]:grid-cols-[2fr_1fr]">
                {T({ label: "Гарчиг", value: c.heroTitle, max: 80, onChange: (v) => set({ heroTitle: v }) })}
                {T({ label: "Онцлох үг (налуу, тодруулсан)", value: c.heroAccent, max: 40, onChange: (v) => set({ heroAccent: v }) })}
              </div>
              {T({ label: "Тайлбар", value: c.heroLead, max: 240, rows: 2, onChange: (v) => set({ heroLead: v }) })}
              {Cta({ label: "Үндсэн товч", k: "heroPrimary" })}
              {Cta({ label: "Хоёрдогч товч", k: "heroSecondary" })}
            </section>

            <section className={box} aria-labelledby="c-contact">
              <h2 id="c-contact" className="text-[17px] font-extrabold">Холбоо барих</h2>
              <div className="grid gap-3 min-[600px]:grid-cols-2">
                {T({ label: "Утас", value: c.contact.phone, max: 40, onChange: (v) => set({ contact: { ...c.contact, phone: v } }) })}
                {T({ label: "Имэйл", value: c.contact.email, max: 120, onChange: (v) => set({ contact: { ...c.contact, email: v } }) })}
                {T({ label: "Messenger / Facebook", value: c.contact.messenger, max: 120, onChange: (v) => set({ contact: { ...c.contact, messenger: v } }) })}
                {T({ label: "Ажиллах цаг", value: c.contact.hours, max: 120, onChange: (v) => set({ contact: { ...c.contact, hours: v } }) })}
              </div>
              <fieldset className="ax-fs flex flex-col gap-2">
                <legend className={`${field.label} mb-1`}>Сошиал холбоос (4 хүртэл, https://)</legend>
                {c.social.map((s, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-2">
                    <label className="flex flex-[1_1_120px] flex-col gap-1">
                      <span className="text-xs font-bold text-muted">Нэр</span>
                      <input className={field.input} maxLength={30} value={s.label} onChange={(e) => set({ social: c.social.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                    </label>
                    <label className="flex flex-[3_1_220px] flex-col gap-1">
                      <span className="text-xs font-bold text-muted">URL</span>
                      <input type="url" className={field.input} value={s.url} onChange={(e) => set({ social: c.social.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
                    </label>
                    <button type="button" className={btn.danger} onClick={() => set({ social: c.social.filter((_, j) => j !== i) })}>
                      Хасах
                    </button>
                  </div>
                ))}
                {c.social.length < 4 && (
                  <button type="button" className={`${btn.ghost} self-start`} onClick={() => set({ social: [...c.social, { label: "Facebook", url: "https://" }] })}>
                    + Холбоос нэмэх
                  </button>
                )}
              </fieldset>
              {T({ label: "Footer-ийн товч текст", value: c.footerText, max: 200, onChange: (v) => set({ footerText: v }) })}
            </section>

            <section className={box} aria-labelledby="c-faq">
              <h2 id="c-faq" className="text-[17px] font-extrabold">Түгээмэл асуулт</h2>
              {c.faq.map((q, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl border border-line bg-sunken p-3">
                  {T({ label: `${i + 1}. Асуулт`, value: q.q, max: 200, onChange: (v) => set({ faq: c.faq.map((x, j) => (j === i ? { ...x, q: v } : x)) }) })}
                  {T({ label: "Хариулт", value: q.a, max: 1200, rows: 3, onChange: (v) => set({ faq: c.faq.map((x, j) => (j === i ? { ...x, a: v } : x)) }) })}
                  <span className="flex flex-wrap gap-2">
                    <button type="button" className={btn.ghost} disabled={i === 0} onClick={() => moveFaq(i, -1)} aria-label={`${i + 1}-р асуултыг дээш`}>
                      ↑ Дээш
                    </button>
                    <button type="button" className={btn.ghost} disabled={i === c.faq.length - 1} onClick={() => moveFaq(i, 1)} aria-label={`${i + 1}-р асуултыг доош`}>
                      ↓ Доош
                    </button>
                    <button type="button" className={btn.danger} disabled={c.faq.length <= 1} onClick={() => set({ faq: c.faq.filter((_, j) => j !== i) })}>
                      Устгах
                    </button>
                  </span>
                </div>
              ))}
              {c.faq.length < 12 && (
                <button type="button" className={`${btn.ghost} self-start`} onClick={() => set({ faq: [...c.faq, { q: "", a: "" }] })}>
                  + Асуулт нэмэх
                </button>
              )}
            </section>
          </>
        )}
      </div>

      <aside className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-[18px] min-[1100px]:sticky min-[1100px]:top-4" aria-label="Нийтлэх">
        <h2 className="text-[17px] font-extrabold">Төлөв</h2>
        <p className="text-sm">
          {isLive && !dirty ? "Сайт дээрх агуулгатай ижил." : "Ноорог сайтаас ялгаатай — нийтлэх хүртэл сайт өөрчлөгдөхгүй."}
        </p>
        <p className={field.hint}>Сүүлд нийтэлсэн: {publishedAt ? new Date(publishedAt).toLocaleString("mn-MN") : "хараахан нийтлээгүй (анхны текст харагдаж байна)"}</p>
        {dirty && <p className="rounded-[10px] bg-warn-bg px-3 py-2 text-[13px] font-bold text-warn-ink">Хадгалаагүй өөрчлөлт байна.</p>}
        {msg && (
          <div role={msg.kind === "err" ? "alert" : "status"} className={`rounded-[10px] px-3 py-2.5 text-sm font-bold ${msg.kind === "ok" ? "bg-soft text-brand" : "border border-danger-line bg-danger-bg text-danger-ink"}`}>
            {msg.text}
            {msg.conflict && (
              <button type="button" onClick={() => router.refresh()} className="mt-1 block min-h-11 underline">
                Хуудсыг шинэчлэх
              </button>
            )}
          </div>
        )}
        <button type="button" className={btn.ghost} onClick={() => setPreview((x) => !x)} aria-pressed={preview}>
          {preview ? "Засвар руу буцах" : "Preview"}
        </button>
        <button type="button" className={btn.ghost} disabled={pending} onClick={() => run("draft")}>
          {pending ? "Хадгалж байна…" : "Ноорог хадгалах"}
        </button>
        <button type="button" className={btn.primary} disabled={pending} onClick={() => run("publish")}>
          Нийтлэх
        </button>
      </aside>
    </div>
  );
}
