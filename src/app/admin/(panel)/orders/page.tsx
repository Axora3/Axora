import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import Link from "next/link";
import { Suspense } from "react";
import { RememberListUrl } from "@/components/admin/client";
import { FilterSheet } from "@/components/admin/FilterSheet";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { Body, EmptyState, LoadFailed, PageHeader, Pagination, Panel, btn, field } from "@/components/admin/ui";
import { ArrowRight, Search } from "@/components/icons";
import { requireAdminPage } from "@/lib/admin/auth";
import { ORDER_STATUS, ORDER_STATUSES, fmtDateTime } from "@/lib/admin/labels";
import { PAGE_SIZE, hrefWith, one, page as pageOf, safeSearch } from "@/lib/admin/query";
import { STEPS } from "@/lib/order/questions";

export const metadata = { title: "Веб захиалгууд" };

const TYPES = STEPS[1].fields.find((f) => f.id === "q12")!.opts!.filter((o) => o !== "Бусад");

async function OrdersPageContent({ searchParams }: PageProps<"/admin/orders">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const { db } = c.ctx;
  const sp = await searchParams;
  const q = safeSearch(one(sp, "q"));
  const status = (ORDER_STATUSES as readonly string[]).includes(one(sp, "status")) ? one(sp, "status") : "";
  const type = TYPES.includes(one(sp, "type")) || one(sp, "type") === "Бусад" ? one(sp, "type") : "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(one(sp, "from")) ? one(sp, "from") : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(one(sp, "to")) ? one(sp, "to") : "";
  const sort = one(sp, "sort") === "old" ? "old" : "new";
  const page = pageOf(sp);

  let query = db
    .from("website_orders")
    .select("id, reference, business_name, full_name, phone, website_type, budget, status, created_at, updated_at", { count: "exact" });
  if (q) query = query.or(["full_name", "business_name", "email", "phone", "reference"].map((col) => `${col}.ilike."*${q}*"`).join(","));
  if (status) query = query.eq("status", status);
  if (type === "Бусад") query = query.like("website_type", "Бусад%");
  else if (type) query = query.eq("website_type", type);
  // Dates are Ulaanbaatar days.
  if (from) query = query.gte("created_at", `${from}T00:00:00+08:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999+08:00`);
  const head = { count: "exact" as const, head: true };
  const [{ data, count, error }, ...tabCounts] = await Promise.all([
    query.order("created_at", { ascending: sort === "old" }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    db.from("website_orders").select("id", head),
    ...ORDER_STATUSES.map((s) => db.from("website_orders").select("id", head).eq("status", s)),
  ]);

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const extra = [type, from, to, sort !== "new" ? sort : ""].filter(Boolean).length;
  const filtered = !!(q || status || extra);
  const tabs = [{ id: "", label: "Бүгд", n: tabCounts[0].count }, ...ORDER_STATUSES.map((s, i) => ({ id: s, label: ORDER_STATUS[s].label, n: tabCounts[i + 1].count }))];

  return (
    <>
      <Suspense>
        <RememberListUrl storageKey="admin-orders-list" />
      </Suspense>
      <PageHeader title="Захиалгууд" description={<span className="max-md:hidden">Анкетаар ирсэн веб захиалгууд. Төлөвийг жагсаалтаас шууд солино.</span>}>
        <form method="get" role="search" className="relative flex items-center" aria-label="Захиалга хайх">
          {status && <input type="hidden" name="status" value={status} />}
          <span aria-hidden="true" className="pointer-events-none absolute left-3.5 text-muted">
            <Search size={18} />
          </span>
          <label htmlFor="ord-q" className="sr-only">
            Нэр, бизнес, ID, утсаар хайх
          </label>
          <input id="ord-q" name="q" type="search" enterKeyHint="search" defaultValue={one(sp, "q")} placeholder="Нэр, бизнес, AX-…, утас" className={`${field.input} min-h-12 rounded-[13px] bg-surface pl-11`} />
        </form>
        <nav aria-label="Төлөвөөр шүүх" className="ax-scroll -mx-[clamp(16px,3vw,32px)] gap-1.5 px-[clamp(16px,3vw,32px)]">
          {tabs.map((t) => {
            const on = status === t.id;
            return (
              <Link
                key={t.id || "all"}
                href={hrefWith("/admin/orders", sp, { status: t.id || null, page: null })}
                aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-bold no-underline ${on ? "border-band bg-band text-on-band" : "border-line bg-surface text-ink"}`}
              >
                {t.label}
                {t.n != null && <span className={`min-w-5 rounded-full px-1.5 text-center text-[11.5px] font-extrabold tabular-nums ${on ? "bg-lime text-on-lime" : "bg-soft text-muted"}`}>{t.n}</span>}
              </Link>
            );
          })}
        </nav>
      </PageHeader>
      <Body>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p aria-live="polite" className="text-[13.5px] font-bold text-muted">
            {error ? "—" : `${total} захиалга`}
            {filtered && (
              <>
                {" · "}
                <Link href="/admin/orders" className="font-bold">
                  Шүүлтүүр цэвэрлэх
                </Link>
              </>
            )}
          </p>
          <FilterSheet active={extra} title="Нэмэлт шүүлтүүр">
            <form method="get" className="flex flex-wrap items-end gap-3 rounded-[18px] border border-line bg-surface p-4 max-md:border-0 max-md:p-0" aria-label="Нэмэлт шүүлтүүр">
              {q && <input type="hidden" name="q" value={q} />}
              {status && <input type="hidden" name="status" value={status} />}
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
              <label className="flex flex-[1_1_140px] flex-col gap-1.5">
                <span className={field.label}>Эхлэх огноо</span>
                <input type="date" name="from" defaultValue={from} className={field.input} />
              </label>
              <label className="flex flex-[1_1_140px] flex-col gap-1.5">
                <span className={field.label}>Дуусах огноо</span>
                <input type="date" name="to" defaultValue={to} className={field.input} />
              </label>
              <label className="flex flex-[1_1_160px] flex-col gap-1.5">
                <span className={field.label}>Эрэмбэ</span>
                <select name="sort" defaultValue={sort} className={field.input}>
                  <option value="new">Шинэ нь эхэндээ</option>
                  <option value="old">Хуучин нь эхэндээ</option>
                </select>
              </label>
              <button type="submit" className={`${btn.primary} max-md:w-full`}>
                Шүүх
              </button>
            </form>
          </FilterSheet>
        </div>

        {error ? (
          <LoadFailed what="захиалгуудыг" />
        ) : !data?.length ? (
          <Panel>
            {filtered ? (
              <EmptyState title="Тохирох захиалга олдсонгүй" text="Хайлт, шүүлтүүрээ өөрчлөөд дахин үзээрэй." action={<Link href="/admin/orders" className={btn.ghost}>Шүүлтүүр цэвэрлэх</Link>} />
            ) : (
              <EmptyState title="Одоогоор захиалга алга" text="Сайтын анкетаар захиалга ирмэгц энд харагдана." action={<a href="/order" target="_blank" rel="noopener" className={btn.ghost}>Анкет харах ↗</a>} />
            )}
          </Panel>
        ) : (
          <>
            {/* Phones/tablets: cards. Whole card opens the detail; the status pill opens the sheet. */}
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 min-[1100px]:hidden">
              {data.map((o) => (
                <li key={o.id} className="relative flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-3.5">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soft text-base font-extrabold text-brand">
                      {o.business_name.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <Link href={`/admin/orders/${o.id}`} className="ax-stretch truncate text-[15.5px] font-extrabold text-ink no-underline">
                        {o.business_name}
                      </Link>
                      <span className="truncate text-[12.5px] text-muted">
                        {o.reference} · {o.full_name}
                      </span>
                    </span>
                    <span className="self-start text-xs whitespace-nowrap text-muted">{fmtDateTime(o.created_at).split(" ")[0]}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[12.5px] font-bold">
                    <span className="rounded-[7px] bg-soft-2 px-2 py-1">{o.website_type ?? "Төрөл —"}</span>
                    {o.budget && <span className="rounded-[7px] bg-soft-2 px-2 py-1">{o.budget}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2.5">
                    <OrderStatusControl id={o.id} updatedAt={o.updated_at} status={o.status} title={o.business_name} reference={o.reference} />
                    <span aria-hidden="true" className="inline-flex items-center gap-1 text-[13px] font-bold text-brand">
                      Дэлгэрэнгүй <ArrowRight size={15} />
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <Panel className="hidden min-[1100px]:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-sm">
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
                      <tr key={o.id} className="border-t border-soft hover:bg-sunken">
                        <td className="py-3 pr-3 pl-[18px] font-mono text-[13px] whitespace-nowrap">{o.reference}</td>
                        <td className="px-3 py-3 font-bold">{o.business_name}</td>
                        <td className="px-3 py-3">{o.full_name}</td>
                        <td className="px-3 py-3">{o.website_type ?? "—"}</td>
                        <td className="px-3 py-3 text-muted">{o.budget ?? "—"}</td>
                        <td className="px-3 py-2">
                          <OrderStatusControl id={o.id} updatedAt={o.updated_at} status={o.status} title={o.business_name} reference={o.reference} />
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
            </Panel>
            <Panel>
              <Pagination page={page} pages={pages} total={total} makeHref={(p) => hrefWith("/admin/orders", sp, { page: p })} />
            </Panel>
          </>
        )}
      </Body>
    </>
  );
}

export default function OrdersPage(props: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <OrdersPageContent {...props} />
    </Suspense>
  );
}
