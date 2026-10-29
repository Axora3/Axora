import { Suspense } from "react";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackToList, CopyButton } from "@/components/admin/client";
import { RequestStatusForm } from "@/components/admin/forms";
import { NotesHistory } from "@/components/admin/NotesHistory";
import { RequestPaymentPanel, type RequestInfo } from "@/components/admin/RequestControls";
import { Body, LoadFailed, Notice, PageHeader, Panel, PaymentPill, PubPill, StatusPill } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { REQUEST_OVERDUE_HOURS } from "@/lib/admin/config";
import { isMissingMigration, MIGRATION_HINT } from "@/lib/admin/db-errors";
import { CHANNEL_LABEL, DELIVERY_STATUS, fmtDateTime, hoursSince, shortId } from "@/lib/admin/labels";
import { formatPrice } from "@/lib/templates/types";

export const metadata = { title: "Template хүсэлт" };

const BASE = "id, customer_name, contact_channel, contact_value, note, status, created_at, updated_at, template_id, templates(id, title, slug, status, is_free, price, currency)";
const FULL = `${BASE}, first_contacted_at, price_snapshot, currency_snapshot, is_free_snapshot, payment_status, payment_confirmed_by, payment_confirmed_at, payment_confirmed_amount, payment_confirmed_currency, payment_amount_source, delivery_status, delivery_link_created_at`;

type Req = {
  id: string;
  customer_name: string;
  contact_channel: string;
  contact_value: string;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  first_contacted_at?: string | null;
  price_snapshot?: number | null;
  currency_snapshot?: string | null;
  is_free_snapshot?: boolean | null;
  payment_status?: string;
  payment_confirmed_by?: string | null;
  payment_confirmed_at?: string | null;
  payment_confirmed_amount?: number | null;
  payment_confirmed_currency?: string | null;
  payment_amount_source?: string | null;
  delivery_status?: string;
  delivery_link_created_at?: string | null;
  templates: { id: string; title: string; slug: string; status: string; is_free: boolean; price: number; currency: string } | null;
};

