import { Suspense } from "react";
import Link from "next/link";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { Body, EmptyState, LoadFailed, Notice, PageHeader, Pagination, Panel, btn, field } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { ADMIN_MODULE_MIGRATION_HINT, isMissingMigration } from "@/lib/admin/db-errors";
import { CONTACT_STATUSES, CONTACT_STATUS, type ContactStatus } from "@/lib/admin/projects";
import { fmtDateTime } from "@/lib/admin/labels";
import { PAGE_SIZE, hrefWith, one, page as pageOf, safeSearch } from "@/lib/admin/query";

export const metadata = { title: "Тусламжийн хүсэлт" };

type Search=Record<string,string|string[]|undefined>;
async function SupportContent({searchParams}:{searchParams:Promise<Search>}){
  const c=await requireAdminPage(); if(c.kind!=="ok")return null;
  const sp=await searchParams; const q=safeSearch(one(sp,"q")); const status=CONTACT_STATUSES.includes(one(sp,"status") as ContactStatus)?one(sp,"status"):""; const page=pageOf(sp); const {db}=c.ctx;
  let query=db.from("contact_messages").select("id, name, contact, message, status, created_at, updated_at",{count:"exact"});
  if(q)query=query.or(`name.ilike.*${q}*,contact.ilike.*${q}*,message.ilike.*${q}*`);
  if(status)query=query.eq("status",status);
  const [{data,count,error},...totals]=await Promise.all([query.order("created_at",{ascending:false}).range((page-1)*PAGE_SIZE,page*PAGE_SIZE-1),...CONTACT_STATUSES.map(s=>db.from("contact_messages").select("id",{count:"exact",head:true}).eq("status",s))]);
  const missing=isMissingMigration(error); const rows=data??[]; const filtered=!!(q||status);
  return <><PageHeader title="Тусламжийн хүсэлтүүд" description="Сайтын холбоо барих формоор ирсэн зурвасууд. Хариуг гадуур өөрөө илгээж, төлөвийг энд тэмдэглэнэ.">
    <form method="get" role="search" className="flex flex-wrap gap-2" aria-label="Тусламжийн хүсэлт хайх">{status&&<input type="hidden" name="status" value={status}/>}<label className="sr-only" htmlFor="support-q">Нэр, холбоо барих мэдээлэл, зурвасаар хайх</label><input id="support-q" name="q" type="search" defaultValue={one(sp,"q")} placeholder="Нэр, холбоо барих, зурвас…" className={`${field.input} min-h-12 rounded-[13px] bg-surface`}/><button className={btn.primary}>Хайх</button></form>
    <nav aria-label="Төлөв" className="ax-scroll gap-1.5"><Link href={hrefWith("/admin/support",sp,{status:null,page:null})} className={`${btn.ghost} shrink-0`}>Бүгд</Link>{CONTACT_STATUSES.map((s,i)=><Link key={s} href={hrefWith("/admin/support",sp,{status:s,page:null})} aria-current={status===s?"page":undefined} className={`${btn.ghost} shrink-0`}>{CONTACT_STATUS[s].label} · {totals[i].count??"—"}</Link>)}</nav>
  </PageHeader><Body>{missing&&<Notice tone="warn">{ADMIN_MODULE_MIGRATION_HINT}</Notice>}{error&&!missing?<LoadFailed what="тусламжийн хүсэлтүүдийг"/>:!rows.length?<Panel><EmptyState title={filtered?"Тохирох хүсэлт олдсонгүй":missing?"Тусламжийн migration шаардлагатай":"Одоогоор шинэ зурвас алга"}/></Panel>:<><p className="text-sm font-bold text-muted">Нийт {count??0} хүсэлт{filtered&&<> · <Link href="/admin/support">Цэвэрлэх</Link></>}</p><Panel><ul className="m-0 list-none p-0">{rows.map(m=><li key={m.id} className="flex flex-col gap-2 border-t border-soft p-4 first:border-t-0"><div className="flex flex-wrap items-center justify-between gap-2"><Link href={`/admin/support/${m.id}`} className="text-base font-extrabold text-ink no-underline">{m.name}</Link><span className="rounded-full bg-soft px-2.5 py-1 text-xs font-bold">{CONTACT_STATUS[m.status as ContactStatus]?.label??m.status}</span></div><span className="text-sm text-muted">{m.contact} · {fmtDateTime(m.created_at)}</span><p className="m-0 line-clamp-2 text-sm leading-relaxed">{m.message}</p></li>)}</ul><Pagination page={page} pages={Math.max(1,Math.ceil((count??0)/PAGE_SIZE))} total={count??0} makeHref={p=>hrefWith("/admin/support",sp,{page:p})}/></Panel></>}</Body></>;
}

export default function SupportPage(props:{searchParams:Promise<Search>}){return <Suspense fallback={<AdminPageSkeleton/>}><SupportContent {...props}/></Suspense>;}
