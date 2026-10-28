import Link from "next/link";
import { notFound } from "next/navigation";
import { BackToList, CopyButton } from "@/components/admin/client";
import { DownloadLinkForm, RequestStatusForm } from "@/components/admin/forms";
import { NotesHistory } from "@/components/admin/NotesHistory";
import { Body, LoadFailed, PageHeader, Panel, PubPill, StatusPill } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { CHANNEL_LABEL, fmtDateTime, shortId } from "@/lib/admin/labels";
import { formatPrice } from "@/lib/templates/types";

export const metadata = { title: "Загварын хүсэлт" };

export default async function RequestDetail({ params }: PageProps<"/admin/template-requests/[id]">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { db, user } = c.ctx;
  const { data: r, error } = await db
    .from("template_requests")
    .select("id, customer_name, contact_channel, contact_value, note, status, created_at, updated_at, template_id, templates(id, title, slug, status, is_free, price, currency)")
    .eq("id", id)
    .maybeSingle();
  if (error) return <Body><LoadFailed what="хүсэлтийг" /></Body>;
  if (!r) notFound();
  const t = r.templates as unknown as { id: string; title: string; slug: string; status: string; is_free: boolean; price: number; currency: string } | null;
  const contactHref = r.contact_channel === "email" ? `mailto:${r.contact_value}` : r.contact_channel === "phone" ? `tel:${r.contact_value.replace(/\s/g, "")}` : null;

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin/template-requests", label: "Загварын хүсэлтүүд" }]}
        title={t?.title ?? "Загварын хүсэлт"}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono">{shortId(r.id)}</span> · {fmtDateTime(r.created_at)} · <StatusPill kind="request" status={r.status} />
          </span>
        }
        actions={<BackToList storageKey="admin-requests-list" fallback="/admin/template-requests" label="Жагсаалт руу буцах" />}
      />
      <Body>
        <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Panel title="Хүсэлт" id="rq-main">
              <dl className="m-0 flex flex-col gap-3 p-[18px] text-[15px]">
                <div>
                  <dt className="text-sm font-bold text-muted">Загвар</dt>
                  <dd className="m-0 flex flex-wrap items-center gap-2">
                    {t ? (
                      <>
                        <Link href={`/admin/templates/${t.id}/edit`} className="font-bold">
                          {t.title}
                        </Link>
                        <PubPill published={t.status === "published"} />
                        <span className="text-sm text-muted">{formatPrice({ isFree: t.is_free, price: Number(t.price), currency: t.currency })}</span>
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
                <div>
                  <dt className="text-sm font-bold text-muted">Хэрэглэгч</dt>
                  <dd className="m-0 font-bold">{r.customer_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-bold text-muted">Холбоо барих — {CHANNEL_LABEL[r.contact_channel] ?? r.contact_channel}</dt>
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
            <Panel title="Төлөв" id="rq-status">
              <div className="p-[18px]">
                <RequestStatusForm id={r.id} updatedAt={r.updated_at} status={r.status} />
              </div>
            </Panel>
            <Panel title="Хүргэх холбоос" id="rq-link">
              <div className="p-[18px]">
                <DownloadLinkForm requestId={r.id} />
              </div>
            </Panel>
          </aside>
        </div>
      </Body>
    </>
  );
}
