import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { NotesHistory } from "@/components/admin/NotesHistory";
import { ProjectForm, ProjectMilestones, type Milestone } from "@/components/admin/ProjectControls";
import { Body, LoadFailed, Notice, PageHeader, Panel, btn } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { ADMIN_MODULE_MIGRATION_HINT, isMissingMigration } from "@/lib/admin/db-errors";
import { fmtDateTime } from "@/lib/admin/labels";
import { PROJECT_STATUS, type ProjectStatus } from "@/lib/admin/projects";

export const metadata = { title: "Веб төсөл" };

async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { db, user } = c.ctx;
  const { data: project, error } = await db.from("website_projects").select("id, order_id, status, description, start_date, target_completion_date, progress_percent, updated_at, created_at, website_orders(id, reference, business_name, full_name, email, phone, status)").eq("id", id).maybeSingle();
  if (isMissingMigration(error)) return <><PageHeader title="Веб төсөл"/><Body><Notice tone="warn">{ADMIN_MODULE_MIGRATION_HINT}</Notice></Body></>;
  if (error) return <Body><LoadFailed what="төслийг"/></Body>;
  if (!project) notFound();
  const { data: milestones, error: milestoneError } = await db.from("project_milestones").select("id, project_id, title, description, due_on, completed_at, updated_at").eq("project_id", id).order("sort_order").order("created_at");
  const order = project.website_orders as unknown as { id: string; reference: string; business_name: string; full_name: string; email: string; phone: string; status: string } | null;
  const status = PROJECT_STATUS[project.status as ProjectStatus];
  return <>
    <PageHeader crumbs={[{href:"/admin/projects",label:"Веб төслүүд"}]} title={order?.business_name ?? "Веб төсөл"} description={<span>{order?.reference ?? "—"} · үүсгэсэн {fmtDateTime(project.created_at)} · <span style={{color:status?.tone}}>{status?.label ?? project.status}</span></span>} actions={order ? <Link href={`/admin/orders/${order.id}`} className={btn.ghost}>Захиалгыг нээх →</Link> : undefined}/>
    <Body>
      <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title="Төслийн мэдээлэл"><div className="p-[18px]"><ProjectForm key={project.updated_at} project={{id:project.id,orderId:project.order_id,expected:project.updated_at,status:project.status as ProjectStatus,description:project.description,startDate:project.start_date,targetDate:project.target_completion_date,progress:project.progress_percent}}/></div></Panel>
          <Panel title="Үе шат"><div className="p-[18px]">{milestoneError ? <LoadFailed what="төслийн үе шатуудыг"/> : <ProjectMilestones projectId={id} milestones={(milestones??[]) as Milestone[]}/>}</div></Panel>
          <Panel title="Тэмдэглэл ба түүх"><div className="p-[18px]"><NotesHistory db={db} entityType="website_project" entityId={id} meId={user.id}/></div></Panel>
        </div>
        <aside className="flex flex-col gap-4">
          <Panel title="Холбогдох захиалга"><div className="flex flex-col gap-2 p-[18px] text-sm"><strong>{order?.business_name ?? "—"}</strong><span>{order?.full_name ?? "—"}</span><span className="font-mono text-muted">{order?.reference ?? "—"}</span>{order && <Link href={`/admin/orders/${order.id}`} className={btn.ghost}>Анкет, файл, захиалгын түүх үзэх</Link>}<p className="m-0 text-xs leading-relaxed text-muted">Захиалагчийн хувийн мэдээлэл болон анкетын хариултыг эх захиалгад нь хадгална.</p></div></Panel>
        </aside>
      </div>
    </Body>
  </>;
}

export default function ProjectDetailPage(props: { params: Promise<{ id: string }> }) { return <Suspense fallback={<AdminPageSkeleton/>}><ProjectDetail {...props}/></Suspense>; }
