"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBuilder } from "@/components/builder/BuilderProvider";
import { ArrowLeft, ArrowRight, Check, Download, Info, Refresh } from "@/components/icons";
import { ErrorBox } from "@/components/ui/Notice";
import { STYLES, TYPES, type BuilderConfig } from "@/lib/builder/config";
import { newIdempotencyKey, postJson, type ApiError } from "@/lib/client/submit";
import { precheckFile } from "@/lib/order/attachments";
import {
  ALL_FIELDS,
  FILE_FIELDS,
  STEPS,
  checkField,
  contactExtraLabel,
  formatAnswer,
  isVisible,
  stepErrors,
  type AnswerValue,
  type Answers,
  type Field,
  type FileFieldId,
} from "@/lib/order/questions";
import type { BuilderSnapshot, OrderResponse } from "@/lib/order/schema";
import { SUCCESS_TEXT } from "@/lib/site";
import { FieldRenderer } from "./FieldRenderer";
import { FileField } from "./FileField";
import { uploadOne, type LocalFile, type OrderReceipt } from "./uploads";

const SESSION_KEY = "axora-order-session-v1";
const LOCAL_KEY = "axora-order-draft-v1";
const REVIEW = 7;

type Phase = "form" | "submitting" | "partial" | "done" | "test-done";

type Draft = {
  v: 1;
  answers: Answers;
  step: number;
  maxStep: number;
  showLinks: boolean;
  idemKey: string;
  builderSig: string;
  fileNames: string[];
};

const emptyAnswers = (): Answers => ({ q13: [], q23: [], q28: [], q29: [], q30: [] });

function builderSig(c: BuilderConfig): string {
  return JSON.stringify([c.type, c.style, c.palette, c.colors, c.name, c.headline, c.desc, c.cta]);
}

function snapshot(c: BuilderConfig): BuilderSnapshot {
  return { v: 1, type: c.type, style: c.style, palette: c.palette, colors: c.colors, name: c.name, headline: c.headline, desc: c.desc, cta: c.cta };
}

function readDraft(storage: Storage, key: string): Draft | null {
  try {
    const d = JSON.parse(storage.getItem(key) ?? "null");
    if (d && d.v === 1 && d.answers && typeof d.answers === "object") return d as Draft;
  } catch {
    /* ignore */
  }
  return null;
}

function focusLater(id: string) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, 60);
}

function focusIdFor(f: Field, a: Answers): string {
  if (f.kind === "radio" || f.kind === "multi") {
    const v = a[f.id];
    const other = v === "Бусад" || (Array.isArray(v) && v.includes("Бусад"));
    if (other && !String(a[f.id + "o"] ?? "").trim()) return `f-${f.id}o`;
    return `f-${f.id}-0`;
  }
  if (f.kind === "file") return `f-${f.id}d`;
  return `f-${f.id}`;
}

