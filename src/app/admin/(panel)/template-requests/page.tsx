import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { RememberListUrl } from "@/components/admin/client";
import { RequestCardActions, type RequestInfo } from "@/components/admin/RequestControls";
import { Body, EmptyState, LoadFailed, Notice, PageHeader, Pagination, Panel, PaymentPill, StatusPill, btn, field } from "@/components/admin/ui";
import { Search } from "@/components/icons";
import { requireAdminPage } from "@/lib/admin/auth";
import { REQUEST_OVERDUE_HOURS } from "@/lib/admin/config";
import { isMissingMigration, MIGRATION_HINT } from "@/lib/admin/db-errors";
import { CHANNEL_LABEL, REQUEST_STATUS, REQUEST_STATUSES, fmtAgo, fmtDateTime, hoursSince } from "@/lib/admin/labels";
import { serverNow } from "@/lib/admin/period";
import { PAGE_SIZE, hrefWith, one, page as pageOf, safeSearch } from "@/lib/admin/query";
import { formatPrice } from "@/lib/templates/types";

export const metadata = { title: "Template хүсэлтүүд" };

type Row = {
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
  delivery_status?: string;
  templates: { title: string; category: string } | null;
};

const BASE = "id, customer_name, contact_channel, contact_value, note, status, created_at, updated_at, templates(title, category)";
const FULL = `${BASE}, first_contacted_at, price_snapshot, currency_snapshot, is_free_snapshot, payment_status, delivery_status`;

