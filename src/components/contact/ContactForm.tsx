"use client";

import { useRef, useState } from "react";
import { Check } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, fieldDescribedBy } from "@/components/ui/input";
import { ErrorBox, TestModeNotice } from "@/components/ui/Notice";
import { newIdempotencyKey, postJson } from "@/lib/client/submit";
import { phoneOrEmailError } from "@/lib/requests/validation";

export function ContactForm({ backendEnabled, initialMessage = "" }: { backendEnabled: boolean; initialMessage?: string }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [msg, setMsg] = useState(initialMessage);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "saved" | "test">(null);
  const [err, setErr] = useState<string | null>(null);
  // Created on first submit and reused for retries, so a resend never duplicates.
  const key = useRef("");
  const startedAt = useRef(0);
  const hp = useRef<HTMLInputElement>(null);

  const cErr = phoneOrEmailError(contact);
  const nameError = tried && !name.trim() ? "Нэрээ оруулна уу." : "";
  const contactError = tried ? cErr : "";
  const messageError = tried && !msg.trim() ? "Зурвасаа бичнэ үү." : "";

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
        <span className={`inline-flex h-[52px] w-[52px] items-center justify-center rounded-control ${done === "saved" ? "bg-soft text-brand" : "bg-warn-bg text-warn"}`}>
          <Check size={24} strokeWidth={2.4} className="ax-draw" />
        </span>
        <strong className="text-[17px]">{done === "saved" ? "Зурвас илгээгдлээ" : "Туршилтын зурвас бөглөгдлөө"}</strong>
        <p className="text-[15px] leading-[1.55] text-muted">
          {done === "saved" ? "Баярлалаа. Бид удахгүй таны үлдээсэн утас эсвэл имэйлээр холбогдоно." : "Зурвас илгээгдээгүй — backend холбогдоогүй туршилтын горим."}
        </p>
        {done === "test" && <Button onClick={() => setDone(null)}>Засах</Button>}
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} onFocus={() => (startedAt.current ||= Date.now())} className="flex flex-col gap-4" aria-busy={busy}>
      {!backendEnabled && <TestModeNotice>Туршилтын горим — зурвас илгээгдэхгүй.</TestModeNotice>}
      <input ref={hp} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
      <Field htmlFor="ct-name" label="Нэр" required error={nameError}>
        <Input id="ct-name" autoComplete="name" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} aria-required="true" aria-invalid={!!nameError} aria-describedby={fieldDescribedBy("ct-name", { error: nameError })} />
      </Field>
      <Field htmlFor="ct-contact" label="Утас эсвэл имэйл" required error={contactError}>
        <Input id="ct-contact" autoComplete="email" maxLength={200} value={contact} onChange={(e) => setContact(e.target.value)} aria-required="true" aria-invalid={!!contactError} aria-describedby={fieldDescribedBy("ct-contact", { error: contactError })} />
      </Field>
      <Field htmlFor="ct-msg" label="Зурвас" required error={messageError}>
        <Textarea id="ct-msg" rows={5} maxLength={3000} value={msg} onChange={(e) => setMsg(e.target.value)} aria-required="true" aria-invalid={!!messageError} aria-describedby={fieldDescribedBy("ct-msg", { error: messageError })} />
      </Field>
      {err && <ErrorBox>{err}</ErrorBox>}
      <Button type="submit" variant="primary" size="lg" loading={busy} className="w-full">
        {busy ? "Илгээж байна…" : backendEnabled ? (err ? "Дахин илгээх" : "Зурвас илгээх") : "Илгээх (туршилт)"}
      </Button>
    </form>
  );
}
