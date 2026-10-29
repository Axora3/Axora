"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { checkSlugAction, saveTemplateAction, uploadTicketAction } from "@/app/admin/template-actions";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { FILE_MAX, PREVIEW_EXT, PREVIEW_MAX, slugify, validateTemplate, type FormErrors, type TemplateForm } from "@/lib/admin/template-schema";
import { formatSize } from "@/lib/order/attachments";
import { TEMPLATE_CATEGORIES, type Template } from "@/lib/templates/types";
import { PubPill, btn, field } from "./ui";
import { publicPreviewUrl, uploadWithProgress } from "./upload";

type Props = {
  id: string | null;
  updatedAt: string | null;
  status: "draft" | "published";
  /** Storage folder for new uploads (the template id, or a fresh uuid for a new one). */
  folder: string;
  initial: TemplateForm;
  previewStyle: Template["previewStyle"];
};

type Upload = { key: string; kind: "preview" | "file"; file: File; pct: number; error?: string; thumb?: string };

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function Err({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <span id={id} className="text-[13px] font-bold text-danger">
      ✕ {text}
    </span>
  );
}

function UploadRow({ u, onRetry, onRemove }: { u: Upload; onRetry: () => void; onRemove: () => void }) {
  const ext = /\.([a-z0-9]+)$/i.exec(u.file.name)?.[1]?.toUpperCase() ?? "Файл";
  return (
    <div role={u.error ? "alert" : "status"} className={`flex items-center gap-3 rounded-xl border p-2.5 text-sm ${u.error ? "border-danger-line bg-danger-bg" : "border-line bg-sunken"}`}>
      {u.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL preview before upload finishes
        <img src={u.thumb} alt="" className="ax-light h-12 w-16 shrink-0 rounded-lg border border-line object-cover" />
      ) : (
        <span aria-hidden="true" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-soft text-[11px] font-extrabold">
          {ext}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-bold [overflow-wrap:anywhere]">{u.file.name}</span>
        <span className="text-xs text-muted">
          {u.file.type || ext} · {formatSize(u.file.size)}
        </span>
        {u.error ? (
          <span className="font-bold text-danger-ink">✕ {u.error}</span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="h-2 flex-1 overflow-hidden rounded bg-soft" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={u.pct} aria-label={`${u.file.name} хуулж байна`}>
              <span className="block h-full bg-primary transition-[width]" style={{ width: `${u.pct}%` }} />
            </span>
            <span className="text-xs text-muted tabular-nums">{u.pct}%</span>
          </span>
        )}
      </span>
      {u.error && (
        <span className="flex shrink-0 flex-col gap-1.5">
          <button type="button" onClick={onRetry} className={btn.ghost}>
            Дахин
          </button>
          <button type="button" onClick={onRemove} aria-label={`${u.file.name} — хасах`} className={btn.ghost}>
            Хасах
          </button>
        </span>
      )}
    </div>
  );
}

export function TemplateEditor(p: Props) {
  const router = useRouter();
  const [f, setF] = useState<TemplateForm>(p.initial);
  const [includedText, setIncludedText] = useState(p.initial.included.join("\n"));
  const [howToText, setHowToText] = useState(p.initial.howTo.join("\n"));
  const [slugTouched, setSlugTouched] = useState(!!p.id);
  const [saved, setSaved] = useState(JSON.stringify(p.initial));
  const [expected, setExpected] = useState(p.updatedAt);
  const [status, setStatus] = useState(p.status);
  const [errors, setErrors] = useState<FormErrors>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const form: TemplateForm = useMemo(() => ({ ...f, included: lines(includedText), howTo: lines(howToText) }), [f, includedText, howToText]);
  const dirty = JSON.stringify(form) !== saved;

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = <K extends keyof TemplateForm>(k: K, v: TemplateForm[K]) => setF((x) => ({ ...x, [k]: v }));

  function save(mode: "draft" | "publish" | "unpublish") {
    setMsg(null);
    const local = validateTemplate(form, mode === "publish" ? "publish" : "draft");
    setErrors(local);
    if (Object.keys(local).length) {
      setMsg({ kind: "err", text: mode === "publish" ? "Нийтлэхийн өмнө тэмдэглэсэн талбаруудыг бөглөнө үү." : "Тэмдэглэсэн талбаруудыг засна уу." });
      document.getElementById(`tf-${Object.keys(local)[0]}`)?.focus();
      return;
    }
    start(async () => {
      const r = await saveTemplateAction({ id: p.id, expected, mode, form });
      if (!r.ok) {
        setErrors(r.errors ?? {});
        setMsg({ kind: "err", text: r.message });
        // Partly saved (e.g. draft stored, publish refused): continue from the stored row.
        if ("saved" in r && r.saved) {
          setSaved(JSON.stringify(form));
          setExpected(r.saved.updatedAt);
          setStatus(r.saved.status as "draft" | "published");
          if (!p.id) router.replace(`/admin/templates/${r.saved.id}/edit`);
        }
        const first = Object.keys(r.errors ?? {})[0];
        if (first) document.getElementById(`tf-${first}`)?.focus();
        return;
      }
      setSaved(JSON.stringify(form));
      setExpected(r.updatedAt);
      setStatus(r.status as "draft" | "published");
      setMsg({ kind: "ok", text: mode === "publish" ? "Нийтлэгдлээ. Сайт дээр шинэчлэгдсэн." : mode === "unpublish" ? "Нийтлэлээс буулгалаа. Сайтад харагдахгүй." : "Ноорог хадгалагдлаа." });
      if (!p.id) router.replace(`/admin/templates/${r.id}/edit`);
      else router.refresh();
    });
  }

  const patchUpload = (key: string, patch: Partial<Upload>) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const dropUpload = (key: string) =>
    setUploads((u) => {
      const gone = u.find((x) => x.key === key);
      if (gone?.thumb) URL.revokeObjectURL(gone.thumb);
      return u.filter((x) => x.key !== key);
    });

  /**
   * One upload, retryable with the same File. The form (and so the database)
   * only points at the new object after the upload finished; the old object
   * is removed by the server after the save succeeds.
   */
  async function runUpload(u: Upload) {
    patchUpload(u.key, { pct: 0, error: undefined });
    const t = await uploadTicketAction({ kind: u.kind, folder: p.folder, name: u.file.name, size: u.file.size });
    if (!t.ok) return patchUpload(u.key, { error: t.message });
    try {
      await uploadWithProgress(t.bucket, t.path, t.token, u.file, (pct) => patchUpload(u.key, { pct }));
      if (u.kind === "preview") setF((x) => ({ ...x, previewImages: [...x.previewImages, { path: t.path, alt: x.title || u.file.name.replace(/\.[^.]+$/, "") }] }));
      else setF((x) => ({ ...x, file: { storagePath: t.path, externalUrl: null, label: u.file.name } }));
      dropUpload(u.key);
    } catch {
      patchUpload(u.key, { error: "Хуулж чадсангүй. Сүлжээгээ шалгаад дахин оролдоно уу." });
    }
  }

  function queue(kind: Upload["kind"], files: File[]) {
    for (const file of files) {
      const ext = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toLowerCase() ?? "";
      const u: Upload = { key: `${kind}-${Date.now()}-${file.name}`, kind, file, pct: 0, thumb: /^image\/(png|jpeg|webp)$/.test(file.type) ? URL.createObjectURL(file) : undefined };
      if (kind === "preview" && !PREVIEW_EXT.includes(ext)) u.error = "Зөвхөн PNG, JPG, WEBP зураг.";
      else if (kind === "preview" && file.size > PREVIEW_MAX) u.error = "Зураг 5MB-аас их байна.";
      else if (kind === "file" && file.size > FILE_MAX) u.error = "Файл 200MB-аас их байна.";
      setUploads((list) => [...list.filter((x) => kind === "preview" || x.kind !== "file"), u]);
      if (!u.error) runUpload(u);
    }
  }
  const addImages = (list: FileList | null) => list && queue("preview", Array.from(list));
  const uploadPrivate = (file: File) => queue("file", [file]);

  // Free object URLs when the editor unmounts.
  const thumbsRef = useRef<Upload[]>([]);
  useEffect(() => {
    thumbsRef.current = uploads;
  }, [uploads]);
  useEffect(() => () => thumbsRef.current.forEach((u) => u.thumb && URL.revokeObjectURL(u.thumb)), []);

  // Slug: server duplicate check (the product being edited is not a duplicate of itself).
  const [slugState, setSlugState] = useState<"" | "checking" | "ok" | "taken" | "error">("");
  useEffect(() => {
    if (!f.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) return;
    let live = true;
    const h = setTimeout(async () => {
      setSlugState("checking");
      const r = await checkSlugAction(f.slug, p.id);
      if (live) setSlugState(!r.ok ? "error" : r.available ? "ok" : "taken");
    }, 450);
    return () => {
      live = false;
      clearTimeout(h);
    };
  }, [f.slug, p.id]);

  const move = (i: number, d: -1 | 1) =>
    setF((x) => {
      const a = [...x.previewImages];
      const j = i + d;
      if (j < 0 || j >= a.length) return x;
      [a[i], a[j]] = [a[j], a[i]];
      return { ...x, previewImages: a };
    });

  const previewT: Template = {
    id: p.id ?? "new",
    slug: form.slug || "preview",
    title: form.title || "Загварын нэр",
    shortDescription: form.shortDescription || "Товч тайлбар энд харагдана.",
    longDescription: form.longDescription,
    category: form.category,
    price: form.isFree ? 0 : form.price,
    currency: form.currency,
    isFree: form.isFree,
    previewImages: form.previewImages.map((i) => ({ url: publicPreviewUrl(i.path), alt: i.alt })),
    previewStyle: { ...p.previewStyle, p1: form.title || p.previewStyle.p1 },
    forWhom: form.forWhom,
    included: form.included,
    howTo: form.howTo,
    requirements: form.requirements,
    format: form.format,
    isDemo: false,
    sortOrder: form.sortOrder,
  };

  const inp = (k: keyof TemplateForm) => ({
    id: `tf-${k}`,
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `tf-${k}-e` : undefined,
    style: errors[k] ? { border: "2px solid var(--ax-danger)" } : undefined,
  });
  const section = "flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-[18px]";
  const h2 = "text-[17px] font-extrabold";

  return (
    <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save("draft");
        }}
        className="flex min-w-0 flex-col gap-4"
        aria-busy={pending}
      >
        <section className={section} aria-labelledby="sec-basic">
          <h2 id="sec-basic" className={h2}>
            1. Үндсэн мэдээлэл
          </h2>
          <label className="flex flex-col gap-1.5">
            <span className={field.label}>Нэр *</span>
            <input
              {...inp("title")}
              className={field.input}
              value={f.title}
              maxLength={200}
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
            <Err id="tf-title-e" text={errors.title} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={field.label}>Slug (URL) *</span>
            <input
              {...inp("slug")}
              className={`${field.input} font-mono`}
              value={f.slug}
              maxLength={120}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value.toLowerCase());
              }}
            />
            <span className={field.hint}>
              /templates/{f.slug || "…"} — {status === "published" ? "нийтлэгдсэн тул нэр солиход slug автоматаар өөрчлөгдөхгүй; гараар солиход хуучин холбоос ажиллахаа болино." : "латин жижиг үсэг, тоо, зураас."}
            </span>
            {f.slug && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug) && slugState && (
              <span aria-live="polite" className={`text-[13px] font-bold ${slugState === "taken" ? "text-danger" : slugState === "ok" ? "text-brand" : "text-muted"}`}>
                {slugState === "checking" ? "Шалгаж байна…" : slugState === "ok" ? "✓ Боломжтой" : slugState === "taken" ? "✕ Энэ slug өөр бүтээгдэхүүнд ашиглагдсан" : "Шалгаж чадсангүй — хадгалахад сервер дахин шалгана"}
              </span>
            )}
            <Err id="tf-slug-e" text={errors.slug} />
          </label>
          {f.title && slugify(f.title) && slugify(f.title) !== f.slug && (
            <button type="button" onClick={() => set("slug", slugify(f.title))} className={`${btn.ghost} -mt-2 self-start`}>
              Нэрээс санал болгох: <span className="font-mono">{slugify(f.title)}</span>
            </button>
          )}
          <div className="grid gap-4 min-[600px]:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={field.label}>Ангилал *</span>
              <select className={field.input} value={f.category} onChange={(e) => set("category", e.target.value as TemplateForm["category"])}>
                {TEMPLATE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={field.label}>Эрэмбэ (бага нь эхэнд)</span>
              <input type="number" min={0} className={field.input} value={f.sortOrder} onChange={(e) => set("sortOrder", Math.max(0, Math.round(Number(e.target.value) || 0)))} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={field.label}>Товч тайлбар (нийтлэхэд *)</span>
            <textarea {...inp("shortDescription")} rows={2} maxLength={400} className={field.textarea} value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
            <Err id="tf-shortDescription-e" text={errors.shortDescription} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={field.label}>Дэлгэрэнгүй тайлбар (нийтлэхэд *)</span>
            <textarea {...inp("longDescription")} rows={5} maxLength={5000} className={field.textarea} value={f.longDescription} onChange={(e) => set("longDescription", e.target.value)} />
            <Err id="tf-longDescription-e" text={errors.longDescription} />
          </label>
          <fieldset className="ax-fs flex flex-col gap-3">
            <legend className={`${field.label} mb-1`}>Үнэ</legend>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-semibold">
              <input type="checkbox" checked={f.isFree} onChange={(e) => setF((x) => ({ ...x, isFree: e.target.checked, price: e.target.checked ? 0 : x.price }))} className="h-5 w-5" />
              Үнэгүй загвар
            </label>
            {!f.isFree && (
              <div className="grid gap-4 min-[600px]:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={field.label}>Үнэ *</span>
                  <input {...inp("price")} type="number" min={0} step={500} className={field.input} value={f.price || ""} onChange={(e) => set("price", Math.max(0, Number(e.target.value) || 0))} />
                  <Err id="tf-price-e" text={errors.price} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={field.label}>Валют</span>
                  <select className={field.input} value={f.currency} onChange={(e) => set("currency", e.target.value)}>
                    <option value="MNT">MNT (₮)</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
              </div>
            )}
          </fieldset>
        </section>

        <section className={section} aria-labelledby="sec-img">
          <h2 id="sec-img" className={h2}>
            2. Preview зургууд
          </h2>
          <p className={field.hint}>Эхний зураг нь cover болно. PNG, JPG, WEBP · 5MB хүртэл. Зураггүй бол ангиллын зурсан mock-up харагдана.</p>
          {f.previewImages.length > 0 && (
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {f.previewImages.map((img, i) => (
                <li key={img.path} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-sunken p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail from the public bucket */}
                  <img src={publicPreviewUrl(img.path)} alt="" className="h-16 w-24 rounded-lg border border-line object-cover" />
                  <span className="flex min-w-0 flex-[1_1_180px] flex-col gap-1">
                    {i === 0 && <span className="self-start rounded-md bg-lime px-2 py-0.5 text-xs font-extrabold">Cover</span>}
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-muted">Alt текст</span>
                      <input
                        className={field.input}
                        value={img.alt}
                        maxLength={200}
                        onChange={(e) => setF((x) => ({ ...x, previewImages: x.previewImages.map((y, j) => (j === i ? { ...y, alt: e.target.value } : y)) }))}
                      />
                    </label>
                  </span>
                  <span className="flex gap-1.5">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={btn.ghost} aria-label={`${i + 1}-р зургийг дээш`}>
                      ↑
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === f.previewImages.length - 1} className={btn.ghost} aria-label={`${i + 1}-р зургийг доош`}>
                      ↓
                    </button>
                    {i !== 0 && (
                      <button type="button" onClick={() => setF((x) => ({ ...x, previewImages: [x.previewImages[i], ...x.previewImages.filter((_, j) => j !== i)] }))} className={btn.ghost}>
                        Cover болгох
                      </button>
                    )}
                    <button type="button" onClick={() => setF((x) => ({ ...x, previewImages: x.previewImages.filter((_, j) => j !== i) }))} className={btn.danger}>
                      Хасах
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          )}
          {uploads
            .filter((u) => u.kind === "preview")
            .map((u) => (
              <UploadRow key={u.key} u={u} onRetry={() => runUpload(u)} onRemove={() => dropUpload(u.key)} />
            ))}
          <label className={`${btn.ghost} cursor-pointer self-start has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand`}>
            Зураг нэмэх
            <input ref={fileInput} type="file" multiple accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
          </label>
        </section>

        <section className={section} aria-labelledby="sec-content">
          <h2 id="sec-content" className={h2}>
            3. Агуулга ба ашиглах заавар
          </h2>
          <label className="flex flex-col gap-1.5">
            <span className={field.label}>Хэнд тохирох (нийтлэхэд *)</span>
            <textarea {...inp("forWhom")} rows={2} maxLength={2000} className={field.textarea} value={f.forWhom} onChange={(e) => set("forWhom", e.target.value)} />
            <Err id="tf-forWhom-e" text={errors.forWhom} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={field.label}>Юу багтсан — мөр бүрт нэг (нийтлэхэд *)</span>
            <textarea {...inp("included")} rows={4} className={field.textarea} value={includedText} onChange={(e) => setIncludedText(e.target.value)} />
            <Err id="tf-included-e" text={errors.included} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={field.label}>Ашиглах заавар — мөр бүрт нэг алхам (нийтлэхэд *)</span>
            <textarea {...inp("howTo")} rows={4} className={field.textarea} value={howToText} onChange={(e) => setHowToText(e.target.value)} />
            <Err id="tf-howTo-e" text={errors.howTo} />
          </label>
          <div className="grid gap-4 min-[600px]:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={field.label}>Шаардлагатай програм, бүртгэл (нийтлэхэд *)</span>
              <input {...inp("requirements")} className={field.input} maxLength={300} value={f.requirements} onChange={(e) => set("requirements", e.target.value)} />
              <Err id="tf-requirements-e" text={errors.requirements} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={field.label}>Формат (нийтлэхэд *)</span>
              <input {...inp("format")} className={field.input} maxLength={200} value={f.format} placeholder="Notion duplicate link, .xlsx файл…" onChange={(e) => set("format", e.target.value)} />
              <Err id="tf-format-e" text={errors.format} />
            </label>
          </div>
        </section>

        <section className={section} aria-labelledby="sec-file">
          <h2 id="sec-file" className={h2}>
            4. Хамгаалагдсан файл / хүргэх холбоос
          </h2>
          <p className={field.hint}>
            Нийтэд хэзээ ч харагдахгүй. Төлбөртэй бүтээгдэхүүнийг нийтлэхэд заавал. Хэрэглэгчид зөвхөн төлбөр гараар баталгаажсаны дараа хүсэлтийн хуудаснаас хугацаатай холбоос үүсгэж илгээнэ.
          </p>
          {uploads
            .filter((u) => u.kind === "file")
            .map((u) => (
              <UploadRow key={u.key} u={u} onRetry={() => runUpload(u)} onRemove={() => dropUpload(u.key)} />
            ))}
          {f.file?.storagePath ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-sunken p-3">
              <span className="min-w-0 flex-1 text-sm">
                <strong className="[overflow-wrap:anywhere]">{f.file.label || "Файл"}</strong>
                <span className="block text-xs text-muted">
                  Хамгаалагдсан (private) storage-д · {f.file.storagePath === p.initial.file?.storagePath ? "хадгалагдсан" : "шинэ — хадгалсны дараа хуучин файл устгагдана"}
                </span>
              </span>
              <label className={`${btn.ghost} cursor-pointer has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus`}>
                Файл солих
                <input type="file" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) uploadPrivate(e.target.files[0]); e.target.value = ""; }} />
              </label>
              <button type="button" className={btn.danger} onClick={() => set("file", null)}>
                Устгах
              </button>
              <Err id="tf-file-e" text={errors.file} />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className={`${btn.ghost} cursor-pointer self-start`}>
                Файл сонгох (200MB хүртэл)
                <input type="file" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) uploadPrivate(e.target.files[0]); e.target.value = ""; }} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={field.label}>Эсвэл хүргэх холбоос (Notion/Canva share link)</span>
                <input
                  {...inp("file")}
                  type="url"
                  className={field.input}
                  placeholder="https://…"
                  value={f.file?.externalUrl ?? ""}
                  onChange={(e) => set("file", e.target.value ? { storagePath: null, externalUrl: e.target.value, label: f.file?.label ?? "" } : null)}
                />
                <Err id="tf-file-e" text={errors.file} />
              </label>
            </div>
          )}
        </section>
      </form>

      <aside className="flex flex-col gap-4 min-[1100px]:sticky min-[1100px]:top-4" aria-label="Нийтлэх тохиргоо">
        <section className={section} aria-labelledby="sec-pub">
          <div className="flex items-center justify-between gap-2">
            <h2 id="sec-pub" className={h2}>
              5. Нийтлэх
            </h2>
            <PubPill published={status === "published"} />
          </div>
          <p className={field.hint}>
            “Ноорог хадгалах” нь дутуу агуулгыг зөвшөөрнө{status === "published" ? " — гэхдээ нийтлэгдсэн загварын өөрчлөлт шууд сайтад харагдана" : ""}. “Нийтлэх” нь бүх шаардлагатай талбарыг шалгана.
          </p>
          {dirty && <p className="rounded-[10px] bg-warn-bg px-3 py-2 text-[13px] font-bold text-warn-ink">Хадгалаагүй өөрчлөлт байна.</p>}
          {msg && (
            <p role={msg.kind === "err" ? "alert" : "status"} className={`rounded-[10px] px-3 py-2.5 text-sm font-bold ${msg.kind === "ok" ? "bg-soft text-brand" : "border border-danger-line bg-danger-bg text-danger-ink"}`}>
              {msg.kind === "ok" ? "✓ " : "✕ "}
              {msg.text}
            </p>
          )}
          <button type="button" disabled={pending} onClick={() => save("draft")} className={btn.ghost}>
            {pending ? "Хадгалж байна…" : status === "published" ? "Өөрчлөлт хадгалах" : "Ноорог хадгалах"}
          </button>
          {status !== "published" ? (
            <button type="button" disabled={pending} onClick={() => save("publish")} className={btn.primary}>
              Нийтлэх
            </button>
          ) : (
            <button type="button" disabled={pending} onClick={() => save("unpublish")} className={btn.danger}>
              Нийтлэлээс буулгах
            </button>
          )}
          {status === "published" && p.id && (
            <Link href={`/templates/${form.slug}`} target="_blank" className="text-sm font-bold">
              Сайт дээр харах ↗
            </Link>
          )}
        </section>
        <section className="flex flex-col gap-2" aria-label="Нийтийн картын preview">
          <span className="text-sm font-bold text-muted">Сайтын картын preview</span>
          <div className="pointer-events-none" aria-hidden="true">
            <TemplateCard t={previewT} />
          </div>
        </section>
      </aside>

      {/* Phones/tablets: the two save actions stay reachable above the tab bar. */}
      <div className="sticky bottom-[calc(84px+env(safe-area-inset-bottom))] z-20 col-span-full -mx-1 flex gap-2 rounded-2xl border border-line bg-elevated p-2 shadow-[0_16px_40px_-20px_var(--ax-shadow)] min-[1100px]:hidden">
        <button type="button" disabled={pending} onClick={() => save("draft")} className={`${btn.ghost} min-h-12 flex-1`}>
          {pending ? "Хадгалж байна…" : status === "published" ? "Хадгалах" : "Ноорог хадгалах"}
        </button>
        {status !== "published" ? (
          <button type="button" disabled={pending} onClick={() => save("publish")} className={`${btn.primary} min-h-12 flex-1`}>
            Нийтлэх
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => save("unpublish")} className={`${btn.danger} min-h-12 flex-1`}>
            Ноорог болгох
          </button>
        )}
      </div>
    </div>
  );
}