async function RequestsPageContent({ searchParams }: PageProps<"/admin/template-requests">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  await connection();
  const { db } = c.ctx;
  const sp = await searchParams;
  const q = safeSearch(one(sp, "q"));
  const status = (REQUEST_STATUSES as readonly string[]).includes(one(sp, "status")) ? one(sp, "status") : "";
  const payOpen = one(sp, "pay") === "open";
  const page = pageOf(sp);

  const run = (cols: string, withPay: boolean) => {
    let query = db.from("template_requests").select(cols, { count: "exact" });
    if (q) query = query.or(`customer_name.ilike."*${q}*",contact_value.ilike."*${q}*"`);
    if (status) query = query.eq("status", status);
    if (withPay && payOpen) query = query.in("payment_status", ["pending", "needs_review"]).neq("status", "cancelled");
    return query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  };
  let res = await run(FULL, true);
  // Before the payments migration runs, the list still works without those columns.
  const migrationMissing = isMissingMigration(res.error);
  if (migrationMissing) res = await run(BASE, false);
  const { data, count, error } = res as unknown as { data: Row[] | null; count: number | null; error: unknown };

  const head = { count: "exact" as const, head: true };
  const tabCounts = await Promise.all([db.from("template_requests").select("id", head), ...REQUEST_STATUSES.map((s) => db.from("template_requests").select("id", head).eq("status", s))]);
  const tabs = [{ id: "", label: "Бүгд", n: tabCounts[0].count }, ...REQUEST_STATUSES.map((s, i) => ({ id: s, label: REQUEST_STATUS[s].label, n: tabCounts[i + 1].count }))];

  const total = count ?? 0;
  const filtered = !!(q || status || payOpen);
  const nowMs = serverNow();

  return (
    <>
      <Suspense>
        <RememberListUrl storageKey="admin-requests-list" />
      </Suspense>
      <PageHeader title="Хүсэлтүүд" description={<span className="max-md:hidden">“Авах хүсэлт”-ээр ирсэн template хүсэлт. Хүсэлт ирсэн нь төлбөр төлөгдсөн гэсэн үг биш.</span>}>
        <form method="get" role="search" className="relative flex items-center" aria-label="Хүсэлт хайх">
          {status && <input type="hidden" name="status" value={status} />}
          <span aria-hidden="true" className="pointer-events-none absolute left-3.5 text-muted">
            <Search size={18} />
          </span>
          <label htmlFor="req-q" className="sr-only">
            Нэр, утас, имэйлээр хайх
          </label>
          <input id="req-q" name="q" type="search" enterKeyHint="search" defaultValue={one(sp, "q")} placeholder="Нэр, утас, имэйл" className={`${field.input} min-h-12 rounded-[13px] bg-surface pl-11`} />
        </form>
        <nav aria-label="Төлөвөөр шүүх" className="ax-scroll -mx-[clamp(16px,3vw,32px)] gap-1.5 px-[clamp(16px,3vw,32px)]">
          {tabs.map((t) => {
            const on = status === t.id && !payOpen;
            return (
              <Link
                key={t.id || "all"}
                href={hrefWith("/admin/template-requests", sp, { status: t.id || null, page: null, pay: null })}
                aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-bold no-underline ${on ? "border-band bg-band text-on-band" : "border-line bg-surface text-ink"}`}
              >
                {t.label}
                {t.n != null && <span className={`min-w-5 rounded-full px-1.5 text-center text-[11.5px] font-extrabold tabular-nums ${on ? "bg-lime text-on-lime" : "bg-soft text-muted"}`}>{t.n}</span>}
              </Link>
            );
          })}
          {!migrationMissing && (
            <Link
              href={hrefWith("/admin/template-requests", sp, { pay: payOpen ? null : "open", status: null, page: null })}
              aria-current={payOpen ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-3.5 text-[13.5px] font-bold no-underline ${payOpen ? "border-band bg-band text-on-band" : "border-line bg-surface text-ink"}`}
            >
              Төлбөр шалгах
            </Link>
          )}
        </nav>
      </PageHeader>
      <Body>
        {migrationMissing && <Notice tone="warn">{MIGRATION_HINT}</Notice>}
        <p aria-live="polite" className="text-[13.5px] font-bold text-muted">
          {error ? "—" : `${total} хүсэлт`}
          {filtered && (
            <>
              {" · "}
              <Link href="/admin/template-requests" className="font-bold">
                Цэвэрлэх
              </Link>
            </>
          )}
        </p>
        {error ? (
          <LoadFailed what="хүсэлтүүдийг" />
        ) : !data?.length ? (
          <Panel>
            <EmptyState title={filtered ? "Тохирох хүсэлт олдсонгүй" : "Одоогоор хүсэлт алга"} text={filtered ? undefined : "Загварын хуудаснаас “Авах хүсэлт” ирмэгц энд харагдана."} />
          </Panel>
        ) : (
          <>
            <ul className="m-0 grid list-none gap-2.5 p-0 min-[900px]:grid-cols-2 min-[1400px]:grid-cols-3">
              {data.map((r) => {
                const t = r.templates;
                const priceLabel =
                  r.price_snapshot != null && r.currency_snapshot ? formatPrice({ isFree: !!r.is_free_snapshot, price: Number(r.price_snapshot), currency: r.currency_snapshot }) : null;
                const age = hoursSince(r.created_at, nowMs);
                // Only new, never-contacted requests get the waiting warning.
                const overdue = r.status === "new" && !r.first_contacted_at && age >= REQUEST_OVERDUE_HOURS;
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
                  priceLabel,
                  priceAmount: r.price_snapshot != null ? Number(r.price_snapshot) : null,
                  currency: r.currency_snapshot ?? null,
                };
                return (
                  <li key={r.id} className={`flex flex-col gap-3 rounded-[18px] border bg-surface p-3.5 ${overdue ? "border-danger-line" : "border-line"}`}>
                    <div className="flex items-start gap-3">
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-[11px] font-extrabold tracking-[0.06em] text-muted uppercase">
                          {t?.category ?? "—"} · {priceLabel ?? "Үнэ хадгалагдаагүй"}
                        </span>
                        <Link href={`/admin/template-requests/${r.id}`} className="text-[15px] leading-snug font-extrabold text-ink no-underline">
                          {info.product}
                        </Link>
                      </span>
                      <StatusPill kind="request" status={r.status} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <strong className="text-[14.5px]">{r.customer_name}</strong>
                      <span className="text-[12.5px] [overflow-wrap:anywhere] text-muted">
                        {info.channelLabel} · {r.contact_value}
                      </span>
                    </div>
                    {r.note && <p className="line-clamp-2 rounded-xl bg-soft-2 px-3 py-2 text-[13.5px] leading-normal">“{r.note}”</p>}
                    <div className="flex flex-wrap items-center gap-2">
                      {!migrationMissing && <PaymentPill status={info.paymentStatus} />}
                      <time dateTime={r.created_at} title={fmtDateTime(r.created_at)} className={`text-xs font-bold ${overdue ? "text-danger" : "text-muted"}`}>
                        {overdue && <span aria-hidden="true">! </span>}
                        {fmtAgo(r.created_at, nowMs)}
                        {overdue && ` · ${REQUEST_OVERDUE_HOURS}+ цаг хариугүй`}
                      </time>
                    </div>
                    {!migrationMissing && <RequestCardActions r={info} detailHref={`/admin/template-requests/${r.id}`} />}
                    {migrationMissing && (
                      <Link href={`/admin/template-requests/${r.id}`} className={btn.ghost}>
                        Дэлгэрэнгүй
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            <Panel>
              <Pagination page={page} pages={Math.max(1, Math.ceil(total / PAGE_SIZE))} total={total} makeHref={(p) => hrefWith("/admin/template-requests", sp, { page: p })} />
            </Panel>
          </>
        )}
      </Body>
    </>
  );
}

export default function RequestsPage(props: PageProps<"/admin/template-requests">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <RequestsPageContent {...props} />
    </Suspense>
  );
}
