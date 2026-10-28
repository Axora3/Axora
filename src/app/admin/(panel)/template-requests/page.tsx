import Link from "next/link";
import { Suspense } from "react";
import { RememberListUrl } from "@/components/admin/client";
import { Body, EmptyState, LoadFailed, PageHeader, Pagination, Panel, StatusPill, btn, field } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { CHANNEL_LABEL, REQUEST_STATUS, REQUEST_STATUSES, fmtDateTime, shortId } from "@/lib/admin/labels";
import { PAGE_SIZE, hrefWith, one, page as pageOf, safeSearch } from "@/lib/admin/query";

export const metadata = { title: "Загварын хүсэлтүүд" };

export default async function RequestsPage({ searchParams }: PageProps<"/admin/template-requests">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const sp = await searchParams;
  const q = safeSearch(one(sp, "q"));
  const status = (REQUEST_STATUSES as readonly string[]).includes(one(sp, "status")) ? one(sp, "status") : "";
  const page = pageOf(sp);
  let query = c.ctx.db.from("template_requests").select("id, customer_name, contact_channel, status, created_at, templates(title)", { count: "exact" });
  if (q) query = query.or(`customer_name.ilike."*${q}*",contact_value.ilike."*${q}*"`);
  if (status) query = query.eq("status", status);
  const { data, count, error } = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const total = count ?? 0;
  const filtered = !!(q || status);

  return (
    <>
      <Suspense>
        <RememberListUrl storageKey="admin-requests-list" />
      </Suspense>
      <PageHeader title="Загварын хүсэлтүүд" description="“Авах хүсэлт гаргах”-аар ирсэн хүсэлт. Хүсэлт ирсэн нь төлбөр төлөгдсөн гэсэн үг биш." />
      <Body>
        <form method="get" className="flex flex-wrap items-end gap-3 rounded-[18px] border border-line bg-surface p-4" aria-label="Шүүлтүүр">
          <label className="flex flex-[999_1_240px] flex-col gap-1.5">
            <span className={field.label}>Хайх</span>
            <input name="q" type="search" defaultValue={one(sp, "q")} placeholder="Нэр, утас, имэйл" className={field.input} />
          </label>
          <label className="flex flex-[1_1_160px] flex-col gap-1.5">
            <span className={field.label}>Төлөв</span>
            <select name="status" defaultValue={status} className={field.input}>
              <option value="">Бүгд</option>
              {REQUEST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {REQUEST_STATUS[s].label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={btn.primary}>
            Шүүх
          </button>
          {filtered && (
            <Link href="/admin/template-requests" className={btn.ghost}>
              Цэвэрлэх
            </Link>
          )}
        </form>
        <Panel>
          <p aria-live="polite" className="border-b border-soft px-[18px] py-3 text-[15px] font-bold">
            {error ? "—" : `${total} хүсэлт`}
          </p>
          {error ? (
            <LoadFailed what="хүсэлтүүдийг" />
          ) : !data?.length ? (
            <EmptyState title={filtered ? "Тохирох хүсэлт олдсонгүй" : "Одоогоор хүсэлт алга"} text={filtered ? undefined : "Загварын хуудаснаас “Авах хүсэлт” ирмэгц энд харагдана."} />
          ) : (
            <>
              <ul className="m-0 list-none p-0">
                {data.map((r) => (
                  <li key={r.id} className="border-t border-soft first:border-t-0">
                    <Link href={`/admin/template-requests/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-[18px] py-3 text-ink no-underline hover:bg-bg">
                      <span className="font-mono text-[13px] text-muted">{shortId(r.id)}</span>
                      <span className="flex min-w-0 flex-[1_1_220px] flex-col">
                        <strong className="text-[15px]">{(r.templates as unknown as { title: string } | null)?.title ?? "Загвар"}</strong>
                        <span className="text-[13px] text-muted">
                          {r.customer_name} · {CHANNEL_LABEL[r.contact_channel] ?? r.contact_channel}
                        </span>
                      </span>
                      <StatusPill kind="request" status={r.status} />
                      <span className="ml-auto text-[13px] whitespace-nowrap text-muted">{fmtDateTime(r.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Pagination page={page} pages={Math.max(1, Math.ceil(total / PAGE_SIZE))} total={total} makeHref={(p) => hrefWith("/admin/template-requests", sp, { page: p })} />
            </>
          )}
        </Panel>
      </Body>
    </>
  );
}
