"use client";

import { useRef, useState } from "react";
import { Check } from "@/components/icons";
import { ErrorBox, FieldError, TestModeNotice } from "@/components/ui/Notice";
import { newIdempotencyKey, postJson } from "@/lib/client/submit";
import { phoneOrEmailError } from "@/lib/requests/validation";

const box = "w-full rounded-xl bg-sunken px-3.5 text-base text-ink";
const border = (bad: boolean) => ({ border: bad ? "2px solid var(--ax-danger)" : "1px solid var(--ax-line-strong)" });

export function ContactForm({ backendEnabled }: { backendEnabled: boolean }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [msg, setMsg] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "saved" | "test">(null);
  const [err, setErr] = useState<string | null>(null);
  // Created on first submit and reused for retries, so a resend never duplicates.
  const key = useRef("");
  const startedAt = useRef(0);
  const hp = useRef<HTMLInputElement>(null);

  const cErr = phoneOrEmailError(contact);
  const nE = tried && !name.trim();
  const cE = tried && !!cErr;
  const mE = tried && !msg.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setErr(null);
    const first = !name.trim() ? "ct-name" : cErr ? "ct-contact" : !msg.trim() ? "ct-msg" : null;
    if (first) {
      setTimeout(() => document.getElementById(first)?.focus(), 30);
      return;
    }
    if (!backendEnabled) {
      setDone("test");
      return;
    }
    setBusy(true);
    key.current ||= newIdempotencyKey();
    const res = await postJson("/api/contact", {
      idempotencyKey: key.current,
      name: name.trim(),
      contact: contact.trim(),
      message: msg.trim(),
      meta: { website: hp.current?.value ?? "", startedAt: startedAt.current || Date.now() - 10000 },
    });
    setBusy(false);
    if (res.ok) setDone("saved");
    else setErr(res.message);
  }

  if (done) {
    return (
      <div role="status" className="ax-in-sm flex flex-col items-start gap-3">
        <span className={`inline-flex h-[52px] w-[52px] items-center justify-center rounded-[15px] ${done === "saved" ? "bg-soft text-brand" : "bg-warn-bg text-warn"}`}>
          <Check size={24} strokeWidth={2.4} className="ax-draw" />
        </span>
        <strong className="text-[17px]">{done === "saved" ? "Зурвас илгээгдлээ" : "Туршилтын зурвас бөглөгдлөө"}</strong>
        <p className="text-[15px] leading-[1.55] text-muted">
          {done === "saved" ? "Баярлалаа. Бид удахгүй таны үлдээсэн утас эсвэл имэйлээр холбогдоно." : "Зурвас илгээгдээгүй — backend холбогдоогүй үзүүлэн."}
        </p>
        {done === "test" && (
          <button type="button" onClick={() => setDone(null)} className="ax-btn ax-ghost min-h-12 rounded-xl border border-line-strong bg-surface px-[18px] text-[15px] font-bold text-ink">
            Засах
          </button>
        )}
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} onFocus={() => (startedAt.current ||= Date.now())} className="flex flex-col gap-3.5" aria-busy={busy}>
      {!backendEnabled && <TestModeNotice>Туршилтын горим — зурвас илгээгдэхгүй.</TestModeNotice>}
      <input ref={hp} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ct-name" className="text-sm font-bold">
          Нэр<span aria-hidden="true" className="text-danger"> *</span>
          <span className="sr-only"> (заавал)</span>
        </label>
        <input id="ct-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={nE} aria-describedby={nE ? "ct-name-e" : undefined} className={`min-h-[50px] ${box}`} style={border(nE)} />
        {nE && <FieldError id="ct-name-e">Нэрээ оруулна уу.</FieldError>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ct-contact" className="text-sm font-bold">
          Утас эсвэл имэйл<span aria-hidden="true" className="text-danger"> *</span>
          <span className="sr-only"> (заавал)</span>
        </label>
        <input id="ct-contact" type="text" autoComplete="email" value={contact} onChange={(e) => setContact(e.target.value)} aria-invalid={cE} aria-describedby={cE ? "ct-contact-e" : undefined} className={`min-h-[50px] ${box}`} style={border(cE)} />
        {cE && <FieldError id="ct-contact-e">{cErr}</FieldError>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ct-msg" className="text-sm font-bold">
          Зурвас<span aria-hidden="true" className="text-danger"> *</span>
          <span className="sr-only"> (заавал)</span>
        </label>
        <textarea id="ct-msg" rows={4} maxLength={3000} value={msg} onChange={(e) => setMsg(e.target.value)} aria-invalid={mE} aria-describedby={mE ? "ct-msg-e" : undefined} className={`resize-y py-3 ${box}`} style={border(mE)} />
        {mE && <FieldError id="ct-msg-e">Зурвасаа бичнэ үү.</FieldError>}
      </div>
      {err && <ErrorBox>{err}</ErrorBox>}
      <button type="submit" disabled={busy} className="ax-btn ax-primary min-h-[54px] rounded-[14px] border-0 bg-primary text-base font-bold text-on-primary">
        {busy ? "Илгээж байна…" : backendEnabled ? (err ? "Дахин илгээх" : "Илгээх") : "Илгээх (туршилт)"}
      </button>
    </form>
  );
}
