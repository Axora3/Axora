"use client";

import { useRef, useState } from "react";
import { Check, Close } from "@/components/icons";
import { ErrorBox, FieldError, TestModeNotice } from "@/components/ui/Notice";
import { useDialog } from "@/components/ui/use-dialog";
import { useMediaQuery } from "@/components/ui/use-media-query";
import { newIdempotencyKey, postJson } from "@/lib/client/submit";
import { CHANNELS, contactError, type Channel } from "@/lib/requests/validation";
import { SUCCESS_TEXT } from "@/lib/site";

type Props = { slug: string; title: string; category: string; priceLabel: string; tint: string; isDemo: boolean; backendEnabled: boolean };
type Phase = "closed" | "form" | "done";

const input = "min-h-[50px] w-full rounded-xl px-3.5 text-base text-ink bg-sunken";

/**
 * “Авах хүсэлт гаргах”. Desktop: inline under the product info.
 * Mobile: sticky bottom bar that opens a bottom sheet, as in the design.
 * Sending a request stores it — it never grants a download or a payment.
 */
export function TemplateRequest(p: Props) {
  const desktop = useMediaQuery("(min-width: 900px)", true);
  const [phase, setPhase] = useState<Phase>("closed");
  const [sheet, setSheet] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Channel>("phone");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState<{ message: string; conflict: boolean } | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const keyRef = useRef<string | null>(null);
  const startedAt = useRef<number>(0);
  const honeypot = useRef<HTMLInputElement>(null);

  const closeSheet = () => setSheet(false);
  const sheetRef = useDialog<HTMLDivElement>(sheet && !desktop, closeSheet);

  function open() {
    if (!keyRef.current) keyRef.current = newIdempotencyKey();
    if (!startedAt.current) startedAt.current = Date.now();
    setPhase((x) => (x === "done" ? "done" : "form"));
    if (!desktop) setSheet(true);
    else setTimeout(() => document.getElementById("rq-name")?.focus(), 40);
  }

  const nameErr = tried && !name.trim() ? "Нэрээ оруулна уу." : "";
  const cErrText = contactError(channel, contact);
  const cErr = tried ? cErrText : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setServerErr(null);
    const bad = !name.trim() ? "rq-name" : cErrText ? "rq-contact" : null;
    if (bad) {
      setTimeout(() => document.getElementById(bad)?.focus(), 30);
      return;
    }
    if (!p.backendEnabled) {
      setSaved(false);
      setPhase("done");
      return;
    }
    setBusy(true);
    const res = await postJson<{ ok: true; status: string }>("/api/template-requests", {
      idempotencyKey: keyRef.current,
      slug: p.slug,
      name: name.trim(),
      channel,
      contact: contact.trim(),
      note: note.trim(),
      meta: { website: honeypot.current?.value ?? "", startedAt: startedAt.current },
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      setPhase("done");
      return;
    }
    setServerErr({ message: res.message, conflict: res.code === "conflict" });
    if (res.code === "validation") setTimeout(() => document.getElementById("rq-contact")?.focus(), 30);
  }

  function newRequest() {
    keyRef.current = newIdempotencyKey();
    startedAt.current = Date.now();
    setServerErr(null);
    setTried(false);
    setPhase("form");
  }

  const form = (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3.5" aria-busy={busy}>
      {!p.backendEnabled && <TestModeNotice>Туршилтын горим — хүсэлт илгээгдэхгүй. Төлбөр, файл татах эрх энд үүсэхгүй.</TestModeNotice>}
      {p.backendEnabled && (
        <p className="text-[13px] leading-normal text-muted">Хүсэлт илгээснээр төлбөр эсвэл файл татах эрх автоматаар үүсэхгүй. Бид тантай холбогдож дараагийн алхмыг тохирно.</p>
      )}
      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rq-name" className="text-sm font-bold">
          Таны нэр<span aria-hidden="true" className="text-danger"> *</span>
          <span className="sr-only"> (заавал)</span>
        </label>
        <input
          id="rq-name"
          data-autofocus
          type="text"
          autoComplete="name"
          enterKeyHint="next"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!nameErr}
          aria-describedby={nameErr ? "rq-name-e" : undefined}
          className={input}
          style={{ border: nameErr ? "2px solid var(--ax-danger)" : "1px solid var(--ax-line-strong)" }}
        />
        {nameErr && <FieldError id="rq-name-e">{nameErr}</FieldError>}
      </div>
      <fieldset className="ax-fs">
        <legend className="mb-2 p-0 text-sm font-bold">
          Холбогдох суваг<span aria-hidden="true" className="text-danger"> *</span>
        </legend>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(CHANNELS) as Channel[]).map((k) => {
            const on = channel === k;
            return (
              <label
                key={k}
                className="flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 text-center text-sm font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand"
                style={{ border: on ? "2px solid var(--ax-brand)" : "1px solid var(--ax-line-strong)", background: on ? "var(--ax-soft)" : "var(--ax-surface)" }}
              >
                <input type="radio" name="rq-ch" checked={on} onChange={() => setChannel(k)} className="sr-only" />
                {CHANNELS[k].label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rq-contact" className="text-sm font-bold">
          {CHANNELS[channel].contactLabel}
          <span aria-hidden="true" className="text-danger"> *</span>
          <span className="sr-only"> (заавал)</span>
        </label>
        <input
          id="rq-contact"
          type={CHANNELS[channel].type}
          inputMode={CHANNELS[channel].mode}
          autoComplete={channel === "email" ? "email" : channel === "phone" ? "tel" : "off"}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          aria-invalid={!!cErr}
          aria-describedby={cErr ? "rq-contact-e" : undefined}
          className={input}
          style={{ border: cErr ? "2px solid var(--ax-danger)" : "1px solid var(--ax-line-strong)" }}
        />
        {cErr && <FieldError id="rq-contact-e">{cErr}</FieldError>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rq-note" className="text-sm font-bold">
          Нэмэлт тайлбар
        </label>
        <textarea
          id="rq-note"
          rows={3}
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full resize-y rounded-xl border border-line-strong bg-sunken px-3.5 py-3 text-base text-ink"
        />
      </div>
      {serverErr && (
        <ErrorBox>
          {serverErr.message}
          {serverErr.conflict && (
            <button type="button" onClick={newRequest} className="mt-2 block min-h-11 underline">
              Шинэ хүсэлт болгон илгээх
            </button>
          )}
        </ErrorBox>
      )}
      <div className="flex flex-wrap gap-2.5">
        <button
          type="submit"
          disabled={busy}
          className="ax-btn ax-primary min-h-[52px] flex-1 rounded-[13px] border-0 bg-primary px-[22px] text-base font-bold text-on-primary"
        >
          {busy ? "Илгээж байна…" : p.backendEnabled ? (serverErr ? "Дахин илгээх" : "Хүсэлт илгээх") : "Хүсэлт шалгах"}
        </button>
        {desktop && (
          <button
            type="button"
            onClick={() => setPhase("closed")}
            className="ax-btn ax-ghost min-h-[52px] rounded-[13px] border border-line-strong bg-surface px-[18px] text-[15px] font-bold text-ink"
          >
            Болих
          </button>
        )}
      </div>
    </form>
  );

  const done = (
    <div role="status" className="ax-in-sm flex flex-col items-start gap-3">
      <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${saved ? "bg-soft text-brand" : "bg-warn-bg text-warn"}`}>
        <Check size={26} strokeWidth={2.4} className="ax-draw" />
      </span>
      <strong className="text-lg">{saved ? "Хүсэлт илгээгдлээ" : "Туршилтын хүсэлт бөглөгдлөө"}</strong>
      <p className="text-[15px] leading-relaxed text-muted">
        {saved
          ? SUCCESS_TEXT
          : "Мэдээлэл илгээгдээгүй — backend холбогдоогүй үзүүлэн. Supabase холбогдсоны дараа хүсэлт бодитоор хадгалагдаж, бид таны сонгосон сувгаар холбогдоно."}
      </p>
      <div className="flex w-full gap-2">
        {!saved && (
          <button type="button" onClick={() => setPhase("form")} className="ax-btn ax-ghost min-h-[50px] flex-1 rounded-[13px] border border-line-strong bg-surface text-[15px] font-bold text-ink">
            Засах
          </button>
        )}
        {!desktop && (
          <button type="button" onClick={closeSheet} className="ax-btn ax-primary min-h-[50px] flex-1 rounded-[13px] border-0 bg-primary text-[15px] font-bold text-on-primary">
            Хаах
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop inline */}
      {desktop && (
        <div>
          {phase === "closed" && (
            <button type="button" onClick={open} className="ax-btn ax-primary min-h-[54px] w-full rounded-xl border-0 bg-primary text-base font-bold text-on-primary">
              Авах хүсэлт гаргах
            </button>
          )}
          {phase !== "closed" && <div className="ax-in-sm rounded-2xl border border-line bg-sunken p-[18px]">{phase === "form" ? form : done}</div>}
        </div>
      )}

      {/* Mobile sticky bar + sheet */}
      {!desktop && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3.5 border-t border-line bg-tabbar px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-[12px]">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted">{p.isDemo ? "Жишээ үнэ" : "Үнэ"}</span>
              <span className="text-[19px] font-extrabold">{p.priceLabel}</span>
            </div>
            <button type="button" onClick={open} className="ax-btn ax-primary min-h-[54px] flex-1 rounded-[14px] border-0 bg-primary text-base font-bold text-on-primary">
              Авах хүсэлт гаргах
            </button>
          </div>
          {sheet && (
            <div className="fixed inset-0 z-[60] flex flex-col justify-end">
              <div onClick={closeSheet} aria-hidden="true" className="absolute inset-0 bg-overlay [animation:axFade_.2s_ease_both]" />
              <div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="rq-sheet-t"
                className="relative flex max-h-[92dvh] flex-col gap-3.5 overflow-y-auto rounded-t-3xl bg-surface px-5 pt-2.5 pb-[calc(16px+env(safe-area-inset-bottom))] [animation:axSheet_.32s_cubic-bezier(.2,.8,.2,1)_both]"
              >
                <span aria-hidden="true" className="mx-auto block h-[5px] w-10 rounded-[5px] bg-line-mid" />
                <div className="flex items-center justify-between gap-3">
                  <h2 id="rq-sheet-t" className="text-xl font-extrabold">
                    Авах хүсэлт
                  </h2>
                  <button
                    type="button"
                    onClick={closeSheet}
                    aria-label="Хаах"
                    className="ax-btn inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink"
                  >
                    <Close size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-3 rounded-[14px] bg-sunken p-2.5">
                  <span className="h-11 w-11 shrink-0 rounded-[10px] border border-line" style={{ background: p.tint }} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <strong className="truncate text-sm">{p.title}</strong>
                    <span className="text-[13px] text-muted">
                      {p.category} · {p.priceLabel}
                    </span>
                  </span>
                </div>
                {phase === "done" ? done : form}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
