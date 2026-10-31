"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ErrorBox, FieldError, TestModeNotice } from "@/components/ui/Notice";
import { browserAuthClient } from "@/lib/admin/browser-auth";

const REASONS: Record<string, string> = {
  signin: "Үргэлжлүүлэхийн тулд нэвтэрнэ үү. Сесс дууссан байж магадгүй.",
  signedout: "Та системээс гарлаа.",
};

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const reason = REASONS[useSearchParams().get("reason") ?? ""];
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const emailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const eE = tried && emailBad;
  const pE = tried && !pass;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setErr("");
    if (emailBad || !pass) {
      document.getElementById(emailBad ? "lg-email" : "lg-pass")?.focus();
      return;
    }
    const sb = browserAuthClient();
    if (!sb) return;
    setBusy(true);
    try {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error) {
        // Same message for wrong email or password — no account enumeration.
        setErr(error.status === 429 ? "Хэт олон оролдлого хийлээ. Хэсэг хүлээгээд дахин оролдоно уу." : error.status === 0 || (error.status ?? 0) >= 500 ? "Нэвтрэх үйлчилгээтэй холбогдож чадсангүй. Дахин оролдоно уу." : "Имэйл эсвэл нууц үг буруу байна.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setErr("Нэвтрэх үйлчилгээтэй холбогдож чадсангүй. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-[20px] border border-line bg-surface p-6">
        <TestModeNotice>Supabase Auth холбогдоогүй тул нэвтрэх боломжгүй. README-ийн “Админ тохируулах” хэсгийг үзнэ үү.</TestModeNotice>
      </div>
    );
  }

  const border = (bad: boolean) => ({ border: bad ? "2px solid var(--ax-danger)" : "1px solid var(--ax-line-strong)" });
  return (
    <form noValidate onSubmit={submit} className="ax-in-sm flex flex-col gap-4 min-[861px]:rounded-[20px] min-[861px]:border min-[861px]:border-line min-[861px]:bg-surface min-[861px]:p-6 min-[861px]:shadow-[0_30px_60px_-44px_var(--ax-shadow)]">
      {reason && !err && <p role="status" className="rounded-[10px] bg-soft px-3 py-2.5 text-sm font-semibold text-brand">{reason}</p>}
      {err && <ErrorBox>{err}</ErrorBox>}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lg-email" className="text-sm font-bold">
          Имэйл
        </label>
        <input
          id="lg-email"
          type="email"
          autoComplete="username"
          inputMode="email"
          enterKeyHint="next"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={eE}
          aria-describedby={eE ? "lg-email-e" : undefined}
          className="min-h-[54px] rounded-[14px] bg-surface px-4 text-base text-ink"
          style={border(eE)}
        />
        {eE && <FieldError id="lg-email-e">Имэйл хаягаа зөв оруулна уу.</FieldError>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lg-pass" className="text-sm font-bold">
          Нууц үг
        </label>
        <div className="relative flex">
          <input
            id="lg-pass"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            enterKeyHint="go"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            aria-invalid={pE}
            aria-describedby={pE ? "lg-pass-e" : undefined}
            className="min-h-[54px] flex-1 rounded-[14px] bg-surface py-0 pr-[100px] pl-4 text-base text-ink"
            style={border(pE)}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
            className="absolute top-[3px] right-1 inline-flex h-11 items-center rounded-[10px] border-0 bg-transparent px-3 text-[13px] font-bold text-muted"
          >
            {show ? "Нуух" : "Харуулах"}
          </button>
        </div>
        {pE && <FieldError id="lg-pass-e">Нууц үгээ оруулна уу.</FieldError>}
      </div>
      <button type="submit" disabled={busy} className="ax-btn ax-primary flex min-h-[56px] items-center justify-center gap-2.5 rounded-[15px] border-0 bg-primary text-base font-bold text-on-primary">
        {busy ? "Шалгаж байна…" : "Нэвтрэх"}
      </button>
    </form>
  );
}