export function OrderForm({ backendEnabled }: { backendEnabled: boolean }) {
  const builder = useBuilder();
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [tried, setTried] = useState<Record<number, boolean>>({});
  const [showLinks, setShowLinks] = useState(false);
  const [domainHelp, setDomainHelp] = useState(false);
  const [fromReview, setFromReview] = useState(false);
  const [anim, setAnim] = useState(0);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [fileErr, setFileErr] = useState<Partial<Record<FileFieldId, string>>>({});
  const [saveDraft, setSaveDraft] = useState(false);
  const [storedDraft, setStoredDraft] = useState<Draft | null>(null);
  const [lostFiles, setLostFiles] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("form");
  const [serverErr, setServerErr] = useState<ApiError | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [usedBuilder, setUsedBuilder] = useState<BuilderConfig | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const idemKey = useRef<string>("");
  const appliedSig = useRef<string>("");
  const startedAt = useRef<number>(0);
  const honeypot = useRef<HTMLInputElement>(null);

  /* ---------- Restore (tab session first; device draft only on request) ---------- */
  useEffect(() => {
    startedAt.current = Date.now();
    const s = readDraft(sessionStorage, SESSION_KEY);
    if (s) {
      /* eslint-disable react-hooks/set-state-in-effect -- one-time restore from storage after mount */
      setAnswers({ ...emptyAnswers(), ...s.answers });
      setStep(Math.min(s.step, REVIEW));
      setMaxStep(Math.min(s.maxStep, REVIEW));
      setShowLinks(s.showLinks);
      idemKey.current = s.idemKey;
      appliedSig.current = s.builderSig;
      if (s.fileNames.length) setLostFiles(s.fileNames);
    } else {
      idemKey.current = newIdempotencyKey();
    }
    try {
      const local = readDraft(localStorage, LOCAL_KEY);
      if (local) {
        if (s) setSaveDraft(true);
        else setStoredDraft(local);
      }
    } catch {
      /* storage blocked */
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  /* ---------- Pull in live-builder settings when they changed ---------- */
  useEffect(() => {
    if (!hydrated || !builder.ready) return;
    const c = builder.config;
    if (!c.touched) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors external builder state
    setUsedBuilder(c);
    const sig = builderSig(c);
    if (sig === appliedSig.current) return;
    appliedSig.current = sig;
    setAnswers((a) => ({
      ...a,
      q12: TYPES[c.type].orderType,
      q19: STYLES[c.style].orderStyle,
      q17: c.colors.primary,
      q17u: false,
      q18: c.colors.secondary,
      q2: typeof a.q2 === "string" && a.q2.trim() ? a.q2 : c.name,
      q24: typeof a.q24 === "string" && a.q24.trim() ? a.q24 : c.headline,
    }));
  }, [hydrated, builder.ready, builder.config]);

  /* ---------- Auto-save: tab session always, device only if the visitor opted in ---------- */
  const fileNames = useMemo(() => files.map((f) => f.name), [files]);
  const buildDraft = useCallback(
    (): Draft => ({ v: 1, answers, step, maxStep, showLinks, idemKey: idemKey.current, builderSig: appliedSig.current, fileNames }),
    [answers, step, maxStep, showLinks, fileNames],
  );
  useEffect(() => {
    if (!hydrated || phase === "done" || phase === "partial") return;
    const d = buildDraft();
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(d));
      if (saveDraft) localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...d, fileNames: [] }));
    } catch {
      /* quota or blocked — the form keeps working from memory */
    }
  }, [buildDraft, saveDraft, hydrated, phase]);

  const set = useCallback((id: string, v: AnswerValue) => setAnswers((a) => ({ ...a, [id]: v })), []);
  const ui = { showLinks, domainHelp };
  const linksOpen = showLinks || ["q6", "q7", "q8"].some((k) => typeof answers[k] === "string" && (answers[k] as string).trim() !== "");
  const inForm = step < REVIEW;
  const errs = inForm && tried[step] ? stepErrors(step, answers, ui) : [];
  const errMap = Object.fromEntries(errs.map((e) => [e.field.id, e.message]));

  function go(n: number, opts: { fromReview?: boolean } = {}) {
    setStep(n);
    setMaxStep((m) => Math.max(m, n));
    setFromReview(!!opts.fromReview);
    setAnim((x) => x + 1);
    setServerErr(null);
    focusLater("ox-step-title");
  }

  function validateStep(i: number): boolean {
    const list = stepErrors(i, answers, ui);
    setTried((t) => ({ ...t, [i]: true }));
    if (list.length) {
      focusLater(focusIdFor(list[0].field, answers));
      return false;
    }
    return true;
  }

  function onNext(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep(step)) return;
    if (fromReview || step === 6) go(REVIEW);
    else go(step + 1);
  }

  /* ---------- Files ---------- */
  function addFiles(field: FileFieldId, list: FileList | null) {
    if (!list) return;
    const mine = files.filter((f) => f.field === field);
    const errors: string[] = [];
    const added: LocalFile[] = [];
    Array.from(list).forEach((file) => {
      const problem = precheckFile(file, mine.length + added.length);
      if (problem) errors.push(problem);
      else added.push({ ref: newIdempotencyKey().replace(/-/g, "").slice(0, 24), field, file, name: file.name, size: file.size, status: "selected" });
    });
    setFiles((f) => [...f, ...added]);
    setFileErr((e) => ({ ...e, [field]: errors.join("; ") }));
    if (added.length) setLostFiles([]);
  }

  /* ---------- Submit ---------- */
  async function runUploads(r: OrderReceipt, list: LocalFile[]) {
    const pending = list.filter((f) => f.status !== "uploaded" && f.status !== "rejected");
    let next = list;
    for (const f of pending) {
      setFiles((all) => all.map((x) => (x.ref === f.ref ? { ...x, status: "uploading", error: undefined } : x)));
      const res = await uploadOne(r, f);
      next = next.map((x) => (x.ref === f.ref ? { ...x, status: res.status, error: res.error, token: null } : x));
      setFiles((all) => all.map((x) => (x.ref === f.ref ? { ...x, status: res.status, error: res.error, token: null } : x)));
    }
    const missing = next.some((f) => f.status !== "uploaded");
    setPhase(missing ? "partial" : "done");
    focusLater("ox-result-title");
  }

  async function submitAll() {
    for (let i = 0; i < 7; i++) {
      const l = stepErrors(i, answers, { showLinks: true });
      if (l.length) {
        setTried((t) => ({ ...t, [i]: true }));
        setStep(i);
        setFromReview(true);
        setAnim((x) => x + 1);
        focusLater(focusIdFor(l[0].field, answers));
        return;
      }
    }
    if (!backendEnabled) {
      setPhase("test-done");
      focusLater("ox-result-title");
      return;
    }
    setPhase("submitting");
    setServerErr(null);
    const res = (await postJson("/api/orders", {
      idempotencyKey: idemKey.current,
      answers,
      builder: usedBuilder ? snapshot(usedBuilder) : null,
      attachments: files.map((f) => ({ clientRef: f.ref, field: f.field, name: f.name, size: f.size })),
      meta: { website: honeypot.current?.value ?? "", startedAt: startedAt.current },
    }, 30000)) as OrderResponse;

    if (!res.ok) {
      setPhase("form");
      setServerErr(res as ApiError);
      const fe = (res as ApiError).fieldErrors?.[0];
      if (fe && typeof fe.step === "number") {
        setTried((t) => ({ ...t, [fe.step!]: true }));
        go(fe.step, { fromReview: true });
      } else {
        focusLater("ox-submit-error");
      }
      return;
    }

    const r: OrderReceipt = { orderId: res.orderId, reference: res.reference, grant: res.uploadGrant };
    setReceipt(r);
    // The order is saved; drafts are no longer needed.
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LOCAL_KEY);
    } catch {
      /* ignore */
    }
    const withTickets = files.map((f) => {
      const t = res.uploads.find((u) => u.clientRef === f.ref);
      if (!t) return { ...f, status: "failed" as const, error: "Серверт бүртгэгдээгүй." };
      return { ...f, attachmentId: t.attachmentId, path: t.path, token: t.token, status: t.status === "uploaded" ? ("uploaded" as const) : f.status };
    });
    setFiles(withTickets);
    if (!withTickets.length) {
      setPhase("done");
      focusLater("ox-result-title");
      return;
    }
    await runUploads(r, withTickets);
  }

  async function retryFile(ref: string) {
    if (!receipt) return;
    const f = files.find((x) => x.ref === ref);
    if (!f) return;
    setFiles((all) => all.map((x) => (x.ref === ref ? { ...x, status: "uploading", error: undefined } : x)));
    const res = await uploadOne(receipt, f);
    setFiles((all) => {
      const next = all.map((x) => (x.ref === ref ? { ...x, status: res.status, error: res.error } : x));
      if (next.every((x) => x.status === "uploaded")) setPhase("done");
      return next;
    });
  }

  /* ---------- Drafts ---------- */
  function toggleDraft(on: boolean) {
    setSaveDraft(on);
    try {
      if (on) localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...buildDraft(), fileNames: [] }));
      else localStorage.removeItem(LOCAL_KEY);
    } catch {
      /* ignore */
    }
    setStoredDraft(null);
  }

  function restoreDraft() {
    if (!storedDraft) return;
    setAnswers({ ...emptyAnswers(), ...storedDraft.answers });
    setStep(Math.min(storedDraft.step, REVIEW));
    setMaxStep(Math.min(storedDraft.maxStep, REVIEW));
    setShowLinks(storedDraft.showLinks);
    idemKey.current = storedDraft.idemKey || newIdempotencyKey();
    setSaveDraft(true);
    setStoredDraft(null);
    setAnim((x) => x + 1);
  }

  function deleteDraft() {
    try {
      localStorage.removeItem(LOCAL_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    let fresh = emptyAnswers();
    if (usedBuilder) {
      fresh = { ...fresh, q12: TYPES[usedBuilder.type].orderType, q19: STYLES[usedBuilder.style].orderStyle, q17: usedBuilder.colors.primary, q18: usedBuilder.colors.secondary, q2: usedBuilder.name, q24: usedBuilder.headline };
    }
    setAnswers(fresh);
    setFiles([]);
    setFileErr({});
    setTried({});
    setStep(0);
    setMaxStep(0);
    setSaveDraft(false);
    setStoredDraft(null);
    setLostFiles([]);
    setFromReview(false);
    setAnim((x) => x + 1);
    idemKey.current = newIdempotencyKey();
  }

  /* ---------- JSON export (test mode or for the visitor's own copy) ---------- */
  function downloadJson() {
    const payload = {
      schema_version: 1,
      mode: backendEnabled ? "copy" : "test — not submitted",
      exported_at: new Date().toISOString(),
      answers: Object.fromEntries(
        ALL_FIELDS.filter((f) => typeof f.n !== "undefined" && isVisible(f, answers, { showLinks: true }) && f.kind !== "file").map((f) => [
          `${f.n}. ${f.id === "q38x" ? contactExtraLabel(answers) : f.label}`,
          formatAnswer(f, answers),
        ]),
      ),
      raw_answers: answers,
      builder: usedBuilder ? snapshot(usedBuilder) : null,
      attachments: FILE_FIELDS.reduce<Record<string, unknown>>((m, k) => {
        m[k] = {
          files: files.filter((f) => f.field === k).map((f) => ({ name: f.name, size: f.size, status: f.status === "uploaded" ? "uploaded" : "selected_not_uploaded" })),
          drive_link: answers[k + "d"] ?? null,
          send_later: answers[k + "l"] === true,
        };
        return m;
      }, {}),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = backendEnabled ? "axora-anket.json" : "axora-anket-turshilt.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- Render ---------- */
  const progressNow = phase === "done" || phase === "partial" || phase === "test-done" ? 7 : Math.min(step, 7);
  const pct = Math.round((progressNow / 7) * 100);
  const progressLabel =
    phase === "done" || phase === "partial"
      ? "Илгээгдлээ"
      : phase === "test-done"
        ? "Туршилт дууслаа"
        : inForm
          ? `Алхам ${step + 1} / 7 · ${STEPS[step].title}`
          : "Мэдээллээ шалгах";

  const resultView = phase === "done" || phase === "partial" || phase === "test-done";

  return (
    <>
      {!backendEnabled && (
        <div role="note" className="ax-in-sm mt-5 flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-[14px] border border-warn-line bg-warn-bg px-4 py-3 text-sm font-bold text-warn-ink">
          <span className="inline-flex items-center gap-2">
            <Info size={18} />
            Туршилтын горим — мэдээлэл илгээгдэхгүй.
          </span>
          <span className="font-semibold">Backend холбогдоогүй үзүүлэн. Төгсгөлд хариултаа JSON-оор татаж болно.</span>
        </div>
      )}

      {storedDraft && !resultView && (
        <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-[14px] border border-line bg-surface px-4 py-3 text-sm font-bold">
          <span>Энэ төхөөрөмж дээр хадгалсан ноорог олдлоо.</span>
          <span className="flex gap-2">
            <button type="button" onClick={restoreDraft} className="ax-btn ax-primary min-h-11 rounded-[10px] border-0 bg-primary px-3.5 text-sm font-bold text-on-primary">
              Сэргээх
            </button>
            <button type="button" onClick={deleteDraft} className="ax-btn ax-ghost min-h-11 rounded-[10px] border border-line-strong bg-surface px-3.5 text-sm font-bold text-ink">
              Устгах
            </button>
          </span>
        </div>
      )}

      {lostFiles.length > 0 && !resultView && (
        <div role="note" className="mt-3 rounded-[14px] border border-line bg-surface px-4 py-3 text-sm leading-normal">
          <strong>Өмнө сонгосон файлууд сэргээгдээгүй:</strong> {lostFiles.join(", ")}. Хөтөч аюулгүй байдлын үүднээс сонгосон файлыг хадгалдаггүй тул 3, 4-р алхамд дахин сонгоно уу.
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-start gap-6">
        <aside aria-label="Алхмууд" className="sticky top-[92px] hidden max-w-[290px] flex-[1_1_240px] flex-col gap-3.5 min-[900px]:flex">
          <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
            {[...STEPS.map((s) => s.title), "Шалгах"].map((title, i) => {
              const cur = !resultView && i === step;
              const done = resultView || i < maxStep || (i < REVIEW && step === REVIEW);
              const locked = resultView || phase === "submitting" || i > maxStep;
              return (
                <li key={title}>
                  <button
                    type="button"
                    disabled={locked}
                    aria-current={cur ? "step" : undefined}
                    onClick={() => go(i, { fromReview: step === REVIEW || fromReview })}
                    className="ax-btn flex min-h-12 w-full items-center gap-3 rounded-xl border-0 px-2.5 py-1.5 text-left text-[15px] font-bold disabled:opacity-100"
                    style={{ background: cur ? "var(--ax-elevated)" : "transparent", color: locked && !done ? "var(--ax-faint)" : "var(--ax-ink)", cursor: locked ? "not-allowed" : "pointer" }}
                  >
                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold"
                      style={{
                        background: cur ? "var(--ax-primary)" : done && i < REVIEW ? "var(--ax-lime)" : "var(--ax-surface)",
                        color: cur ? "var(--ax-on-primary)" : done && i < REVIEW ? "var(--ax-on-lime)" : "var(--ax-ink)",
                        border: cur || (done && i < REVIEW) ? 0 : "1px solid var(--ax-line-mid)",
                      }}
                    >
                      {done && !cur && i < REVIEW ? <Check size={14} strokeWidth={3} /> : i + 1}
                    </span>
                    {title}
                    <span className="sr-only">{cur ? " — одоогийн алхам" : done ? " — бөглөсөн" : locked ? " — хараахан нээгдээгүй" : ""}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {!resultView && (
            <div className="flex flex-col gap-2.5 border-t border-line pt-3.5">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug font-bold">
                <input type="checkbox" checked={saveDraft} onChange={(e) => toggleDraft(e.target.checked)} className="m-0 h-5 w-5 shrink-0" />
                Энэ төхөөрөмж дээр ноорог хадгалах
              </label>
              <span className="text-[13px] leading-normal text-muted">
                Идэвхжүүлбэл хариулт энэ хөтөч дээр хадгалагдана. Сонгосон файл сэргээгдэхгүй — дахин сонгоно. Нийтийн компьютер дээр бүү идэвхжүүл.
              </span>
              <button type="button" onClick={deleteDraft} className="ax-btn ax-ghost min-h-11 self-start rounded-[10px] border border-line-strong bg-surface px-3.5 text-sm font-bold text-ink">
                Ноорог устгах
              </button>
            </div>
          )}
        </aside>

        <section aria-labelledby={resultView ? "ox-result-title" : "ox-step-title"} className="min-w-0 flex-[999_1_560px] overflow-hidden rounded-[22px] border border-line bg-surface">
          <div className="flex flex-col gap-3 px-[clamp(18px,3vw,36px)] pt-[clamp(18px,3vw,32px)]">
            <div className="flex items-center justify-between gap-3 text-sm font-extrabold">
              <span className="text-brand">{progressLabel}</span>
              <span className="text-muted">{pct}%</span>
            </div>
            <div role="progressbar" aria-valuemin={0} aria-valuemax={7} aria-valuenow={progressNow} aria-label="Анкетын явц" className="h-2 overflow-hidden rounded-lg bg-soft">
              <div className="h-full rounded-lg bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {inForm && !resultView && (
            <form noValidate onSubmit={onNext} className="px-[clamp(18px,3vw,36px)] pt-[22px] pb-[clamp(20px,3vw,36px)]">
              <div key={anim} className="ax-slide flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <h2 id="ox-step-title" tabIndex={-1} className="text-[clamp(24px,2.6vw,32px)] leading-[1.15] font-extrabold tracking-[-0.02em] outline-none">
                    {STEPS[step].title}
                  </h2>
                  <p className="text-base leading-relaxed text-muted">{STEPS[step].desc}</p>
                </div>

                {errs.length > 0 && (
                  <ErrorBox>
                    {errs.length} талбарт засвар хэрэгтэй.
                  </ErrorBox>
                )}

                {STEPS[step].fields.map((f) => {
                  if (!isVisible(f, answers, ui)) return null;
                  if (f.kind === "file") {
                    const id = f.id as FileFieldId;
                    return (
                      <FileField
                        key={f.id}
                        id={f.id}
                        num={f.n}
                        label={f.label}
                        files={files.filter((x) => x.field === id)}
                        fileErr={fileErr[id] ?? ""}
                        onAdd={(l) => addFiles(id, l)}
                        onRemove={(ref) => setFiles((all) => all.filter((x) => x.ref !== ref))}
                        drive={typeof answers[f.id + "d"] === "string" ? (answers[f.id + "d"] as string) : ""}
                        onDrive={(v) => set(f.id + "d", v)}
                        later={answers[f.id + "l"] === true}
                        onLater={(v) => set(f.id + "l", v)}
                        driveErr={errMap[f.id] ?? ""}
                      />
                    );
                  }
                  return (
                    <FieldRenderer
                      key={f.id}
                      f={f}
                      a={answers}
                      set={set}
                      error={errMap[f.id]}
                      linksOpen={linksOpen}
                      domainHelp={domainHelp}
                      onToggle={(id) => (id === "tLinks" ? setShowLinks((x) => !x) : setDomainHelp((x) => !x))}
                      builder={usedBuilder}
                    />
                  );
                })}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                  {step > 0 && (
                    <button type="button" onClick={() => go(step - 1)} className="ax-btn ax-ghost inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-base font-bold text-ink">
                      <ArrowLeft size={16} />
                      Өмнөх
                    </button>
                  )}
                  <span className="flex-1" />
                  {fromReview && step < 6 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep(step)) go(REVIEW);
                      }}
                      className="ax-btn ax-ghost min-h-[52px] rounded-xl border border-line-strong bg-surface px-[18px] text-[15px] font-bold text-ink"
                    >
                      Шалгах руу буцах
                    </button>
                  )}
                  <button type="submit" className="ax-btn ax-primary inline-flex min-h-[52px] items-center gap-2 rounded-xl border-0 bg-primary px-6 text-base font-bold text-on-primary max-[480px]:w-full max-[480px]:justify-center">
                    {step === 6 || fromReview ? "Шалгах" : "Үргэлжлүүлэх"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === REVIEW && !resultView && (
            <div key={anim} className="ax-slide flex flex-col gap-5 px-[clamp(18px,3vw,36px)] pt-[22px] pb-[clamp(20px,3vw,36px)]">
              <div className="flex flex-col gap-1.5">
                <h2 id="ox-step-title" tabIndex={-1} className="text-[clamp(24px,2.6vw,32px)] leading-[1.15] font-extrabold tracking-[-0.02em] outline-none">
                  Мэдээллээ шалгах
                </h2>
                <p className="text-base leading-relaxed text-muted">Хариултаа нягталж, засах шаардлагатай бол тухайн алхам руу буцна уу.</p>
              </div>
              {STEPS.map((st, i) => (
                <section key={st.title} className="overflow-hidden rounded-2xl border border-line" aria-labelledby={`rv-${i}`}>
                  <div className="flex items-center justify-between gap-3 border-b border-line bg-sunken py-2.5 pr-2.5 pl-4">
                    <h3 id={`rv-${i}`} className="text-base font-extrabold">
                      {i + 1}. {st.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => go(i, { fromReview: true })}
                      aria-label={`${st.title} — засах`}
                      className="ax-btn ax-ghost min-h-11 rounded-[10px] border border-line-strong bg-surface px-3.5 text-sm font-bold text-ink"
                    >
                      Засах
                    </button>
                  </div>
                  <dl className="m-0 px-4 pt-1 pb-2.5">
                    {st.fields
                      .filter((f) => !["toggle", "note", "builder"].includes(f.kind) && isVisible(f, answers, { showLinks: true }))
                      .map((f) => {
                        let val = formatAnswer(f, answers);
                        if (f.kind === "file") {
                          const parts = files.filter((x) => x.field === f.id).map((x) => `${x.name} (сонгогдсон)`);
                          if (answers[f.id + "d"]) parts.push(`Drive: ${answers[f.id + "d"]}`);
                          if (answers[f.id + "l"] === true) parts.push("Дараа илгээнэ");
                          val = parts.join("; ");
                        }
                        const bad = !!checkField(f, answers) && f.kind !== "file";
                        return (
                          <div key={f.id} className="grid gap-x-4 gap-y-0.5 border-b border-soft py-2.5 last:border-b-0 [grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))]">
                            <dt className="text-sm font-bold text-muted">
                              {f.n}. {f.id === "q38x" ? contactExtraLabel(answers) : f.label}
                            </dt>
                            <dd className="m-0 text-[15px] leading-normal [overflow-wrap:anywhere]" style={{ color: bad ? "var(--ax-danger)" : val ? "var(--ax-ink)" : "var(--ax-faint)" }}>
                              {val || "—"}
                              {bad && " ✕ засвар хэрэгтэй"}
                            </dd>
                          </div>
                        );
                      })}
                  </dl>
                </section>
              ))}

              {!backendEnabled && (
                <div className="flex items-start gap-2.5 rounded-xl border border-warn-line bg-warn-bg px-3.5 py-3 text-sm leading-normal font-bold text-warn-ink">
                  Туршилтын горим — “Илгээх” дарахад мэдээлэл хаашаа ч илгээгдэхгүй.
                </div>
              )}

              {serverErr && (
                <div id="ox-submit-error" tabIndex={-1}>
                  <ErrorBox>
                    <p>{serverErr.message}</p>
                    <p className="mt-1 font-semibold">Таны хариултууд хадгалагдсан хэвээр байна.</p>
                    {serverErr.code === "conflict" && (
                      <button
                        type="button"
                        onClick={() => {
                          idemKey.current = newIdempotencyKey();
                          setServerErr(null);
                        }}
                        className="mt-2 min-h-11 underline"
                      >
                        Шинэ хүсэлт болгон илгээх
                      </button>
                    )}
                  </ErrorBox>
                </div>
              )}

              {/* Honeypot (bots fill it; people never see it). */}
              <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button type="button" onClick={() => go(6)} className="ax-btn ax-ghost inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-base font-bold text-ink">
                  <ArrowLeft size={16} />
                  Өмнөх
                </button>
                <button
                  type="button"
                  onClick={submitAll}
                  disabled={phase === "submitting"}
                  aria-busy={phase === "submitting"}
                  className="ax-btn ax-primary min-h-[52px] rounded-xl border-0 bg-primary px-[26px] text-base font-bold text-on-primary max-[480px]:w-full"
                >
                  {phase === "submitting" ? "Илгээж байна…" : !backendEnabled ? "Илгээх (туршилт)" : serverErr ? "Дахин илгээх" : "Илгээх"}
                </button>
              </div>
            </div>
          )}

          {resultView && (
            <div role="status" className="ax-in-sm flex flex-col items-start gap-[18px] px-[clamp(18px,3vw,36px)] py-[clamp(28px,5vw,56px)]">
              <span className={`inline-flex h-16 w-16 items-center justify-center rounded-[18px] ${phase === "test-done" ? "bg-warn-bg text-warn" : "bg-soft text-brand"}`}>
                <Check size={30} strokeWidth={2.4} className="ax-draw" />
              </span>
              <h2 id="ox-result-title" tabIndex={-1} className="text-[clamp(26px,3vw,36px)] leading-[1.15] font-extrabold tracking-[-0.02em] outline-none">
                {phase === "test-done" ? "Туршилтын анкет бөглөгдлөө" : phase === "partial" ? "Захиалга хадгалагдсан, зарим файл илгээгдээгүй" : "Хүсэлт хүлээн авлаа"}
              </h2>

              {phase === "test-done" ? (
                <p className="max-w-[34em] text-[17px] leading-relaxed text-muted">
                  Мэдээлэл илгээгдээгүй — энэ бол backend холбогдоогүй үзүүлэн. Бодит захиалга хүлээн аваагүй. Хариултаа хадгалж авах бол доорх товчийг ашиглана уу.
                </p>
              ) : (
                <>
                  <p className="max-w-[34em] text-[17px] leading-relaxed text-muted">{SUCCESS_TEXT}</p>
                  {receipt && (
                    <p className="text-[15px]">
                      Захиалгын дугаар: <strong className="font-mono">{receipt.reference}</strong>
                    </p>
                  )}
                </>
              )}

              {phase === "partial" && (
                <div className="flex w-full flex-col gap-3 rounded-2xl border border-warn-line bg-warn-bg p-4">
                  <p className="text-sm leading-normal font-semibold text-warn-ink">
                    Анкет тань хадгалагдсан тул дахин бөглөх шаардлагагүй. Доорх файлуудыг дахин илгээж үзнэ үү. Болохгүй бол Drive холбоосоор эсвэл <Link href="/contact">бидэнтэй холбогдож</Link> илгээнэ үү.
                  </p>
                  {FILE_FIELDS.map((k) => {
                    const list = files.filter((f) => f.field === k);
                    if (!list.length) return null;
                    const f = ALL_FIELDS.find((x) => x.id === k)!;
                    return (
                      <FileField
                        key={k}
                        id={`r-${k}`}
                        num={f.n}
                        label={f.label}
                        files={list}
                        fileErr=""
                        onAdd={() => {}}
                        onRemove={() => {}}
                        drive=""
                        onDrive={() => {}}
                        later={false}
                        onLater={() => {}}
                        driveErr=""
                        locked
                        onRetry={retryFile}
                      />
                    );
                  })}
                  {files.some((f) => f.status === "failed") && (
                    <button
                      type="button"
                      onClick={() => receipt && runUploads(receipt, files)}
                      className="ax-btn ax-primary inline-flex min-h-12 items-center gap-2 self-start rounded-xl border-0 bg-primary px-5 text-[15px] font-bold text-on-primary"
                    >
                      <Refresh size={16} />
                      Бүх дутуу файлыг дахин илгээх
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={downloadJson}
                  className={`ax-btn inline-flex min-h-[52px] items-center gap-2 rounded-xl px-[22px] text-base font-bold ${phase === "test-done" ? "ax-primary border-0 bg-primary text-on-primary" : "ax-ghost border border-line-strong bg-surface text-ink"}`}
                >
                  <Download size={18} />
                  Хариултаа JSON-оор татах
                </button>
                {phase === "test-done" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("form");
                      go(REVIEW);
                    }}
                    className="ax-btn ax-ghost min-h-[52px] rounded-xl border border-line-strong bg-surface px-5 text-base font-bold text-ink"
                  >
                    Хариултаа харах
                  </button>
                ) : (
                  <Link href="/" className="ax-btn ax-ghost inline-flex min-h-[52px] items-center rounded-xl border border-line-strong bg-surface px-5 text-base font-bold text-ink no-underline">
                    Нүүр хуудас руу
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Mobile: draft controls live under the form (the step list is desktop-only). */}
      {!resultView && (
        <div className="mt-4 flex flex-col gap-2.5 rounded-[18px] border border-line bg-surface p-4 min-[900px]:hidden">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug font-bold">
            <input type="checkbox" checked={saveDraft} onChange={(e) => toggleDraft(e.target.checked)} className="m-0 h-5 w-5 shrink-0" />
            Энэ төхөөрөмж дээр ноорог хадгалах
          </label>
          <span className="text-[13px] leading-normal text-muted">Идэвхжүүлбэл хариулт энэ хөтөч дээр хадгалагдана. Сонгосон файл сэргээгдэхгүй — дахин сонгоно.</span>
          <button type="button" onClick={deleteDraft} className="ax-btn ax-ghost min-h-11 self-start rounded-[10px] border border-line-strong bg-surface px-3.5 text-sm font-bold text-ink">
            Ноорог устгах
          </button>
        </div>
      )}
    </>
  );
}
