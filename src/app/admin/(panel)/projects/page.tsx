import { Suspense } from "react";
import Link from "next/link";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { Body, EmptyState, LoadFailed, Notice, PageHeader, Pagination, Panel, btn, field } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { ADMIN_MODULE_MIGRATION_HINT, isMissingMigration } from "@/lib/admin/db-errors";
import { fmtDate, fmtDateTime } from "@/lib/admin/labels";
import { PROJECT_STATUSES, PROJECT_STATUS } from "@/lib/admin/projects";
import { PAGE_SIZE, hrefWith, one, page as pageOf, safeSearch } from "@/lib/admin/query";

export const metadata = { title: "Веб төслүүд" };

type Search = Record<string, string | string[] | undefined>;
async function ProjectsContent({ searchParams }: { searchParams: Promise<Search> }) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const sp = await searchParams;
  const q = safeSearch(one(sp, "q"));
  const status = PROJECT_STATUSES.includes(one(sp, "status") as (typeof PROJECT_STATUSES)[number]) ? one(sp, "status") : "";
  const page = pageOf(sp);
  const { db } = c.ctx;
  let query = db.from("admin_project_overview").select("id, order_id, status, progress_percent, target_completion_date, updated_at, description, reference, business_name, full_name, order_status", { count: "exact" });
  if (status) query = query.eq("status", status);
  if (q) query = query.or(["description", "reference", "business_name", "full_name"].map((column) => column + ".ilike.*" + q + "*").join(","));
  const { data, count, error } = await query.order("updated_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const missing = isMissingMigration(error);
  const rows = (data ?? []).map((row) => ({ ...row, website_orders: { reference: row.reference, business_name: row.business_name, full_name: row.full_name, status: row.order_status } })) as unknown as { id: string; order_id: string; status: keyof typeof PROJECT_STATUS; progress_percent: number; target_completion_date: string | null; updated_at: string; description: string; website_orders: { reference: string; business_name: string; full_name: string; status: string } | null }[];
  const head = { count: "exact" as const, head: true };
  const totals = await Promise.all(PROJECT_STATUSES.map((s) => db.from("website_projects").select("id", head).eq("status", s)));
  const filtered = !!(q || status);
  return <>
    <PageHeader title="Веб төслүүд" description="Захиалгатай холбогдсон ажлын явц. Түүхэн захиалга төслийг автоматаар үүсгэхгүй.">
      <form method="get" role="search" className="flex flex-wrap gap-2" aria-label="Төсөл хайх">
        {status && <input type="hidden" name="status" value={status}/>}
        <label className="sr-only" htmlFor="project-q">Захиалгын дугаар, бизнес эсвэл захиалагч хайх</label>
        <input id="project-q" name="q" type="search" defaultValue={one(sp,"q")} placeholder="Захиалга, бизнес, тайлбар…" className={`${field.input} min-h-12 rounded-[13px] bg-surface`}/>
        <button className={btn.primary}>Хайх</button>
      </form>
      <nav aria-label="Төслийн төлөв" className="ax-scroll gap-1.5">
        <Link href={hrefWith("/admin/projects", sp, { status: null, page: null })} className={`${btn.ghost} shrink-0`}>Бүгд</Link>
        {PROJECT_STATUSES.map((s, i) => <Link key={s} href={hrefWith("/admin/projects", sp, { status: s, page: null })} aria-current={status === s ? "page" : undefined} className={`${btn.ghost} shrink-0`}>{PROJECT_STATUS[s].label}<span className="text-muted"> · {totals[i].count ?? "—"}</span></Link>)}
      </nav>
    </PageHeader>
    <Body>
      {missing && <Notice tone="warn">{ADMIN_MODULE_MIGRATION_HINT}</Notice>}
      {error && !missing ? <LoadFailed what="төслүүдийг"/> : !rows.length ? <Panel><EmptyState title={filtered ? "Тохирох төсөл олдсонгүй" : missing ? "Төслийн migration шаардлагатай" : "Одоогоор төсөл алга"} text={missing ? undefined : filtered ? undefined : "Захиалгын дэлгэрэнгүйгээс төслийг нэг бүрчлэн үүсгэнэ."} action={missing ? undefined : <Link href="/admin/orders" className={btn.ghost}>Захиалга харах</Link>}/></Panel> : <>
        <p className="text-sm font-bold text-muted">Нийт {count ?? 0} төсөл{filtered && <> · <Link href="/admin/projects">Цэвэрлэх</Link></>}</p>
        <ul className="m-0 grid list-none gap-3 p-0 min-[800px]:grid-cols-2 min-[1300px]:grid-cols-3">
          {rows.map((project) => { const order = project.website_orders; const stage = PROJECT_STATUS[project.status]; return <li key={project.id} className="flex min-w-0 flex-col gap-3 rounded-[18px] border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-2"><Link href={`/admin/projects/${project.id}`} className="text-base font-extrabold text-ink no-underline">{order?.business_name ?? "Захиалга"}</Link><span className="rounded-full bg-soft px-2.5 py-1 text-xs font-bold" style={{ color: stage.tone }}>{stage.label}</span></div>
            <p className="m-0 text-sm text-muted">{order?.reference ?? "—"} · {order?.full_name ?? "—"}</p>
            <div className="flex items-center justify-between text-sm"><span>Явц</span><strong>{project.progress_percent}%</strong></div><div role="progressbar" aria-valuenow={project.progress_percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Төслийн явц ${project.progress_percent}%`} className="h-2 overflow-hidden rounded bg-soft"><span className="block h-full rounded bg-primary" style={{ width: `${project.progress_percent}%` }}/></div>
            <p className="m-0 text-xs text-muted">Зорилтот хугацаа: {project.target_completion_date ? fmtDate(project.target_completion_date) : "Тохируулаагүй"} · Шинэчилсэн {fmtDateTime(project.updated_at)}</p>
            {project.description && <p className="m-0 line-clamp-2 text-sm text-muted">{project.description}</p>}
          </li>; })}
        </ul>
        <Panel><Pagination page={page} pages={Math.max(1,Math.ceil((count??0)/PAGE_SIZE))} total={count??0} makeHref={(p)=>hrefWith("/admin/projects",sp,{page:p})}/></Panel>
      </>}
    </Body>
  </>;
}

export default function ProjectsPage(props: { searchParams: Promise<Search> }) { return <Suspense fallback={<AdminPageSkeleton/>}><ProjectsContent {...props}/></Suspense>; }
