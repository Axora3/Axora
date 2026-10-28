import Link from "next/link";
import { Suspense } from "react";
import { RememberListUrl } from "@/components/admin/client";
import { Body, EmptyState, LoadFailed, PageHeader, Pagination, Panel, StatusPill, btn, field } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { ORDER_STATUS, ORDER_STATUSES, fmtDateTime } from "@/lib/admin/labels";
import { PAGE_SIZE, hrefWith, one, page as pageOf, safeSearch } from "@/lib/admin/query";
import { STEPS } from "@/lib/order/questions";

export const metadata = { title: "Веб захиалгууд" };

const TYPES = STEPS[1].fields.find((f) => f.id === "q12")!.opts!.filter((o) => o !== "Бусад");

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const sp = await searchParams;
  const q = safeSearch(one(sp, "q"));
  const status = (ORDER_STATUSES as readonly string[]).includes(one(sp, "status")) ? one(sp, "status") : "";
  const type = TYPES.includes(one(sp, "type")) || one(sp, "type") === "Бусад" ? one(sp, "type") : "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(one(sp, "from")) ? one(sp, "from") : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(one(sp, "to")) ? one(sp, "to") : "";
  const sort = one(sp, "sort") === "old" ? "old" : "new";
  const page = pageOf(sp);

  let query = c.ctx.db
    .from("website_orders")
    .select("id, reference, business_name, full_name, phone, website_type, budget, status, created_at", { count: "exact" });
  if (q) query = query.or(["full_name", "business_name", "email", "phone", "reference"].map((col) => `${col}.ilike."*${q}*"`).join(","));
  if (status) query = query.eq("status", status);
  if (type === "Бусад") query = query.like("website_type", "Бусад%");
  else if (type) query = query.eq("website_type", type);
  if (from) query = query.gte("created_at", `${from}T00:00:00+08:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999+08:00`);
  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "old" })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = !!(q || status || type || from || to || sort !== "new");

  return (
    <>
      <Suspense>
        <RememberListUrl storageKey="admin-orders-list" />
      </Suspense>
      <PageHeader title="Веб захиалгууд" description="Анкетаар ирсэн захиалгууд. Харах, төлөв шинэчлэх." />
      <Body>
        <form method="get" className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-4" aria-label="Шүүлтүүр">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-[999_1_260px] flex-col gap-1.5">
              <span className={field.label}>Хайх</span>
              <input name="q" type="search" defaultValue={one(sp, "q")} placeholder="Нэр, бизнес, имэйл, утас, ID" className={field.input} />
            </label>
            <label className="flex flex-[1_1_160px] flex-col gap-1.5">
              <span className={field.label}>Төлөв</span>
              <select name="status" defaultValue={status} className={field.input}>
                <option value="">Бүгд</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS[s].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-[1_1_180px] flex-col gap-1.5">
              <span className={field.label}>Вебийн төрөл</span>
              <select name="type" defaultValue={type} className={field.input}>
                <option value="">Бүгд</option>
                {[...TYPES, "Бусад"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={field.label}>Эхлэх огноо</span>
              <input type="date" name="from" defaultValue={from} className={field.input} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={field.label}>Дуусах огноо</span>
              <input type="date" name="to" defaultValue={to} className={field.input} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={field.label}>Эрэмбэ</span>
              <select name="sort" defaultValue={sort} className={field.input}>
                <option value="new">Шинэ нь эхэндээ</option>
                <option value="old">Хуучин нь эхэндээ</option>
              </select>
            </label>
            <button type="submit" className={btn.primary}>
              Шүүх
            </button>
            {filtered && (
              <Link href="/admin/orders" className={btn.ghost}>
                Шүүлтүүр цэвэрлэх
              </Link>
            )}
          </div>
        </form>

        <Panel>
          <p aria-live="polite" className="border-b border-soft px-[18px] py-3 text-[15px] font-bold">
            {error ? "—" : `${total} захиалга олдлоо`}
          </p>
          {error ? (
            <LoadFailed what="захиалгуудыг" />
          ) : !data?.length ? (
            filtered ? (
              <EmptyState title="Тохирох захиалга олдсонгүй" text="Шүүлтүүрээ өөрчлөх эсвэл цэвэрлээд дахин үзээрэй." action={<Link href="/admin/orders" className={btn.ghost}>Шүүлтүүр цэвэрлэх</Link>} />
            ) : (
              <EmptyState title="Одоогоор захиалга алга" text="Сайтын анкетаар захиалга ирмэгц энд харагдана." action={<a href="/order" target="_blank" rel="noopener" className={btn.ghost}>Анкет харах ↗</a>} />
            )
          ) : (
            <>
              <div className="hidden overflow-x-auto min-[900px]:block">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs tracking-[0.06em] text-muted uppercase">
                      {["ID", "Бизнес", "Захиалагч", "Төрөл", "Төсөв", "Төлөв", "Ирсэн"].map((h) => (
                        <th key={h} scope="col" className="px-3 py-2.5 font-extrabold first:pl-[18px]">
                          {h}
                        </th>
                      ))}
                      <th scope="col" className="px-[18px] py-2.5">
                        <span className="sr-only">Үйлдэл</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((o) => (
                      <tr key={o.id} className="border-t border-soft hover:bg-bg">
                        <td className="py-3 pr-3 pl-[18px] font-mono text-[13px] whitespace-nowrap">{o.reference}</td>
                        <td className="px-3 py-3 font-bold">{o.business_name}</td>
                        <td className="px-3 py-3">{o.full_name}</td>
                        <td className="px-3 py-3">{o.website_type ?? "—"}</td>
                        <td className="px-3 py-3 text-muted">{o.budget ?? "—"}</td>
                        <td className="px-3 py-3">
                          <StatusPill kind="order" status={o.status} />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-muted">{fmtDateTime(o.created_at)}</td>
                        <td className="px-[18px] py-3 text-right">
                          <Link href={`/admin/orders/${o.id}`} className="inline-flex min-h-11 items-center font-bold" aria-label={`${o.business_name} — дэлгэрэнгүй`}>
                            Дэлгэрэнгүй
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="m-0 list-none p-0 min-[900px]:hidden">
                {data.map((o) => (
                  <li key={o.id} className="border-t border-soft first:border-t-0">
                    <Link href={`/admin/orders/${o.id}`} className="flex flex-col gap-1.5 px-4 py-3.5 text-ink no-underline">
                      <span className="flex items-start justify-between gap-2">
                        <strong className="text-[15px]">{o.business_name}</strong>
                        <StatusPill kind="order" status={o.status} />
                      </span>
                      <span className="text-[13px] text-muted">
                        {o.reference} · {o.full_name} · {o.website_type ?? "—"}
                      </span>
                      <span className="text-[13px] text-muted">
                        {o.budget ?? "Төсөв —"} · {fmtDateTime(o.created_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Pagination page={page} pages={pages} total={total} makeHref={(p) => hrefWith("/admin/orders", sp, { page: p })} />
            </>
          )}
        </Panel>
      </Body>
    </>
  );
}
