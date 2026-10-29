import { Suspense } from "react";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { notFound } from "next/navigation";
import { BackToList, CopyButton, Tabs } from "@/components/admin/client";
import { AttachmentActions, OrderStatusForm } from "@/components/admin/forms";
import { NotesHistory } from "@/components/admin/NotesHistory";
import { OrderDesignPreview } from "@/components/admin/OrderDesignPreview";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { Body, LoadFailed, PageHeader, Panel } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { CHANNEL_LABEL, fmtDate, fmtDateTime } from "@/lib/admin/labels";
import { STYLES, TYPES, type BuilderConfig, type BusinessType, type StyleId } from "@/lib/builder/config";
import { formatSize } from "@/lib/order/attachments";
import { ALL_FIELDS, STEPS, contactExtraLabel, formatAnswer, isVisible, type Answers, type Field } from "@/lib/order/questions";

export const metadata = { title: "Захиалгын дэлгэрэнгүй" };

const UPLOAD: Record<string, { text: string; tone: string }> = {
  uploaded: { text: "✓ Серверт хадгалагдсан", tone: "text-brand" },
  pending: { text: "… Илгээгдээгүй (хэрэглэгч дуусгаагүй)", tone: "text-warn" },
  failed: { text: "✕ Илгээхэд алдаа гарсан", tone: "text-danger" },
  rejected: { text: "✕ Шалгалтад тэнцээгүй (устгагдсан)", tone: "text-danger" },
  expired: { text: "✕ Хугацаа дууссан (цэвэрлэгдсэн)", tone: "text-muted" },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-0.5 border-b border-soft py-2.5 last:border-b-0 [grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr))]">
      <dt className="text-sm font-bold text-muted">{label}</dt>
      <dd className="m-0 text-[15px] leading-normal [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function Answer({ f, a }: { f: Field; a: Answers }) {
  if (f.kind === "multi") {
    const list = Array.isArray(a[f.id]) ? (a[f.id] as string[]) : [];
    if (!list.length) return <span className="text-faint">Бөглөөгүй</span>;
    return (
      <span className="flex flex-wrap gap-1.5">
        {list.map((x) => (
          <span key={x} className="rounded-lg bg-soft px-2 py-1 text-[13px] font-bold text-ink">
            {x === "Бусад" && a[f.id + "o"] ? `Бусад: ${a[f.id + "o"]}` : x}
          </span>
        ))}
      </span>
    );
  }
  if (f.kind === "color") {
    const v = formatAnswer(f, a);
    if (!v) return <span className="text-faint">Бөглөөгүй</span>;
    return (
      <span className="inline-flex items-center gap-2 font-mono">
        {/^#[0-9A-F]{6}$/i.test(v) && <span aria-hidden="true" className="h-5 w-5 rounded-md border border-line-strong" style={{ background: v }} />}
        {v}
      </span>
    );
  }
  if (f.kind === "file") {
    const parts = [a[f.id + "d"] ? `Drive: ${a[f.id + "d"]}` : "", a[f.id + "l"] === true ? "Дараа илгээнэ" : ""].filter(Boolean);
    return parts.length ? <span>{parts.join(" · ")}</span> : <span className="text-faint">Хавсралт табыг үзнэ үү</span>;
  }
  const v = formatAnswer(f, a);
  return v ? <span className="whitespace-pre-wrap">{v}</span> : <span className="text-faint">Бөглөөгүй</span>;
}

