import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { CopyButton } from "@/components/admin/client";
import { NotesHistory } from "@/components/admin/NotesHistory";
import { SupportStatusControl } from "@/components/admin/SupportControls";
import { Body, LoadFailed, Notice, PageHeader, Panel, btn } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { ADMIN_MODULE_MIGRATION_HINT, isMissingMigration } from "@/lib/admin/db-errors";
import { CONTACT_STATUS, type ContactStatus } from "@/lib/admin/projects";
import { fmtDateTime } from "@/lib/admin/labels";

export const metadata={title:"Тусламжийн хүсэлт"};
async function SupportDetail({params}:{params:Promise<{id:string}>}){
 const c=await requireAdminPage(); if(c.kind!=="ok")return null; const {id}=await params; if(!/^[0-9a-f-]{36}$/i.test(id))notFound(); const {db,user}=c.ctx;
 const {data:m,error}=await db.from("contact_messages").select("id,name,contact,message,status,created_at,updated_at").eq("id",id).maybeSingle();
 if(isMissingMigration(error))return <><PageHeader title="Тусламжийн хүсэлт"/><Body><Notice tone="warn">{ADMIN_MODULE_MIGRATION_HINT}</Notice></Body></>;
 if(error)return <Body><LoadFailed what="тусламжийн хүсэлтийг"/></Body>; if(!m)notFound();
 return <><PageHeader crumbs={[{href:"/admin/support",label:"Тусламж"}]} title={m.name} description={<span>{CONTACT_STATUS[m.status as ContactStatus]?.label??m.status} · ирсэн {fmtDateTime(m.created_at)}</span>} actions={<Link href="/admin/support" className={btn.ghost}>Жагсаалт</Link>}/>
 <Body><div className="grid items-start gap-5 min-[1000px]:grid-cols-[minmax(0,1fr)_360px]"><div className="flex flex-col gap-5"><Panel title="Ирсэн зурвас"><div className="flex flex-col gap-4 p-[18px]"><div><p className="m-0 text-xs font-bold text-muted">Холбоо барих мэдээлэл</p><p className="m-0 mt-1 text-base font-bold [overflow-wrap:anywhere]">{m.contact}</p><CopyButton value={m.contact} label="Холбоо барих"/></div><div><p className="m-0 text-xs font-bold text-muted">Зурвас</p><p className="m-0 mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{m.message}</p></div></div></Panel><Panel title="Тэмдэглэл ба түүх"><div className="p-[18px]"><NotesHistory db={db} entityType="contact_message" entityId={id} meId={user.id}/></div></Panel></div>
 <aside className="flex flex-col gap-4"><Panel title="Хүсэлтийн төлөв"><div className="p-[18px]"><SupportStatusControl key={m.updated_at} id={m.id} updatedAt={m.updated_at} status={m.status as ContactStatus}/></div></Panel><Panel><div className="p-[18px] text-sm text-muted">Систем зурвас илгээдэггүй. Та гадуур хариу илгээсний дараа “Хариулсан гэж тэмдэглэсэн” төлөв сонгоно уу.</div></Panel></aside></div></Body></>;
}
export default function SupportDetailPage(props:{params:Promise<{id:string}>}){return <Suspense fallback={<AdminPageSkeleton/>}><SupportDetail {...props}/></Suspense>;}
