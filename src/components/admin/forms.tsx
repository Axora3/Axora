"use client";

import { runAdminAction } from "@/lib/admin/action-client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addNoteAction, signAttachmentAction, updateOrderAction, updateRequestAction } from "@/app/admin/actions";
import { ORDER_STATUS, ORDER_STATUSES, REQUEST_STATUS, REQUEST_STATUSES } from "@/lib/admin/labels";
import { canOrderTransition, canRequestTransition, requestTransitionHint } from "@/lib/admin/transitions";
import { btn, field } from "./ui";

type Msg = { kind: "ok" | "err"; text: string; conflict?: boolean } | null;

function Feedback({ msg }: { msg: Msg }) {
  const router = useRouter();
  if (!msg) return null;
  return (
    <div
      role={msg.kind === "err" ? "alert" : "status"}
      className={`rounded-[10px] px-3 py-2.5 text-sm font-bold ${msg.kind === "ok" ? "bg-soft text-brand" : "border border-danger-line bg-danger-bg text-danger-ink"}`}
    >
      {msg.kind === "ok" ? "✓ " : "✕ "}
      {msg.text}
      {msg.conflict && (
        <button type="button" onClick={() => router.refresh()} className="mt-1.5 block min-h-11 underline">
          Хуудсыг шинэчлэх
        </button>
      )}
    </div>
  );
}

export function OrderStatusForm(p: { id: string; updatedAt: string; status: string; agreed: string | null; next: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(p.status);
  const [agreed, setAgreed] = useState(p.agreed ?? "");
  const [next, setNext] = useState(p.next ?? "");
  const [expected, setExpected] = useState(p.updatedAt);
  const [seenVersion, setSeenVersion] = useState(p.updatedAt);
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  // Accept a refreshed server version without losing our own save feedback.
  if (seenVersion !== p.updatedAt) {
    setSeenVersion(p.updatedAt);
    if (expected !== p.updatedAt) {
      setExpected(p.updatedAt);
      setStatus(p.status);
      setAgreed(p.agreed ?? "");
      setNext(p.next ?? "");
      setMsg(null);
    }
  }
  const dirty = status !== p.status || agreed !== (p.agreed ?? "") || next !== (p.next ?? "");

  return (
    <form
      id="status-panel"
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await runAdminAction(() => updateOrderAction({ id: p.id, expected, status: status as (typeof ORDER_STATUSES)[number], agreed_deadline: agreed, next_contact_on: next }));
          if (r.ok) {
            setExpected(r.updatedAt);
            setMsg({ kind: "ok", text: "Хадгалагдлаа." });
            router.refresh();
          } else setMsg({ kind: "err", text: r.message, conflict: r.code === "conflict" });
        });
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className={field.label}>Төлөв</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={field.input}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s} disabled={s !== p.status && !canOrderTransition(p.status, s)}>
              {ORDER_STATUS[s].label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={field.label}>Тохиролцсон хугацаа</span>
        <input type="date" value={agreed} onChange={(e) => setAgreed(e.target.value)} className={field.input} />
        <span className={field.hint}>Хэрэглэгчийн хүссэн хугацаанаас тусдаа бүртгэгдэнэ.</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={field.label}>Дараагийн холбоо барих огноо</span>
        <input type="date" value={next} onChange={(e) => setNext(e.target.value)} className={field.input} />
        <span className={field.hint}>Зөвхөн бүртгэл — сануулга, мэдэгдэл илгээгдэхгүй.</span>
      </label>
      <Feedback msg={msg} />
      <button type="submit" disabled={pending || !dirty} className={btn.primary}>
        {pending ? "Хадгалж байна…" : "Төлөв шинэчлэх"}
      </button>
    </form>
  );
}