async function RequestDetailContent({ params }: PageProps<"/admin/template-requests/[id]">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { db, user } = c.ctx;
  let res = await db.from("template_requests").select(FULL).eq("id", id).maybeSingle();
  const migrationMissing = isMissingMigration(res.error);
  if (migrationMissing) res = await db.from("template_requests").select(BASE).eq("id", id).maybeSingle();
  if (res.error) return <Body><LoadFailed what="хүсэлтийг" /></Body>;
  const r = res.data as unknown as Req | null;
  if (!r) notFound();
  const t = r.templates;
  const contactHref = r.contact_channel === "email" ? `mailto:${r.contact_value}` : r.contact_channel === "phone" ? `tel:${r.contact_value.replace(/\s/g, "")}` : null;
  const snapshotLabel = r.price_snapshot != null && r.currency_snapshot ? formatPrice({ isFree: !!r.is_free_snapshot, price: Number(r.price_snapshot), currency: r.currency_snapshot }) : null;
  const overdue = r.status === "new" && !r.first_contacted_at && hoursSince(r.created_at) >= REQUEST_OVERDUE_HOURS;
  const info: RequestInfo = {
    id: r.id,
    updatedAt: r.updated_at,
    status: r.status,
    paymentStatus: r.payment_status ?? "needs_review",
    deliveryStatus: r.delivery_status ?? "not_sent",
    customer: r.customer_name,
    product: t?.title ?? "Загвар",
    channelLabel: CHANNEL_LABEL[r.contact_channel] ?? r.contact_channel,
    contact: r.contact_value,
    priceLabel: snapshotLabel,
    priceAmount: r.price_snapshot != null ? Number(r.price_snapshot) : null,
    currency: r.currency_snapshot ?? null,
  };

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin/template-requests", label: "Хүсэлтүүд" }]}
        title={t?.title ?? "Template хүсэлт"}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono">{shortId(r.id)}</span> · {fmtDateTime(r.created_at)} · <StatusPill kind="request" status={r.status} />
            {!migrationMissing && <PaymentPill status={info.paymentStatus} />}
          </span>
        }
        actions={<BackToList storageKey="admin-requests-list" fallback="/admin/template-requests" label="Жагсаалт" />}
      />
      <Body>
        {migrationMissing && <Notice tone="warn">{MIGRATION_HINT}</Notice>}
        {overdue && (
          <p role="status" className="rounded-xl border border-danger-line bg-danger-bg p-3.5 text-sm font-bold text-danger-ink">
            ! {REQUEST_OVERDUE_HOURS}+ цаг анхны холбоо тогтоогоогүй байна. (Дотоод сануулга — хэрэглэгчид амласан хугацаа биш.)
          </p>
        )}
        <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Panel title="Хүсэлт" id="rq-main">
              <dl className="m-0 flex flex-col gap-3 p-[18px] text-[15px]">
                <div>
                  <dt className="text-sm font-bold text-muted">Бүтээгдэхүүн</dt>
                  <dd className="m-0 flex flex-wrap items-center gap-2">
                    {t ? (
                      <>
                        <Link href={`/admin/templates/${t.id}/edit`} className="font-bold">
                          {t.title}
                        </Link>
                        <PubPill published={t.status === "published"} />
                        {t.status === "published" && (
                          <a href={`/templates/${t.slug}`} target="_blank" rel="noopener" className="text-sm font-bold">
                            Сайт дээр ↗
                          </a>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                {!migrationMissing && (
                  <div>
                    <dt className="text-sm font-bold text-muted">Хүсэлт ирэх үеийн үнэ</dt>
                    <dd className="m-0">
                      {snapshotLabel ?? <span className="font-bold text-danger">Хадгалагдаагүй — баталгаажуулах шаардлагатай</span>}
                      {t && snapshotLabel && formatPrice({ isFree: t.is_free, price: Number(t.price), currency: t.currency }) !== snapshotLabel && (
                        <span className="block text-[13px] text-muted">Одоогийн үнэ: {formatPrice({ isFree: t.is_free, price: Number(t.price), currency: t.currency })} (хүсэлтэд нөлөөлөхгүй)</span>
                      )}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-bold text-muted">Хэрэглэгч</dt>
                  <dd className="m-0 font-bold">{r.customer_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-bold text-muted">Холбоо барих — {info.channelLabel}</dt>
                  <dd className="m-0 flex flex-wrap items-center gap-2">
                    <span className="font-bold [overflow-wrap:anywhere]">{r.contact_value}</span>
                    <CopyButton value={r.contact_value} label="Холбоо барих" />
                    {contactHref && (
                      <a href={contactHref} className="inline-flex min-h-11 items-center rounded-[10px] border border-line-strong px-3 text-[13px] font-bold text-ink no-underline">
                        {r.contact_channel === "email" ? "Имэйл нээх" : "Залгах"}
                      </a>
                    )}
                  </dd>
                </div>
                {!migrationMissing && (
                  <div>
                    <dt className="text-sm font-bold text-muted">Анхны холбоо</dt>
                    <dd className="m-0">{r.first_contacted_at ? fmtDateTime(r.first_contacted_at) : "Тогтоогоогүй"}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-bold text-muted">Нэмэлт тайлбар</dt>
                  <dd className="m-0 whitespace-pre-wrap">{r.note || <span className="text-faint">Бичээгүй</span>}</dd>
                </div>
              </dl>
            </Panel>
            <Panel title="Тэмдэглэл ба түүх" id="rq-notes">
              <div className="p-[18px]">
                <NotesHistory db={db} entityType="template_request" entityId={r.id} meId={user.id} />
              </div>
            </Panel>
          </div>
          <aside className="flex flex-col gap-4" aria-label="Үйлдэл">
            {!migrationMissing && (
              <Panel title="Төлбөр ба хүргэлт" id="rq-pay">
                <div className="flex flex-col gap-3 p-[18px]">
                  <RequestPaymentPanel
                    r={info}
                    confirmedBy={r.payment_confirmed_by ? (r.payment_confirmed_by === user.id ? "Та" : `Админ ${r.payment_confirmed_by.slice(0, 6)}`) : "Админ (устгагдсан)"}
                    confirmedAt={r.payment_confirmed_at ? fmtDateTime(r.payment_confirmed_at) : null}
                    confirmedAmount={r.payment_confirmed_amount != null ? formatPrice({ isFree: false, price: Number(r.payment_confirmed_amount), currency: r.payment_confirmed_currency ?? "MNT" }) : null}
                    source={r.payment_amount_source ?? null}
                  />
                  <p className="text-[13px] text-muted">
                    Хүргэлт: <strong>{DELIVERY_STATUS[info.deliveryStatus] ?? info.deliveryStatus}</strong>
                    {r.delivery_link_created_at && ` · сүүлд ${fmtDateTime(r.delivery_link_created_at)}`}
                  </p>
                </div>
              </Panel>
            )}
            <Panel title="Хүсэлтийн төлөв" id="rq-status">
              <div className="p-[18px]">
                <RequestStatusForm id={r.id} updatedAt={r.updated_at} status={r.status} paymentStatus={info.paymentStatus} />
              </div>
            </Panel>
          </aside>
        </div>
      </Body>
    </>
  );
}

export default function RequestDetail(props: PageProps<"/admin/template-requests/[id]">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <RequestDetailContent {...props} />
    </Suspense>
  );
}
