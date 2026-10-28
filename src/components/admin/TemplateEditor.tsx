"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveTemplateAction, uploadTicketAction } from "@/app/admin/template-actions";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { PREVIEW_EXT, slugify, validateTemplate, type FormErrors, type TemplateForm } from "@/lib/admin/template-schema";
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

type Upload = { key: string; name: string; pct: number; error?: string };

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function Err({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <span id={id} className="text-[13px] font-bold text-danger">
      ✕ {text}
    </span>
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

  async function addImages(list: FileList | null) {
    if (!list) return;
    for (const file of Array.from(list)) {
      const key = `${Date.now()}-${file.name}`;
      const ext = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toLowerCase() ?? "";
      if (!PREVIEW_EXT.includes(ext)) {
        setUploads((u) => [...u, { key, name: file.name, pct: 0, error: "PNG, JPG, WEBP биш байна." }]);
        continue;
      }
      setUploads((u) => [...u, { key, name: file.name, pct: 0 }]);
      const t = await uploadTicketAction({ kind: "preview", folder: p.folder, name: file.name, size: file.size });
      if (!t.ok) {
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: t.message } : x)));
        continue;
      }
      try {
        await uploadWithProgress(t.bucket, t.path, t.token, file, (pct) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, pct } : x))));
        setF((x) => ({ ...x, previewImages: [...x.previewImages, { path: t.path, alt: form.title || file.name.replace(/\.[^.]+$/, "") }] }));
        setUploads((u) => u.filter((x) => x.key !== key));
      } catch {
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: "Хуулж чадсангүй. Дахин оролдоно уу." } : x)));
      }
    }
  }

  async function uploadPrivate(file: File) {
    const key = `file-${Date.now()}`;
    setUploads((u) => [...u, { key, name: file.name, pct: 0 }]);
    const t = await uploadTicketAction({ kind: "file", folder: p.folder, name: file.name, size: file.size });
    if (!t.ok) return setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: t.message } : x)));
    try {
      await uploadWithProgress(t.bucket, t.path, t.token, file, (pct) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, pct } : x))));
      set("file", { storagePath: t.path, externalUrl: null, label: f.file?.label || file.name });
      setUploads((u) => u.filter((x) => x.key !== key));
    } catch {
      setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: "Хуулж чадсангүй. Дахин оролдоно уу." } : x)));
    }
  }

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
            <span className={field.hint}>/templates/{f.slug || "…"} — нийтэлсний дараа солиход хуучин холбоос ажиллахаа болино.</span>
            <Err id="tf-slug-e" text={errors.slug} />
          </label>
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
                <li key={img.path} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg p-2.5">
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
          {uploads.map((u) => (
            <div key={u.key} role={u.error ? "alert" : "status"} className="flex flex-col gap-1.5 rounded-xl border border-line p-2.5 text-sm">
              <span className="font-bold [overflow-wrap:anywhere]">{u.name}</span>
              {u.error ? (
                <span className="font-bold text-danger">✕ {u.error}</span>
              ) : (
                <>
                  <span className="h-2 overflow-hidden rounded bg-soft" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={u.pct} aria-label={`${u.name} хуулж байна`}>
                    <span className="block h-full bg-brand transition-[width]" style={{ width: `${u.pct}%` }} />
                  </span>
                  <span className="text-muted">{u.pct}%</span>
                </>
              )}
            </div>
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
          <p className={field.hint}>Нийтэд хэзээ ч харагдахгүй. Хүсэлтийн хуудаснаас хугацаатай татах холбоос үүсгэж гараар илгээнэ.</p>
          {f.file?.storagePath ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg p-3">
              <span className="min-w-0 flex-1 text-sm">
                <strong className="[overflow-wrap:anywhere]">{f.file.label || "Файл"}</strong>
                <span className="block text-xs text-muted">Private bucket-д хадгалагдсан</span>
              </span>
              <label className={`${btn.ghost} cursor-pointer`}>
                Файл солих
                <input type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && uploadPrivate(e.target.files[0])} />
              </label>
              <button type="button" className={btn.danger} onClick={() => set("file", null)}>
                Устгах
              </button>
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
    </div>
  );
}