export function RequestStatusForm(p: { id: string; updatedAt: string; status: string; paymentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(p.status);
  const [expected, setExpected] = useState(p.updatedAt);
  const [seenVersion, setSeenVersion] = useState(p.updatedAt);
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  if (seenVersion !== p.updatedAt) {
    setSeenVersion(p.updatedAt);
    if (expected !== p.updatedAt) {
      setExpected(p.updatedAt);
      setStatus(p.status);
      setMsg(null);
    }
  }
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await runAdminAction(() => updateRequestAction({ id: p.id, expected, status: status as (typeof REQUEST_STATUSES)[number] }));
          if (r.ok) {
            setExpected(r.updatedAt);
            setMsg({ kind: "ok", text: "Хадгалагдлаа." });
            router.refresh();
          } else setMsg({ kind: "err", text: r.message, conflict: r.code === "conflict" });
        });
      }}
    >
      <fieldset className="ax-fs flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">Төлөв</legend>
        {REQUEST_STATUSES.map((s) => {
          const allowed = s === p.status || canRequestTransition(p.status, s, p.paymentStatus);
          const why = requestTransitionHint(p.status, s, p.paymentStatus);
          return (
            <label key={s} className={`flex min-h-11 items-start gap-2.5 rounded-xl border p-2.5 ${allowed ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`} style={{ borderColor: status === s ? "var(--ax-brand)" : "var(--ax-line)" }}>
              <input type="radio" name="req-status" checked={status === s} disabled={!allowed} onChange={() => setStatus(s)} className="mt-0.5 h-5 w-5" />
              <span className="flex flex-col">
                <strong className="text-sm">{REQUEST_STATUS[s].label}</strong>
                <span className="text-[13px] text-muted">{why ?? REQUEST_STATUS[s].hint}</span>
              </span>
            </label>
          );
        })}
      </fieldset>
      <Feedback msg={msg} />
      <button type="submit" disabled={pending || status === p.status} className={btn.primary}>
        {pending ? "Хадгалж байна…" : "Төлөв хадгалах"}
      </button>
    </form>
  );
}

export function NoteForm({ entityType, entityId }: { entityType: "order" | "template_request" | "website_project" | "contact_message"; entityId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return setMsg({ kind: "err", text: "Тэмдэглэлээ бичнэ үү." });
        start(async () => {
          const r = await runAdminAction(() => addNoteAction({ entityType, entityId, body }));
          if (r.ok) {
            setBody("");
            setMsg({ kind: "ok", text: "Тэмдэглэл нэмэгдлээ." });
            router.refresh();
          } else setMsg({ kind: "err", text: r.message });
        });
      }}
    >
      <label htmlFor={`note-${entityId}`} className={field.label}>
        Шинэ дотоод тэмдэглэл
      </label>
      <textarea id={`note-${entityId}`} rows={3} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} className={field.textarea} />
      <span className={field.hint}>Зөвхөн админд харагдана. Хэрэглэгчийн анхны хариулт өөрчлөгдөхгүй.</span>
      <Feedback msg={msg} />
      <button type="submit" disabled={pending} className={`${btn.ghost} self-start`}>
        {pending ? "Нэмж байна…" : "Тэмдэглэл нэмэх"}
      </button>
    </form>
  );
}

/** Image preview / file download via a 2-minute signed URL. SVG/PDF are never rendered inline in this page. */
export function AttachmentActions({ id, name, mime, uploaded }: { id: string; name: string; mime: string; uploaded: boolean }) {
  const [img, setImg] = useState<string | null>(null);
  const [download, setDownload] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const previewable = mime === "image/jpeg" || mime === "image/png";
  if (!uploaded) return null;
  const go = (mode: "view" | "download") =>
    start(async () => {
      setErr("");
      const r = await runAdminAction(() => signAttachmentAction(id, mode));
      if (!r.ok) return setErr(r.message);
      if (mode === "view" && previewable) setImg(r.url);
      else setDownload(r.url);
    });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {previewable && (
          <button type="button" disabled={pending} onClick={() => go("view")} className={btn.ghost}>
            Урьдчилан харах
          </button>
        )}
        <button type="button" disabled={pending} onClick={() => go("download")} className={btn.ghost} aria-label={`${name} татах`}>
          {pending ? "Холбоос үүсгэж байна…" : "Татах"}
        </button>
      </div>
      {err && <p role="alert" className="text-[13px] font-bold text-danger">✕ {err}</p>}
      {download && <div role="status" className="flex flex-wrap items-center gap-2 text-sm">
        <a href={download} target="_blank" rel="noopener noreferrer" className={btn.primary}>Файлыг нээж татах ↗</a>
        <span className="text-muted">Холбоос 2 минут хүчинтэй. Дууссан бол дахин “Татах” дарна уу.</span>
      </div>}
      {img && (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not an optimisable asset
        <img src={img} alt={name} className="max-h-[360px] w-auto max-w-full rounded-xl border border-line object-contain" />
      )}
    </div>
  );
}
