import { Suspense } from "react";
import Link from "next/link";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { Body, LoadFailed, Notice, PageHeader, Panel, PubPill, btn } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { DEFAULT_CONTENT, parseContent } from "@/lib/content/schema";
import { formatPrice } from "@/lib/templates/types";
import { fmtDateTime } from "@/lib/admin/labels";

export const metadata={title:"Маркетинг"};
async function MarketingContent(){
 const c=await requireAdminPage(); if(c.kind!=="ok")return null; const {db}=c.ctx;
 const [{data:content,error:contentError},{data:templates,error:templatesError}]=await Promise.all([
  db.from("site_content").select("draft,published,published_at,updated_at").eq("key","site").maybeSingle(),
  db.from("templates").select("id,title,slug,category,price,currency,is_free,status,sort_order").eq("status","published").order("sort_order",{ascending:true}).order("created_at",{ascending:false}).limit(6),
 ]);
 const published=content?.published?parseContent(content.published):DEFAULT_CONTENT;
 const liveCtas=[published.heroPrimary,published.heroSecondary];
 return <><PageHeader title="Маркетинг" description="Нүүрний одоогийн сурталчилгааны агуулга болон нийтэд харагдах эхний загварууд. Analytics, кампанит ажил, баннерын төлөв бүртгэх загвар одоогоор байхгүй." actions={<Link href="/admin/content" className={btn.primary}>Агуулгыг засах</Link>}/>
 <Body>
  <Panel title="Сурталчилгааны агуулга удирдах"><div className="flex flex-wrap gap-3 p-[18px]"><Link href="/admin/content" className={btn.primary}>Hero, CTA, холбоо барих</Link><Link href="/admin/library" className={btn.ghost}>Нийтлэл, портфолио, сургалт</Link><Link href="/admin/templates" className={btn.ghost}>Бүтээгдэхүүний эрэмбэ, харагдац</Link></div></Panel>
  {contentError&&<LoadFailed what="нийтэд нийтэлсэн агуулгыг"/>}{templatesError&&<LoadFailed what="нийтэд харагдах загваруудыг"/>}
  {!contentError&&<Panel title="Нүүрний hero" action={<PubPill published={!!content?.published}/>}>
   <div className="flex flex-col gap-3 p-[18px]"><p className="m-0 text-xs text-muted">{content?.published_at?`Нийтэлсэн ${fmtDateTime(content.published_at)}`:"Нийтлэлийн огноо бүртгэгдээгүй"}</p><h2 className="m-0 text-2xl font-extrabold">{published.heroTitle} <span className="serif text-brand">{published.heroAccent}</span></h2><p className="m-0 max-w-3xl text-sm leading-relaxed text-muted">{published.heroLead}</p><div className="flex flex-wrap gap-2">{liveCtas.map((cta)=><span key={cta.label} className="rounded-xl border border-line bg-sunken px-3 py-2 text-sm font-bold">{cta.label} <span className="font-normal text-muted">→ {cta.href}</span></span>)}</div><div className="flex flex-wrap gap-2"><Link href="/admin/content" className={btn.ghost}>Ноорог засах</Link><a href="/" target="_blank" rel="noopener noreferrer" className={btn.ghost}>Нийтийн нүүр нээх ↗</a></div></div>
  </Panel>}
  {!contentError&&<Panel title="Одоогийн холбоо барих сувгууд"><div className="grid gap-3 p-[18px] sm:grid-cols-2">{[["Утас",published.contact.phone],["Имэйл",published.contact.email],["Messenger",published.contact.messenger],["Цагийн хуваарь",published.contact.hours]].map(([label,value])=><div key={label} className="rounded-xl bg-sunken p-3"><p className="m-0 text-xs font-bold text-muted">{label}</p><p className="m-0 mt-1 text-sm font-semibold [overflow-wrap:anywhere]">{value||"Тохируулаагүй"}</p></div>)}</div></Panel>}
  <Panel title="Нийтэд харагдах загварууд" action={<Link href="/admin/templates" className="inline-flex min-h-11 items-center text-sm font-bold">Бүтээгдэхүүн удирдах →</Link>}>
   {templatesError?<LoadFailed what="нийтэд харагдах загваруудыг"/>:templates?.length?<ul className="m-0 list-none divide-y divide-soft p-0">{templates.map(t=><li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-[18px] py-3"><div><Link href={`/templates/${t.slug}`} target="_blank" rel="noopener noreferrer" className="font-bold text-ink">{t.title} ↗</Link><p className="m-0 text-xs text-muted">{t.category} · эрэмбэ {t.sort_order}</p></div><span className="text-sm font-bold">{formatPrice({isFree:t.is_free,price:Number(t.price),currency:t.currency})}</span></li>)}</ul>:<p className="p-[18px] text-sm text-muted">Нийтэлсэн бүтээгдэхүүн байхгүй.</p>}
  </Panel>
  <Notice>Энд зөвхөн одоо хадгалагдсан агуулга, нийтэлсэн бүтээгдэхүүн харагдана. Үзэлт, хөрвөлт, кампанит ажлын үр дүнгийн бодит tracking тохируулаагүй.</Notice>
 </Body></>;
}
export default function MarketingPage(){return <Suspense fallback={<AdminPageSkeleton/>}><MarketingContent/></Suspense>;}
