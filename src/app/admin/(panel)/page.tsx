import { connection } from "next/server";
import Link from "next/link";
import { Body, LoadFailed, PageHeader, Panel, StatusPill, btn } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { AUDIT_ACTION, AUDIT_ENTITY, ORDER_STATUS, ORDER_STATUSES, fmtDateTime } from "@/lib/admin/labels";
import { resolvePeriod } from "@/lib/admin/period";

export const metadata = { title: "Хяналтын самбар" };

const PERIODS = [
  ["7d", "Сүүлийн 7 хоног"],
  ["30d", "Сүүлийн 30 хоног"],
  ["month", "Энэ сар"],
  ["custom", "Өөр хугацаа"],
] as const;

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  await connection();
  const { db } = c.ctx;
  const sp = await searchParams;
  const p = resolvePeriod(sp);

  const count = (q: PromiseLike<{ count: number | null; error: unknown }>) => q;
  const head = { count: "exact" as const, head: true };
  const [ordersIn, newNow, progressNow, requestsIn, recent, attnReq, attnFiles, audit, ...byStatus] = await Promise.all([
    count(db.from("website_orders").select("id", head).gte("created_at", p.from).lt("created_at", p.to)),
    count(db.from("website_orders").select("id", head).eq("status", "new")),
    count(db.from("website_orders").select("id", head).eq("status", "in_progress")),
    count(db.from("template_requests").select("id", head).gte("created_at", p.from).lt("created_at", p.to)),
    db.from("website_orders").select("id, reference, business_name, full_name, website_type, budget, status, created_at").order("created_at", { ascending: false }).limit(6),
    db.from("template_requests").select("id, customer_name, created_at, templates(title)").eq("status", "new").order("created_at", { ascending: true }).limit(5),
    db.from("order_attachments").select("order_id, website_orders(reference, business_name)").in("upload_status", ["pending", "failed"]).limit(50),
    db.from("admin_audit_log").select("id, action, entity_type, entity_id, details, created_at").order("created_at", { ascending: false }).limit(6),
    ...ORDER_STATUSES.map((s) => count(db.from("website_orders").select("id", head).eq("status", s))),
  ]);

  const failed = [ordersIn, newNow, progressNow, requestsIn, recent, attnReq, attnFiles, audit, ...byStatus].some((r) => r.error);
  const statusCounts = ORDER_STATUSES.map((s, i) => ({ s, n: byStatus[i].count ?? 0 }));
  const total = statusCounts.reduce((a, b) => a + b.n, 0);
  const missingOrders = Array.from(
    new Map(((attnFiles.data ?? []) as unknown as { order_id: string; website_orders: { reference: string; business_name: string } | null }[]).map((r) => [r.order_id, r.website_orders])).entries(),
  );

  const kpis = [
    { label: "Ирсэн веб захиалга", value: ordersIn.count ?? 0, scope: p.label, href: "/admin/orders", dark: true },
    { label: "Шинэ төлөвтэй захиалга", value: newNow.count ?? 0, scope: "Одоогийн байдлаар", href: "/admin/orders?status=new" },
    { label: "Хийгдэж байгаа", value: progressNow.count ?? 0, scope: "Одоогийн байдлаар", href: "/admin/orders?status=in_progress" },
    { label: "Загварын хүсэлт", value: requestsIn.count ?? 0, scope: p.label, href: "/admin/template-requests" },
  ];

  return (
    <>
      <PageHeader
        title="Хяналтын самбар"
        description="Бүх тоо өгөгдлийн сангаас шууд тоологдоно. Төлбөрийн бүртгэл байхгүй тул орлогын үзүүлэлт харуулахгүй."
        actions={
          <>
            <Link href="/admin/templates/new" className={btn.ghost}>
              Загвар нэмэх
            </Link>
            <Link href="/admin/orders?status=new" className={btn.primary}>
              Шинэ захиалга харах
            </Link>
          </>
        }
      />
      <Body>
        <form method="get" className="flex flex-wrap items-end gap-2" aria-label="Хугацааны шүүлтүүр">
          <div role="group" aria-label="Хугацаа" className="flex flex-wrap gap-1 rounded-xl bg-soft-3 p-1">
            {PERIODS.map(([k, label]) =>
              k === "custom" ? null : (
                <Link
                  key={k}
                  href={`/admin?period=${k}`}
                  aria-current={p.key === k ? "true" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-[9px] px-3.5 text-sm font-bold no-underline ${p.key === k ? "bg-surface text-ink shadow-[0_1px_2px_rgba(23,37,30,.14)]" : "text-muted"}`}
                >
                  {label}
                </Link>
              ),
            )}
          </div>
          <input type="hidden" name="period" value="custom" />
          <label className="flex flex-col gap-1 text-[13px] font-bold">
            Эхлэх
            <input type="date" name="from" defaultValue={p.fromDate} className="min-h-11 rounded-[10px] border border-line-strong bg-surface px-2.5 text-base" />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-bold">
            Дуусах
            <input type="date" name="to" defaultValue={p.toDate} className="min-h-11 rounded-[10px] border border-line-strong bg-surface px-2.5 text-base" />
          </label>
          <button type="submit" className={btn.ghost} aria-pressed={p.key === "custom"}>
            Өөр хугацаа харах
          </button>
        </form>

        {failed && <LoadFailed what="самбарын зарим өгөгдлийг" />}

        <section aria-label="Гол үзүүлэлт" className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))]">
          {kpis.map((k) => (
            <Link
              key={k.label}
              href={k.href}
              className={`ax-btn flex flex-col gap-2 rounded-[18px] border p-[18px] no-underline ${k.dark ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink"}`}
            >
              <span className="text-[13.5px] font-bold opacity-85">{k.label}</span>
              <span className="text-[34px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">{k.value}</span>
              <span className={`self-start rounded-md px-2 py-0.5 text-xs font-bold ${k.dark ? "bg-[#22352B] text-lime" : "bg-soft text-brand"}`}>{k.scope}</span>
            </Link>
          ))}
        </section>

        <div className="flex flex-wrap items-start gap-5">
          <Panel title="Сүүлийн веб захиалгууд" id="db-recent" className="flex-[999_1_560px]" action={<Link href="/admin/orders" className="inline-flex min-h-11 items-center text-sm font-bold">Бүгд</Link>}>
            {recent.error ? (
              <LoadFailed what="захиалгуудыг" />
            ) : !recent.data?.length ? (
              <p className="p-[18px] text-[15px] text-muted">Одоогоор захиалга ирээгүй байна. Анкет илгээгдмэгц энд харагдана.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {recent.data.map((o) => (
                  <li key={o.id} className="border-t border-soft first:border-t-0">
                    <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-[18px] py-3 text-ink no-underline hover:bg-bg">
                      <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                        <strong className="truncate text-[14.5px]">{o.business_name}</strong>
                        <span className="text-[12.5px] text-muted">
                          {o.reference} · {o.full_name}
                        </span>
                      </span>
                      <span className="flex-[1_1_140px] text-sm">{o.website_type ?? "—"}</span>
                      <StatusPill kind="order" status={o.status} />
                      <span className="ml-auto text-[13px] whitespace-nowrap text-muted">{fmtDateTime(o.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Анхаарах зүйлс" id="db-attn" className="flex-[1_1_300px]">
            <div className="flex flex-col gap-2.5 p-[18px]">
              {(attnReq.data ?? []).map((r) => (
                <Link key={r.id} href={`/admin/template-requests/${r.id}`} className="flex flex-col gap-1 rounded-[14px] bg-[#E3EDF5] p-3 text-ink no-underline">
                  <strong className="text-sm">Шинэ загварын хүсэлт</strong>
                  <span className="text-[13px] text-muted">
                    {(r.templates as unknown as { title: string } | null)?.title ?? "Загвар"} — {r.customer_name} · {fmtDateTime(r.created_at)}
                  </span>
                </Link>
              ))}
              {missingOrders.slice(0, 5).map(([id, o]) => (
                <Link key={id} href={`/admin/orders/${id}?tab=files`} className="flex flex-col gap-1 rounded-[14px] bg-[#FBF1DC] p-3 text-ink no-underline">
                  <strong className="text-sm">Хавсралт дутуу</strong>
                  <span className="text-[13px] text-muted">
                    {o?.reference} · {o?.business_name} — зарим файл илгээгдээгүй.
                  </span>
                </Link>
              ))}
              {!attnReq.data?.length && !missingOrders.length && !attnReq.error && <p className="text-[15px] text-muted">Одоогоор анхаарах зүйл алга.</p>}
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap items-stretch gap-5">
          <Panel title="Захиалгын төлөв" id="db-status" className="flex-[1_1_380px]" action={<span className="text-[13px] text-muted">Нийт {total} · одоогийн байдлаар</span>}>
            <div className="flex flex-col gap-4 p-[18px]">
              {total > 0 && (
                <div role="img" aria-label={statusCounts.map((x) => `${ORDER_STATUS[x.s].label} ${x.n}`).join(", ")} className="flex h-4 gap-0.5 overflow-hidden rounded-lg">
                  {statusCounts.filter((x) => x.n > 0).map((x) => (
                    <span key={x.s} style={{ flex: `${x.n} 1 0`, background: ORDER_STATUS[x.s].bar }} />
                  ))}
                </div>
              )}
              <ul className="m-0 grid list-none gap-2 p-0 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                {statusCounts.map((x) => (
                  <li key={x.s}>
                    <Link href={`/admin/orders?status=${x.s}`} className="flex min-h-11 items-center gap-2 text-sm text-ink no-underline">
                      <span aria-hidden="true" className="h-3 w-3 rounded" style={{ background: ORDER_STATUS[x.s].bar }} />
                      <span className="flex-1">{ORDER_STATUS[x.s].label}</span>
                      <strong className="tabular-nums">{x.n}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          <Panel title="Сүүлийн үйлдлүүд" id="db-audit" className="flex-[1_1_380px]" action={<Link href="/admin/activity" className="inline-flex min-h-11 items-center text-sm font-bold">Бүгд</Link>}>
            {audit.error ? (
              <LoadFailed what="үйлдлийн түүхийг" />
            ) : !audit.data?.length ? (
              <p className="p-[18px] text-[15px] text-muted">Одоогоор бүртгэгдсэн үйлдэл алга.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {audit.data.map((a) => (
                  <li key={a.id} className="flex flex-wrap justify-between gap-2 border-t border-soft px-[18px] py-2.5 text-sm first:border-t-0">
                    <span>
                      <strong>{AUDIT_ACTION[a.action] ?? a.action}</strong> · {AUDIT_ENTITY[a.entity_type] ?? a.entity_type}
                      {(a.details as { title?: string; reference?: string })?.title || (a.details as { reference?: string })?.reference
                        ? ` — ${(a.details as { title?: string }).title ?? (a.details as { reference?: string }).reference}`
                        : ""}
                    </span>
                    <span className="text-[13px] text-muted">{fmtDateTime(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <p className="text-[13px] text-muted">
          <a href="/" target="_blank" rel="noopener">
            Сайт харах ↗
          </a>
        </p>
      </Body>
    </>
  );
}
