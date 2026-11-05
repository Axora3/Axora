"use client";

import { useRef, useState } from "react";
import { PaymentInstructions } from "@/components/order/PaymentInstructions";
import { Check, Close } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ErrorBox, FieldError, TestModeNotice } from "@/components/ui/Notice";
import { useDialog } from "@/components/ui/use-dialog";
import { useMediaQuery } from "@/components/ui/use-media-query";
import { newIdempotencyKey, postJson } from "@/lib/client/submit";
import type { SiteContent } from "@/lib/content/schema";
import { contactError, optionalContactError } from "@/lib/requests/validation";
import { SUCCESS_TEXT } from "@/lib/site";

type Props = { slug: string; title: string; category: string; priceLabel: string; tint: string; isDemo: boolean; backendEnabled: boolean; isFree: boolean; bank: SiteContent["bank"] };
type Phase = "closed" | "form" | "done";

const input = "ax-control min-h-13 px-3.5 text-base";

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
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [messenger, setMessenger] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState<{ message: string; conflict: boolean } | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const [payOpen, setPayOpen] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const keyRef = useRef<string | null>(null);
  const startedAt = useRef<number>(0);
  const honeypot = useRef<HTMLInputElement>(null);

  const closeSheet = () => setSheet(false);
  const buyLabel = p.isFree ? "Авах хүсэлт гаргах" : "Худалдаж авах";
  // A paid template goes straight to its payment window once the request is stored.
  const finish = (ref: string | null) => {
    setReference(ref);
    setPhase("done");
    if (!p.isFree) {
      setSheet(false);
      setPayOpen(true);
    }
  };
  const sheetRef = useDialog<HTMLDivElement>(sheet && !desktop, closeSheet);

  function open() {
    if (!keyRef.current) keyRef.current = newIdempotencyKey();
    if (!startedAt.current) startedAt.current = Date.now();
    setPhase((x) => (x === "done" ? "done" : "form"));
    if (!desktop) setSheet(true);
    else setTimeout(() => document.getElementById("rq-name")?.focus(), 40);
  }

  const nameErr = tried && !name.trim() ? "Нэрээ оруулна уу." : "";
  const emailErrText = contactError("email", email);
  const phoneErrText = optionalContactError("phone", phone);
  const messengerErrText = optionalContactError("messenger", messenger);
  const emailErr = tried ? emailErrText : "";
  const phoneErr = tried ? phoneErrText : "";
  const messengerErr = tried ? messengerErrText : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setServerErr(null);
    const bad = !name.trim() ? "rq-name" : emailErrText ? "rq-email" : phoneErrText ? "rq-phone" : messengerErrText ? "rq-messenger" : null;
    if (bad) {
      setTimeout(() => document.getElementById(bad)?.focus(), 30);
      return;
    }
    if (!p.backendEnabled) {
      setSaved(false);
      finish(null);
      return;
    }
    setBusy(true);
    const res = await postJson<{ ok: true; status: string; reference: string | null }>("/api/template-requests", {
      idempotencyKey: keyRef.current,
      slug: p.slug,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      messenger: messenger.trim(),
      note: note.trim(),
      meta: { website: honeypot.current?.value ?? "", startedAt: startedAt.current },
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      finish(res.reference);
      return;
    }
    setServerErr({ message: res.message, conflict: res.code === "conflict" });
    if (res.code === "validation") setTimeout(() => document.getElementById("rq-email")?.focus(), 30);
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
        <p className="text-[13px] leading-normal text-muted">{p.isFree ? "Хүсэлт илгээснээр файл татах эрх автоматаар үүсэхгүй. Бид тантай холбогдож дараагийн алхмыг тохирно." : "Мэдээллээ илгээсний дараа төлбөрийн мэдээлэл гарна. Төлбөр баталгаажмагц татах холбоос имэйлээр очно."}</p>
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
        />
        {nameErr && <FieldError id="rq-name-e">{nameErr}</FieldError>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rq-email" className="text-sm font-bold">
          Имэйл хаяг<span aria-hidden="true" className="text-danger"> *</span>
          <span className="sr-only"> (заавал)</span>
        </label>
        <input id="rq-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailErr} aria-describedby={emailErr ? "rq-email-e" : "rq-email-h"} className={input} />
        {emailErr ? <FieldError id="rq-email-e">{emailErr}</FieldError> : !p.isFree && <span id="rq-email-h" className="text-[13px] leading-normal text-muted">Төлбөр баталгаажмагц татах холбоос энэ хаягаар очно.</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rq-phone" className="text-sm font-bold">
          Утасны дугаар <span className="font-semibold text-muted">(заавал биш)</span>
        </label>
        <input id="rq-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!phoneErr} aria-describedby={phoneErr ? "rq-phone-e" : undefined} className={input} />
        {phoneErr && <FieldError id="rq-phone-e">{phoneErr}</FieldError>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rq-messenger" className="text-sm font-bold">
          Messenger нэр эсвэл холбоос <span className="font-semibold text-muted">(заавал биш)</span>
        </label>
        <input id="rq-messenger" type="text" maxLength={200} value={messenger} onChange={(e) => setMessenger(e.target.value)} aria-invalid={!!messengerErr} aria-describedby={messengerErr ? "rq-messenger-e" : undefined} className={input} />
        {messengerErr && <FieldError id="rq-messenger-e">{messengerErr}</FieldError>}
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
          className="ax-control resize-y px-3.5 py-3 text-base"
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
          className="ax-btn ax-primary min-h-13 flex-1 rounded-control border-0 bg-primary px-[22px] text-base font-bold text-on-primary"
        >
          {busy ? "Илгээж байна…" : serverErr ? "Дахин илгээх" : !p.isFree ? "Төлбөр рүү үргэлжлүүлэх" : p.backendEnabled ? "Хүсэлт илгээх" : "Хүсэлт шалгах"}
        </button>
        {desktop && (
          <button
            type="button"
            onClick={() => setPhase("closed")}
            className="ax-btn ax-ghost min-h-13 rounded-control border border-line-strong bg-surface px-[18px] text-[15px] font-bold text-ink"
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
      {!p.isFree && (
        <button type="button" onClick={() => setPayOpen(true)} className="ax-btn ax-primary min-h-13 w-full rounded-control border-0 bg-primary text-[15px] font-bold text-on-primary">
          Төлбөрийн мэдээлэл харах
        </button>
      )}
      <div className="flex w-full gap-2">
        {!saved && (
          <button type="button" onClick={() => setPhase("form")} className="ax-btn ax-ghost min-h-13 flex-1 rounded-control border border-line-strong bg-surface text-[15px] font-bold text-ink">
            Засах
          </button>
        )}
        {!desktop && (
          <button type="button" onClick={closeSheet} className="ax-btn ax-primary min-h-13 flex-1 rounded-control border-0 bg-primary text-[15px] font-bold text-on-primary">
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
            <button type="button" onClick={open} className="ax-btn ax-primary min-h-13 w-full rounded-xl border-0 bg-primary text-base font-bold text-on-primary">
              {buyLabel}
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
            <button type="button" onClick={open} className="ax-btn ax-primary min-h-13 flex-1 rounded-control border-0 bg-primary text-base font-bold text-on-primary">
              {buyLabel}
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
                <span aria-hidden="true" className="mx-auto block h-[5px] w-10 rounded-inner bg-line-mid" />
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
                <div className="flex items-center gap-3 rounded-control bg-sunken p-2.5">
                  <span className="h-11 w-11 shrink-0 rounded-control border border-line" style={{ background: p.tint }} />
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

      <BottomSheet
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Төлбөр төлөх"
        description={p.title}
        footer={<button type="button" onClick={() => setPayOpen(false)} className="ax-btn ax-primary min-h-13 w-full rounded-control border-0 bg-primary text-base font-bold text-on-primary">Болсон</button>}
      >
        <div className="flex flex-col gap-4">
          {!saved && <TestModeNotice>Туршилтын горим — хүсэлт хадгалагдаагүй, төлбөр авахгүй.</TestModeNotice>}
          <div className="flex items-center justify-between gap-3 rounded-control bg-soft px-4 py-3.5">
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-extrabold">Төлөх дүн</span>
              {p.isDemo && <span className="text-xs font-bold text-warn">Жишээ үнэ</span>}
            </span>
            <strong className="text-[26px] leading-none font-extrabold tabular-nums">{p.priceLabel}</strong>
          </div>
          <PaymentInstructions bank={p.bank} reference={reference} />
          <p className="m-0 text-[13px] leading-normal text-muted">Гүйлгээний утгад дугаараа бичнэ үү. Төлбөрийг бид шалгаж баталгаажуулмагц татах холбоос {email.trim()} хаягт очно.</p>
        </div>
      </BottomSheet>
    </>
  );
}
