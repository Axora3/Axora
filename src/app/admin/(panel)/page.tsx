import { Suspense } from "react";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { DashboardInsights } from "@/components/admin/DashboardInsights";
import { connection } from "next/server";
import Link from "next/link";
import { FilterSheet } from "@/components/admin/FilterSheet";
import { Body, LoadFailed, Notice, PageHeader, Panel, StatusPill, btn } from "@/components/admin/ui";
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
  const [todayOrders, newNow, progressNow, reqNew, reqOverdue, ordersIn, requestsIn, recent, attnFiles, audit, payments, activeProjects, newSupport, unreadNotifications, ...byStatus] = await Promise.all([
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

  const kpis = [
    { label: "Өнөөдөр ирсэн захиалга", value: todayOrders.count ?? "—", note: "Улаанбаатарын цагаар", href: `/admin/orders?from=${today.day}&to=${today.day}`, band: true },
    { label: "Шинэ захиалга", value: newNow.count ?? "—", note: "Холбогдоогүй, одоогийн байдлаар", href: "/admin/orders?status=new" },
    { label: "Хариу хүлээж буй хүсэлт", value: reqNew.count ?? "—", note: n(reqOverdue) ? `${n(reqOverdue)} нь ${REQUEST_OVERDUE_HOURS}+ цаг хүлээсэн` : "Шинэ төлөвтэй", href: "/admin/template-requests?status=new", warn: n(reqOverdue) > 0 },
    { label: "Хийгдэж буй ажил", value: progressNow.count ?? "—", note: "“Хийгдэж байгаа” захиалга", href: "/admin/orders?status=in_progress" },
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
              <Link
                key={k.label}
                href={k.href}
                className={`ax-btn flex min-h-[118px] flex-col justify-between gap-2 rounded-[18px] border p-3.5 no-underline min-[900px]:p-[18px] ${k.band ? "border-band bg-band text-on-band" : "border-line bg-surface text-ink"}`}
              >
                <span className="text-[12.5px] leading-snug font-bold opacity-85 min-[900px]:text-[13.5px]">{k.label}</span>
                <span className="text-[34px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">{k.value}</span>
                <span className={`text-xs font-semibold ${k.warn ? "text-danger" : "opacity-75"}`}>
                  {k.warn && <span aria-hidden="true">! </span>}
                  {k.note}
                </span>
              </Link>
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
                      !
                    </span>
                    {a.title}
                  </strong>
                  <span className="text-[13px] leading-normal text-muted">{a.text}</span>
                  <Link href={a.href} className="mt-auto inline-flex min-h-10 items-center self-start rounded-[10px] border border-line-strong bg-surface px-3 text-[13px] font-bold text-ink no-underline">
                    {a.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap items-start gap-5">
          <Panel title="Сүүлийн захиалга" id="db-recent" className="flex-[999_1_520px]" action={<Link href="/admin/orders" className="inline-flex min-h-11 items-center text-sm font-bold">Бүгд</Link>}>
            {recent.error ? (
              <LoadFailed what="захиалгуудыг" />
            ) : !recent.data?.length ? (
              <p className="p-[18px] text-[15px] text-muted">Одоогоор захиалга ирээгүй байна. Анкет илгээгдмэгц энд харагдана.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {recent.data.map((o) => (
                  <li key={o.id} className="border-t border-soft first:border-t-0">
                    <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-[18px] py-3 text-ink no-underline hover:bg-sunken">
                      <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soft text-base font-extrabold text-brand">
                        {o.business_name.trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <strong className="truncate text-[15px]">{o.business_name}</strong>
                        <span className="truncate text-[12.5px] text-muted">
                          {o.website_type ?? "—"} · {fmtDateTime(o.created_at)}
                        </span>
                      </span>
                      <StatusPill kind="order" status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Захиалгын төлөв" id="db-status" className="flex-[1_1_320px]" action={<span className="text-[13px] text-muted">Нийт {byStatus.some((r) => r.count === null) ? "—" : total}</span>}>
            {byStatus.some((r) => r.count === null) ? <LoadFailed what="захиалгын төлвийн тоог" /> : <div className="flex flex-col gap-4 p-[18px]">
              {total > 0 && (
                <div role="img" aria-label={statusCounts.map((x) => `${ORDER_STATUS[x.s].label} ${x.n}`).join(", ")} className="flex h-3.5 gap-0.5 overflow-hidden rounded-lg">
                  {statusCounts.filter((x) => x.n > 0).map((x) => (
                    <span key={x.s} style={{ flex: `${x.n} 1 0`, background: ORDER_STATUS[x.s].bar }} />
                  ))}
                </div>
              )}
              <ul className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-1 p-0">
                {statusCounts.map((x) => (
                  <li key={x.s}>
                    <Link href={`/admin/orders?status=${x.s}`} className="flex min-h-11 items-center gap-2 text-sm text-ink no-underline">
                      <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded" style={{ background: ORDER_STATUS[x.s].bar }} />
                      <span className="flex-1">{ORDER_STATUS[x.s].label}</span>
                      <strong className="tabular-nums">{x.n}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>}
          </Panel>
        </div>

        <section aria-labelledby="db-period" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="db-period" className="text-lg font-extrabold">
              Хугацааны тойм · <span className="text-muted">{p.label}</span>
            </h2>
            <FilterSheet title="Хугацаа" active={p.key === "7d" ? 0 : 1}>
              <form method="get" className="flex flex-wrap items-end gap-2" aria-label="Хугацааны шүүлтүүр">
                <div role="group" aria-label="Хугацаа" className="flex flex-wrap gap-1 rounded-xl bg-soft-3 p-1">
                  {PERIODS.map(([k, label]) => (
                    <Link
                      key={k}
                      href={`/admin?period=${k}`}
                      aria-current={p.key === k ? "true" : undefined}
                      className={`inline-flex min-h-11 items-center rounded-[9px] px-3.5 text-sm font-bold no-underline ${p.key === k ? "bg-elevated text-ink shadow-[0_1px_2px_var(--ax-shadow)]" : "text-muted"}`}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
                <input type="hidden" name="period" value="custom" />
                <label className="flex flex-col gap-1 text-[13px] font-bold">
                  Эхлэх
                  <input type="date" name="from" defaultValue={p.fromDate} className="min-h-11 rounded-[10px] border border-line-strong bg-sunken px-2.5 text-base text-ink" />
                </label>
                <label className="flex flex-col gap-1 text-[13px] font-bold">
                  Дуусах
                  <input type="date" name="to" defaultValue={p.toDate} className="min-h-11 rounded-[10px] border border-line-strong bg-sunken px-2.5 text-base text-ink" />
                </label>
                <button type="submit" className={btn.ghost} aria-pressed={p.key === "custom"}>
                  Өөр хугацаа харах
                </button>
              </form>
            </FilterSheet>
          </div>
          <div className="grid grid-cols-2 gap-2.5 min-[900px]:max-w-[640px] min-[900px]:gap-3.5">
            {[
              { label: "Ирсэн веб захиалга", value: ordersIn.count ?? "—", href: "/admin/orders" },
              { label: "Template хүсэлт", value: requestsIn.count ?? "—", href: "/admin/template-requests" },
            ].map((k) => (
              <Link key={k.label} href={k.href} className="ax-btn flex flex-col gap-2 rounded-[18px] border border-line bg-surface p-[18px] text-ink no-underline">
                <span className="text-[13px] font-bold text-muted">{k.label}</span>
                <span className="text-[30px] leading-none font-extrabold tabular-nums">{k.value}</span>
              </Link>
            ))}
          </div>
          <p className="text-[13px] text-muted">Тоо бүр өгөгдлийн сангаас шууд тоологдоно. Төлбөрийн автомат бүртгэл байхгүй тул орлого, борлуулалтын үзүүлэлт харуулахгүй.</p>
        </section>

        <Suspense fallback={<p role="status" className="text-sm text-muted">График, мэдэгдэл ачаалж байна…</p>}><DashboardInsights db={db} period={p} adminId={user.id} /></Suspense>

        <section aria-labelledby="db-operations" className="flex flex-col gap-2.5">
          <h2 id="db-operations" className="text-lg font-extrabold">Удирдлагын ажлууд</h2>
          {activeProjects.error && !newModulesMissing ? <LoadFailed what="төслийн тоог" /> : unreadNotifications.error && !newModulesMissing ? <LoadFailed what="мэдэгдлийн тоог" /> : (
            <div className="grid grid-cols-2 gap-2.5 min-[900px]:grid-cols-3">
              <Link href="/admin/projects?status=in_progress" className="ax-btn flex min-h-[104px] flex-col justify-between rounded-[18px] border border-line bg-surface p-4 text-ink no-underline"><span className="text-sm font-bold text-muted">Идэвхтэй төсөл</span><strong className="text-3xl tabular-nums">{activeProjects.count ?? "—"}</strong></Link>
              <Link href="/admin/support?status=new" className="ax-btn flex min-h-[104px] flex-col justify-between rounded-[18px] border border-line bg-surface p-4 text-ink no-underline"><span className="text-sm font-bold text-muted">Шинэ тусламжийн хүсэлт</span><strong className="text-3xl tabular-nums">{newSupport.count ?? "—"}</strong></Link>
              <Link href="/admin/notifications?status=unread" className="ax-btn flex min-h-[104px] flex-col justify-between rounded-[18px] border border-line bg-surface p-4 text-ink no-underline"><span className="text-sm font-bold text-muted">Уншаагүй мэдэгдэл</span><strong className="text-3xl tabular-nums">{unreadNotifications.count ?? "—"}</strong></Link>
            </div>
          )}
        </section>

        <Panel title="Сүүлийн үйлдлүүд" id="db-audit" action={<Link href="/admin/activity" className="inline-flex min-h-11 items-center text-sm font-bold">Бүгд</Link>}>
          {audit.error ? (
            <LoadFailed what="үйлдлийн түүхийг" />
          ) : !audit.data?.length ? (
            <p className="p-[18px] text-[15px] text-muted">Одоогоор бүртгэгдсэн үйлдэл алга.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {audit.data.map((a) => {
                const d = (a.details ?? {}) as { title?: string; reference?: string };
                return (
                  <li key={a.id} className="flex flex-wrap justify-between gap-2 border-t border-soft px-[18px] py-2.5 text-sm first:border-t-0">
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
