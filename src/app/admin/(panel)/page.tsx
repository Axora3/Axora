import { Icon } from "@/components/ui/icon";
import { Suspense } from "react";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { DashboardInsights } from "@/components/admin/DashboardInsights";
import { formatPrice } from "@/lib/templates/types";
import { connection } from "next/server";
import Link from "next/link";
import { FilterSheet } from "@/components/admin/FilterSheet";
import { Body, LoadFailed, Notice, PageHeader, Panel, StatCard, StatusPill, btn, field } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { REQUEST_OVERDUE_HOURS } from "@/lib/admin/config";
import { ADMIN_MODULE_MIGRATION_HINT, isMissingMigration, MIGRATION_HINT } from "@/lib/admin/db-errors";
import { AUDIT_ACTION, AUDIT_ENTITY, ORDER_STATUS, ORDER_STATUSES, fmtDateTime } from "@/lib/admin/labels";
import { resolvePeriod, serverNow, ubToday } from "@/lib/admin/period";

export const metadata = { title: "Хяналтын самбар" };

const PERIODS = [
  ["7d", "Сүүлийн 7 хоног"],
  ["30d", "Сүүлийн 30 хоног"],
  ["month", "Энэ сар"],
] as const;

async function DashboardContent({ searchParams }: PageProps<"/admin">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  await connection();
  const { db, user } = c.ctx;
  const sp = await searchParams;
  const p = resolvePeriod(sp);
  // "Today" and every date range are Ulaanbaatar days, converted to UTC for the query.
  const nowMs = serverNow();
  const today = ubToday(nowMs);
  const overdueBefore = new Date(nowMs - REQUEST_OVERDUE_HOURS * 3600 * 1000).toISOString();

  const head = { count: "exact" as const, head: true };
  const [todayOrders, newNow, progressNow, reqNew, reqOverdue, ordersIn, requestsIn, recent, attnFiles, audit, payments, activeProjects, newSupport, unreadNotifications, confirmed, paidOrders, ...byStatus] = await Promise.all([
    db.from("website_orders").select("id", head).gte("created_at", today.from).lt("created_at", today.to),
    db.from("website_orders").select("id", head).eq("status", "new"),
    db.from("website_orders").select("id", head).eq("status", "in_progress"),
    db.from("template_requests").select("id", head).eq("status", "new"),
    db.from("template_requests").select("id", head).eq("status", "new").lt("created_at", overdueBefore),
    db.from("website_orders").select("id", head).gte("created_at", p.from).lt("created_at", p.to),
    db.from("template_requests").select("id", head).gte("created_at", p.from).lt("created_at", p.to),
    db.from("website_orders").select("id, reference, business_name, full_name, website_type, status, created_at").order("created_at", { ascending: false }).limit(6),
    db.from("order_attachments").select("order_id, website_orders(reference, business_name)").in("upload_status", ["pending", "failed"]).limit(50),
    db.from("admin_audit_log").select("id, action, entity_type, entity_id, details, created_at").order("created_at", { ascending: false }).limit(6),
    db.from("template_requests").select("id", head).in("payment_status", ["pending", "needs_review"]).neq("status", "cancelled"),
    db.from("website_projects").select("id", head).eq("status", "in_progress"),
    db.from("contact_messages").select("id", head).eq("status", "new"),
    db.from("admin_notifications").select("id", head).eq("admin_id", user.id).is("read_at", null),
    // Revenue means amounts an admin confirmed by hand; no gateway reports payments here.
    db.from("template_requests").select("payment_confirmed_amount, payment_confirmed_currency", { count: "exact" }).eq("payment_status", "confirmed_manual").gte("payment_confirmed_at", p.from).lt("payment_confirmed_at", p.to).limit(1000),
    db.from("website_orders").select("quote_amount", { count: "exact" }).eq("payment_status", "paid").gte("paid_at", p.from).lt("paid_at", p.to).limit(1000),
    ...ORDER_STATUSES.map((s) => db.from("website_orders").select("id", head).eq("status", s)),
  ]);

  const paymentsMissing = isMissingMigration(payments.error);
  const newModulesMissing = isMissingMigration(activeProjects.error) || isMissingMigration(unreadNotifications.error);
  const failed = [todayOrders, newNow, progressNow, reqNew, reqOverdue, ordersIn, requestsIn, recent, attnFiles, audit, newSupport, ...byStatus].some((r) => r.error) || (!!payments.error && !paymentsMissing) || (!!activeProjects.error && !isMissingMigration(activeProjects.error)) || (!!unreadNotifications.error && !isMissingMigration(unreadNotifications.error));
  const statusCounts = ORDER_STATUSES.map((s, i) => ({ s, n: byStatus[i].count ?? 0 }));
  const total = statusCounts.reduce((a, b) => a + b.n, 0);
  const missingOrders = Array.from(
    new Map(((attnFiles.data ?? []) as unknown as { order_id: string; website_orders: { reference: string; business_name: string } | null }[]).map((r) => [r.order_id, r.website_orders])).entries(),
  );
  const n = (r: { count: number | null }) => r.count ?? 0;
  const confirmedRows = (confirmed.data ?? []) as { payment_confirmed_amount: number | null; payment_confirmed_currency: string | null }[];
  const revenueByCurrency = new Map<string, number>();
  for (const row of confirmedRows) {
    if (row.payment_confirmed_amount == null || !row.payment_confirmed_currency) continue;
    revenueByCurrency.set(row.payment_confirmed_currency, (revenueByCurrency.get(row.payment_confirmed_currency) ?? 0) + Number(row.payment_confirmed_amount));
  }
  // Website orders are always in tögrög. Before their migration runs they simply add nothing.
  const paidRows = (paidOrders.data ?? []) as { quote_amount: number | null }[];
  if (paidRows.length) revenueByCurrency.set("MNT", (revenueByCurrency.get("MNT") ?? 0) + paidRows.reduce((sum, row) => sum + Number(row.quote_amount ?? 0), 0));
  // Past the row limit the sum would be wrong, so show that it could not be totalled.
  const paidOrdersOk = !paidOrders.error ? (paidOrders.count ?? 0) <= paidRows.length : isMissingMigration(paidOrders.error);
  const revenueKnown = !confirmed.error && (confirmed.count ?? 0) <= confirmedRows.length && paidOrdersOk;
  const revenue = !revenueKnown ? "—" : revenueByCurrency.size === 0 ? formatPrice({ isFree: false, price: 0, currency: "MNT" }) : [...revenueByCurrency].map(([currency, price]) => formatPrice({ isFree: false, price, currency })).join(" · ");
  let donutAt = 0;
  const donut = statusCounts.filter((x) => x.n > 0).map((x) => {
    const start = donutAt;
    donutAt += (x.n / Math.max(1, total)) * 100;
    return `${ORDER_STATUS[x.s].bar} ${start}% ${donutAt}%`;
  }).join(", ");

  const kpis = [
    { icon: "calendar" as const, label: "Өнөөдөр ирсэн захиалга", value: todayOrders.count ?? "—", note: "Улаанбаатарын цагаар", href: `/admin/orders?from=${today.day}&to=${today.day}`, band: true },
    { icon: "inbox" as const, label: "Шинэ захиалга", value: newNow.count ?? "—", note: "Холбогдоогүй, одоогийн байдлаар", href: "/admin/orders?status=new" },
    { icon: "clock" as const, label: "Хариу хүлээж буй хүсэлт", value: reqNew.count ?? "—", note: n(reqOverdue) ? `${n(reqOverdue)} нь ${REQUEST_OVERDUE_HOURS}+ цаг хүлээсэн` : "Шинэ төлөвтэй", href: "/admin/template-requests?status=new", warn: n(reqOverdue) > 0 },
    { icon: "activity" as const, label: "Хийгдэж буй ажил", value: progressNow.count ?? "—", note: "“Хийгдэж байгаа” захиалга", href: "/admin/orders?status=in_progress" },
  ];

  const alerts = [
    n(reqOverdue) > 0 && { tone: "danger", title: `${n(reqOverdue)} хүсэлт ${REQUEST_OVERDUE_HOURS}+ цаг хариугүй`, text: "Анхны холбоо тогтоогоогүй шинэ хүсэлтүүд.", href: "/admin/template-requests?status=new", cta: "Хүсэлт харах" },
    !paymentsMissing && n(payments) > 0 && { tone: "warn", title: `${n(payments)} төлбөр баталгаажуулах`, text: "Төлбөртэй хүсэлтийн төлбөрийг шалгаж, гараар баталгаажуулна.", href: "/admin/template-requests?pay=open", cta: "Шалгах" },
    ...missingOrders.slice(0, 3).map(([id, o]) => ({ tone: "info", title: "Хавсралт дутуу", text: `${o?.reference ?? ""} · ${o?.business_name ?? ""} — зарим файл илгээгдээгүй.`, href: `/admin/orders/${id}?tab=files`, cta: "Нээх" })),
  ].filter(Boolean) as { tone: "danger" | "warn" | "info"; title: string; text: string; href: string; cta: string }[];

  const toneCls = { danger: "border-danger-line bg-danger-bg", warn: "border-warn-line bg-warn-bg", info: "border-line bg-info-bg" };
  const name = user.email?.split("@")[0] ?? "Админ";

  return (
    <>
      <PageHeader
        tone="band"
        title={
          <>
            Өнөөдөр <span className="serif text-lime">{n(todayOrders)} шинэ</span> захиалга
          </>
        }
        description={
          <span className="flex flex-col gap-0.5">
            <span className="font-bold">Сайн байна уу, {name}</span>
            <span>{today.label}</span>
          </span>
        }
        actions={
          <span className="hidden gap-2 min-[1024px]:flex">
            <Link href="/admin/templates/new" className={btn.ghost}>
              Бүтээгдэхүүн нэмэх
            </Link>
            <Link href="/admin/orders?status=new" className={btn.primary}>
              Шинэ захиалга харах
            </Link>
          </span>
        }
      />
      <Body>
        {failed && <LoadFailed what="самбарын зарим өгөгдлийг" />}
        {paymentsMissing && <Notice tone="warn">{MIGRATION_HINT}</Notice>}
        {newModulesMissing && <Notice tone="warn">{ADMIN_MODULE_MIGRATION_HINT}</Notice>}

        <section aria-labelledby="db-today" className="flex flex-col gap-2.5">
          <h2 id="db-today" className="text-lg font-extrabold">
            Өнөөдрийн тойм
          </h2>
          <div className="grid grid-cols-2 gap-2.5 min-[900px]:grid-cols-4 min-[900px]:gap-3.5">
            {kpis.map((k) => (
              <StatCard key={k.label} label={k.label} value={k.value} note={k.note} icon={k.icon} href={k.href} band={k.band} warn={k.warn} />
            ))}
          </div>
        </section>

        {alerts.length > 0 && (
          <section aria-labelledby="db-attn" className="flex flex-col gap-2.5">
            <h2 id="db-attn" className="text-lg font-extrabold">
              Анхаарах
            </h2>
            <ul className="ax-scroll m-0 -mx-4 list-none gap-2.5 px-4 pb-1 min-[900px]:mx-0 min-[900px]:grid min-[900px]:grid-cols-3 min-[900px]:px-0">
              {alerts.map((a) => (
                <li key={a.title + a.href} className={`flex flex-[0_0_270px] flex-col gap-2 rounded-2xl border p-3.5 ${toneCls[a.tone]}`}>
                  <strong className="flex items-start gap-2 text-sm leading-snug">
                    <span aria-hidden="true" className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface font-extrabold">
                      <Icon name={a.tone === "info" ? "info-circle" : "circle-alert"} size={24} />
                    </span>
                    {a.title}
                  </strong>
                  <span className="text-[13px] leading-normal text-muted">{a.text}</span>
                  <Link href={a.href} className="mt-auto inline-flex min-h-10 items-center self-start rounded-control border border-line-strong bg-surface px-3 text-[13px] font-bold text-ink no-underline">
                    {a.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="db-period" className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="db-period" className="text-lg font-extrabold">
            Хугацааны тойм · <span className="text-muted">{p.label}</span>
          </h2>
          <FilterSheet title="Хугацаа" active={p.key === "7d" ? 0 : 1}>
            <form method="get" className="flex flex-wrap items-end gap-2" aria-label="Хугацааны шүүлтүүр">
              <div role="group" aria-label="Хугацаа" className="ax-segment flex-wrap">
                {PERIODS.map(([k, label]) => (
                  <Link key={k} href={`/admin?period=${k}`} aria-current={p.key === k ? "true" : undefined} className="ax-segment-item">
                    {label}
                  </Link>
                ))}
              </div>
              <input type="hidden" name="period" value="custom" />
              <label className="flex flex-col gap-1 text-[13px] font-bold">
                Эхлэх
                <input type="date" name="from" defaultValue={p.fromDate} className={field.input} />
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-bold">
                Дуусах
                <input type="date" name="to" defaultValue={p.toDate} className={field.input} />
              </label>
              <button type="submit" className={btn.ghost} aria-pressed={p.key === "custom"}>
                Өөр хугацаа харах
              </button>
            </form>
          </FilterSheet>
        </section>

        <div className="grid items-start gap-5 min-[1280px]:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            <Suspense fallback={<div className="ax-sk h-[320px] rounded-card" role="status" aria-label="График ачаалж байна" />}><DashboardInsights db={db} period={p} adminId={user.id} /></Suspense>

            <Panel title="Сүүлийн захиалга" id="db-recent" action={<Link href="/admin/orders" className="inline-flex min-h-11 items-center text-sm font-bold">Бүгд</Link>}>
              {recent.error ? (
                <LoadFailed what="захиалгуудыг" />
              ) : !recent.data?.length ? (
                <p className="p-5 text-[15px] text-muted">Одоогоор захиалга ирээгүй байна. Анкет илгээгдмэгц энд харагдана.</p>
              ) : (
                <ul className="m-0 list-none p-0">
                  {recent.data.map((o) => (
                    <li key={o.id} className="border-t border-line-soft first:border-t-0">
                      <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 text-ink no-underline transition-colors hover:bg-sunken">
                        <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-soft text-[15px] font-extrabold text-brand">
                          {o.business_name.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <strong className="truncate text-[15px]">{o.business_name}</strong>
                          <span className="truncate text-[12.5px] text-muted">{o.website_type ?? "—"} · {fmtDateTime(o.created_at)}</span>
                        </span>
                        <StatusPill kind="order" status={o.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Сүүлийн үйлдлүүд" id="db-audit" action={<Link href="/admin/activity" className="inline-flex min-h-11 items-center text-sm font-bold">Бүгд</Link>}>
              {audit.error ? (
                <LoadFailed what="үйлдлийн түүхийг" />
              ) : !audit.data?.length ? (
                <p className="p-5 text-[15px] text-muted">Одоогоор бүртгэгдсэн үйлдэл алга.</p>
              ) : (
                <ul className="m-0 list-none p-0">
                  {audit.data.map((a) => {
                    const d = (a.details ?? {}) as { title?: string; reference?: string };
                    return (
                      <li key={a.id} className="flex flex-wrap justify-between gap-2 border-t border-line-soft px-5 py-3 text-sm first:border-t-0">
                        <span>
                          <strong>{AUDIT_ACTION[a.action] ?? a.action}</strong> · {AUDIT_ENTITY[a.entity_type] ?? a.entity_type}
                          {d.title || d.reference ? ` — ${d.title ?? d.reference}` : ""}
                        </span>
                        <span className="text-[13px] text-muted">{fmtDateTime(a.created_at)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <div className="flex min-w-0 flex-col gap-5 min-[1280px]:sticky min-[1280px]:top-[84px]">
            <StatCard band label="Баталгаажсан орлого" value={<span className="text-[clamp(24px,2.4vw,30px)]">{revenue}</span>} note="Админ гараар баталгаажуулсан төлбөр. Банкны хуулга биш." icon="credit-card" href="/admin/payments?status=confirmed_manual" />

            <Panel title="Захиалгын төлөв" id="db-status" action={<span className="text-[13px] text-muted">Нийт {byStatus.some((r) => r.count === null) ? "—" : total}</span>}>
              {byStatus.some((r) => r.count === null) ? <LoadFailed what="захиалгын төлвийн тоог" /> : (
                <div className="flex items-center gap-4 p-5">
                  <span role="img" aria-label={statusCounts.map((x) => `${ORDER_STATUS[x.s].label} ${x.n}`).join(", ")} className="relative grid h-[96px] w-[96px] shrink-0 place-items-center rounded-full" style={{ background: total ? `conic-gradient(${donut})` : "var(--ax-soft)" }}>
                    <span className="grid h-[64px] w-[64px] place-items-center rounded-full bg-surface text-lg font-extrabold tabular-nums">{total}</span>
                  </span>
                  <ul className="m-0 flex min-w-0 flex-1 list-none flex-col p-0">
                    {statusCounts.map((x) => (
                      <li key={x.s}>
                        <Link href={`/admin/orders?status=${x.s}`} className="flex min-h-8 items-center gap-2 text-[13px] text-ink no-underline hover:text-brand">
                          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: ORDER_STATUS[x.s].bar }} />
                          <span className="min-w-0 flex-1 truncate">{ORDER_STATUS[x.s].label}</span>
                          <strong className="tabular-nums">{x.n}</strong>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>

            <Panel title="Шуурхай үйлдэл" id="db-quick">
              <div className="flex flex-col p-2">
                {[
                  { href: "/admin/orders?status=new", icon: "inbox", label: "Шинэ захиалга харах" },
                  { href: "/admin/template-requests?pay=open", icon: "credit-card", label: "Төлбөр шалгах" },
                  { href: "/admin/templates/new", icon: "plus", label: "Бүтээгдэхүүн нэмэх" },
                  { href: "/admin/content", icon: "layers", label: "Сайтын агуулга" },
                ].map((a) => (
                  <Link key={a.href} href={a.href} className="ax-menu-item">
                    <Icon name={a.icon as "inbox"} size={18} className="text-brand" />
                    {a.label}
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel title="Удирдлагын ажлууд" id="db-operations">
              {activeProjects.error && !newModulesMissing ? <LoadFailed what="төслийн тоог" /> : unreadNotifications.error && !newModulesMissing ? <LoadFailed what="мэдэгдлийн тоог" /> : (
                <ul className="m-0 list-none p-0">
                  {[
                    { href: "/admin/projects?status=in_progress", label: "Идэвхтэй төсөл", value: activeProjects.count },
                    { href: "/admin/support?status=new", label: "Шинэ тусламжийн хүсэлт", value: newSupport.count },
                    { href: "/admin/notifications?status=unread", label: "Уншаагүй мэдэгдэл", value: unreadNotifications.count },
                    { href: "/admin/orders", label: "Ирсэн веб захиалга", value: ordersIn.count },
                    { href: "/admin/template-requests", label: "Template хүсэлт", value: requestsIn.count },
                  ].map((row) => (
                    <li key={row.label} className="border-t border-line-soft first:border-t-0">
                      <Link href={row.href} className="flex min-h-11 items-center justify-between gap-3 px-5 text-sm text-ink no-underline hover:bg-sunken">
                        {row.label}
                        <strong className="tabular-nums">{row.value ?? "—"}</strong>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </Body>
    </>
  );
}


export default function Dashboard(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <DashboardContent {...props} />
    </Suspense>
  );
}