async function OrderDetailContent({ params, searchParams }: PageProps<"/admin/orders/[id]">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const { id } = await params;
  const tab = (await searchParams).tab;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { db, user } = c.ctx;
  const { data: o, error } = await db.from("website_orders").select("*").eq("id", id).maybeSingle();
  if (error) return <Body><LoadFailed what="захиалгыг" /></Body>;
  if (!o) notFound();
  const { data: atts, error: attErr } = await db.from("order_attachments").select("id, field, original_name, mime_type, size_bytes, upload_status, created_at").eq("order_id", id).order("created_at");

  const a = (o.answers ?? {}) as Answers;
  const get = (fid: string) => ALL_FIELDS.find((f) => f.id === fid)!;
  const fa = (fid: string) => formatAnswer(get(fid), a) || "—";

  const cfg: BuilderConfig | null =
    o.builder_type && o.builder_style && o.builder_primary
      ? {
          v: 1,
          type: o.builder_type as BusinessType,
          style: o.builder_style as StyleId,
          palette: o.builder_palette ?? "custom",
          // Colours come from the stored snapshot, never from today's palette presets.
          colors: { primary: o.builder_primary, secondary: o.builder_secondary ?? "#EEEEEE", bg: o.builder_bg ?? "#FFFFFF" },
          name: o.builder_name ?? "",
          headline: o.builder_headline ?? "",
          desc: o.builder_description ?? "",
          cta: o.builder_cta ?? "",
          edited: {},
          touched: true,
        }
      : null;
  const missing = (atts ?? []).filter((x) => x.upload_status !== "uploaded").length;

  const overview = (
    <Panel>
      <dl className="m-0 px-[18px] py-2">
        <Row label="Захиалагч">{o.full_name}</Row>
        <Row label="Бизнесийн чиглэл">{fa("q3")}</Row>
        <Row label="Вебийн төрөл">{o.website_type ?? "—"}</Row>
        <Row label="Гол зорилго"><Answer f={get("q13")} a={a} /></Row>
        <Row label="Төсвийн хүрээ">{o.budget ?? "Бөглөөгүй"} <span className="text-[13px] text-muted">(хэрэглэгчийн сонголт, орлого биш)</span></Row>
        <Row label="Хүссэн хугацаа (хэрэглэгч)">{o.timeline ?? "—"}</Row>
        <Row label="Тохиролцсон хугацаа (админ)">{o.agreed_deadline ? fmtDate(o.agreed_deadline) : "Тохиролцоогүй"}</Row>
        <Row label="Домэйн">{fa("q32")}{a.q33 ? ` · ${a.q33}` : ""}</Row>
        <Row label="Шаардлагатай функц"><Answer f={get("q29")} a={a} /></Row>
        <Row label="Хэл"><Answer f={get("q28")} a={a} /></Row>
      </dl>
    </Panel>
  );

  const answers = (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-muted">Хэрэглэгчийн илгээсэн анхны хариулт — зөвхөн унших. Тайлбараа дотоод тэмдэглэлд бичнэ үү.</p>
      {STEPS.map((st, i) => (
        <Panel key={st.title} title={`${i + 1}. ${st.title}`} id={`ans-${i}`}>
          <dl className="m-0 px-[18px] py-2">
            {st.fields
              .filter((f) => !["toggle", "note", "builder", "consent"].includes(f.kind) && isVisible(f, a, { showLinks: true }))
              .map((f) => (
                <Row key={f.id} label={`${f.n}. ${f.id === "q38x" ? contactExtraLabel(a) : f.label}`}>
                  <Answer f={f} a={a} />
                </Row>
              ))}
            {i === 6 && <Row label="39. Зөвшөөрөл">{o.consent_processing ? `Зөвшөөрсөн · ${fmtDateTime(o.consent_at)} (сервер тэмдэглэсэн)` : "—"}</Row>}
          </dl>
        </Panel>
      ))}
    </div>
  );

  const design = cfg ? (
    <div className="flex flex-col gap-4">
      <Panel>
        <dl className="m-0 px-[18px] py-2">
          <Row label="Бизнесийн төрөл">{TYPES[cfg.type]?.label ?? cfg.type}</Row>
          <Row label="Хэв маяг">{STYLES[cfg.style]?.label ?? cfg.style}</Row>
          <Row label="Palette">{cfg.palette === "custom" ? "Өөрийн өнгө" : cfg.palette}</Row>
          <Row label="Өнгө">
            <span className="flex flex-wrap gap-3">
              {(
                [
                  ["Үндсэн", cfg.colors.primary],
                  ["Нэмэлт", cfg.colors.secondary],
                  ["Суурь", cfg.colors.bg],
                ] as const
              ).map(([l, h]) => (
                <span key={l} className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="h-7 w-7 rounded-lg border border-line-strong" style={{ background: h }} />
                  <span className="text-sm">
                    {l} <span className="font-mono">{h}</span>
                  </span>
                </span>
              ))}
            </span>
          </Row>
          <Row label="Бизнесийн нэр">{cfg.name || "—"}</Row>
          <Row label="Гарчиг">{cfg.headline || "—"}</Row>
          <Row label="Тайлбар">{cfg.desc || "—"}</Row>
          <Row label="CTA">{cfg.cta || "—"}</Row>
        </dl>
      </Panel>
      <OrderDesignPreview config={cfg} />
    </div>
  ) : (
    <Panel>
      <p className="p-[18px] text-[15px] text-muted">Хэрэглэгч Live demo ашиглаагүй. Анкетын 17–19-р асуултын хариултыг Анкет табаас үзнэ үү.</p>
    </Panel>
  );

  const files = attErr ? (
    <LoadFailed what="хавсралтуудыг" />
  ) : (
    <Panel>
      {!atts?.length ? (
        <p className="p-[18px] text-[15px] text-muted">
          Файл хавсаргаагүй.{a.q22d || a.q27d ? " Drive холбоосыг Анкет табаас үзнэ үү." : ""}
          {a.q22l === true || a.q27l === true ? " Хэрэглэгч “Дараа илгээнэ” гэж сонгосон." : ""}
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {atts.map((f) => (
            <li key={f.id} className="flex flex-col gap-2 border-t border-soft px-[18px] py-3.5 first:border-t-0">
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <strong className="text-[15px] [overflow-wrap:anywhere]">{f.original_name}</strong>
                <span className="text-[13px] text-muted">
                  {f.field === "q22" ? "Лого, брэнд" : "Зураг"} · {f.mime_type} · {formatSize(Number(f.size_bytes))}
                </span>
              </span>
              <span className={`text-[13px] font-bold ${UPLOAD[f.upload_status]?.tone ?? ""}`}>{UPLOAD[f.upload_status]?.text ?? f.upload_status}</span>
              <AttachmentActions id={f.id} name={f.original_name} mime={f.mime_type} uploaded={f.upload_status === "uploaded"} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );

  const channel = CHANNEL_LABEL[o.preferred_channel] ?? o.preferred_channel;

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin/orders", label: "Веб захиалгууд" }]}
        title={o.business_name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono">{o.reference}</span> · {fmtDateTime(o.created_at)}
          </span>
        }
        actions={
          <>
            <OrderStatusControl id={o.id} updatedAt={o.updated_at} status={o.status} title={o.business_name} reference={o.reference} size="md" />
            <BackToList storageKey="admin-orders-list" fallback="/admin/orders" label="Жагсаалт" />
          </>
        }
      />
      <Body>
        <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <Tabs
              initial={typeof tab === "string" ? tab : undefined}
              tabs={[
                { id: "overview", label: "Тойм", content: overview },
                { id: "answers", label: "Анкет", content: answers },
                { id: "design", label: "Дизайн", content: design },
                { id: "files", label: `Хавсралт${atts?.length ? ` (${atts.length})` : ""}${missing ? " · дутуу" : ""}`, content: files },
                { id: "notes", label: "Тэмдэглэл ба түүх", content: <Panel><div className="p-[18px]"><NotesHistory db={db} entityType="order" entityId={id} meId={user.id} /></div></Panel> },
              ]}
            />
          </div>
          <aside aria-label="Товч мэдээлэл" className="flex flex-col gap-4 min-[1100px]:sticky min-[1100px]:top-4">
            <Panel title="Төлөв ба хугацаа" id="side-status">
              <div className="p-[18px]">
                <OrderStatusForm id={o.id} updatedAt={o.updated_at} status={o.status} agreed={o.agreed_deadline} next={o.next_contact_on} />
              </div>
            </Panel>
            <Panel title="Холбоо барих" id="side-contact">
              <div className="flex flex-col gap-3 p-[18px] text-[15px]">
                <p>
                  Сонгосон суваг: <strong>{channel}</strong>
                  {a.q38x ? ` — ${a.q38x}` : ""}
                </p>
                {[
                  ["Утас", o.phone, `tel:${String(o.phone).replace(/\s/g, "")}`, "Залгах"],
                  ["Имэйл", o.email, `mailto:${o.email}`, "Имэйл нээх"],
                ].map(([l, v, href, act]) => (
                  <div key={l} className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-bold text-muted">{l}</span>
                    <span className="font-bold [overflow-wrap:anywhere]">{v}</span>
                    <span className="flex flex-wrap gap-2">
                      <CopyButton value={v} label={l} />
                      <a href={href} className="inline-flex min-h-11 items-center rounded-[10px] border border-line-strong px-3 text-[13px] font-bold text-ink no-underline">
                        {act}
                      </a>
                    </span>
                  </div>
                ))}
                {(a.q6 || a.q7 || a.q8) && (
                  <p className="text-sm text-muted">Сошиал: {[a.q6, a.q7, a.q8].filter(Boolean).join(" · ")}</p>
                )}
                <p className="text-[13px] text-muted">Товчнууд таны төхөөрөмжийн апп-ыг нээнэ — автоматаар мессеж илгээгдэхгүй.</p>
              </div>
            </Panel>
          </aside>
        </div>
      </Body>
    </>
  );
}

export default function OrderDetail(props: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <OrderDetailContent {...props} />
    </Suspense>
  );
}
