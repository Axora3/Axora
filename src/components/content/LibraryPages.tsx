import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageFrame } from "@/components/site/PageFrame";
import { getSiteContent } from "@/lib/content/service";
import { getPublishedTemplates } from "@/lib/templates/service";
import { libraryHref, type LibraryKind } from "@/lib/content/library";
import { LibraryBrowser, LibraryCover, LessonReader } from "./LibraryBrowser";
import { LibraryBody } from "./LibraryBody";

const copy = {
  portfolio: ["Бидний хийсэн", "ажлууд", "Вебийн санаа, дизайн, шийдлийн танилцуулгуудыг нэг дороос үзнэ үү."],
  learn: ["Сургалт ба", "заавар", "Худалдан авсан загвараа үр дүнтэй ашиглах хэрэгтэй зааврууд."],
  blog: ["Нийтлэл ба", "зөвлөгөө", "Excel, Notion, Canva болон веб хөгжүүлэлтийн хэрэгтэй мэдлэг."],
  bundle: ["Хэрэгтэй загваруудаа", "нэг дор", "Нэг зорилгод зориулсан хэрэгтэй загваруудыг багцаар нь сонгоорой."],
  release: ["Загварын", "шинэчлэлт", "Нийтлэгдсэн хувилбарууд болон өөрчлөлтийн мэдээлэл."],
};
async function Listing({kind}:{kind:LibraryKind}){const c=await getSiteContent();return <LibraryBrowser kind={kind} entries={c.library.filter(e=>e.kind===kind&&e.published)}/>}
export function LibraryIndex({kind}:{kind:LibraryKind}) {
  const [title,accent,lead]=copy[kind];
  if(kind==="portfolio") return <><SiteHeader active="/portfolio"/><main id="main" className="ax-page">
    <aside role="note" className="mb-5 rounded-xl border border-info/20 bg-info-bg p-4 text-sm leading-relaxed text-info"><strong className="mr-1">Тайлбар.</strong> Портфолиод нийтлэгдсэн жишээнүүд нь танилцуулгын зориулалттай бөгөөд бодит хэрэглэгчийн төслийн үр дүн гэж батлахгүй.</aside>
    <header className="mb-7 rounded-[24px] bg-band p-6 text-on-band sm:p-9"><span className="text-xs font-extrabold uppercase tracking-[.18em] text-lime">Портфолио</span><div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{title} <span className="serif text-lime">{accent}</span></h1><p className="mt-3 max-w-2xl leading-relaxed text-on-band/80">{lead}</p></div><Link className="ax-button shrink-0 border-0 bg-lime text-on-lime" href="/order">Веб захиалах</Link></div></header>
    <Suspense fallback={<p aria-busy="true">Агуулга ачаалж байна…</p>}><Listing kind={kind}/></Suspense>
  </main></>;
  return <PageFrame title={title} accent={accent} lead={lead} active={kind==="bundle"?"/bundles":`/${kind}`}><Suspense fallback={<p aria-busy="true">Агуулга ачаалж байна…</p>}><Listing kind={kind}/></Suspense></PageFrame>;
}
async function DetailContent({kind,params}:{kind:LibraryKind;params:Promise<{slug:string}>}){
  const {slug}=await params;const c=await getSiteContent();const entry=c.library.find(e=>e.kind===kind&&e.slug===slug&&e.published);if(!entry)notFound();
  if(kind==="learn")return <LessonReader entry={entry}/>;
  const products=kind==="bundle"?await getPublishedTemplates():null;
  const included=products?.ok?products.templates.filter(t=>entry.templateIds.includes(t.id)):[];
  const related=kind==="blog"?c.library.filter((item)=>item.kind==="blog"&&item.published&&item.id!==entry.id&&item.tags.some((tag)=>entry.tags.includes(tag))).slice(0,3):[];
  return <><Link className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-brand" href={kind==="bundle"?"/bundles":`/${kind}`}>← {kind==="bundle"?"Багцууд":copy[kind][0]}</Link><div className="ax-detail-grid"><article className="min-w-0"><span className="text-sm font-bold text-brand">{entry.category}</span><h1 className="ax-title mt-3 mb-5">{entry.title}</h1><p className="mb-6 leading-relaxed text-muted">{entry.summary}</p><div className="overflow-hidden rounded-2xl"><LibraryCover entry={entry} large/></div><LibraryBody text={entry.body} className="my-7 space-y-4"/>{kind==="bundle"&&<section className="ax-panel mb-6"><h2 className="mb-4 text-xl font-extrabold">Багцад багтсан {included.length} загвар</h2>{products&&!products.ok&&<p role="alert">Загваруудыг ачаалж чадсангүй.</p>}{included.map(t=><Link key={t.id} className="flex min-h-16 items-center justify-between gap-4 border-t border-line py-3 text-sm font-bold" href={`/templates/${t.slug}`}><span>{t.title}</span><span className="text-brand">Загвар үзэх →</span></Link>)}{entry.templateIds.length!==included.length&&<p className="mt-3 text-sm text-warn">Зарим загвар одоогоор нийтлэгдээгүй байна.</p>}</section>}{entry.sections.map((s,i)=><section key={i} className="ax-panel mb-5"><h2 className="mb-3 text-xl font-extrabold">{s.title}</h2><LibraryBody text={s.body} className="space-y-4 text-muted"/></section>)}{related.length>0&&<section className="mt-10"><h2 className="mb-4 text-2xl font-extrabold">Холбоотой нийтлэлүүд</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((item)=><Link key={item.id} href={libraryHref(item)} className="rounded-2xl border border-line bg-surface p-5 transition hover:border-brand"><span className="text-xs font-bold text-brand">{item.category}</span><h3 className="mt-2 font-extrabold leading-snug">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{item.summary}</p></Link>)}</div></section>}</article><aside className="ax-panel space-y-4 lg:sticky lg:top-24"><h2 className="font-extrabold">{kind==="bundle"?"Багцын мэдээлэл":kind==="portfolio"?"Төслийн мэдээлэл":"Энэ нийтлэлд"}</h2><div className="flex flex-wrap gap-2">{entry.tags.map(t=><span className="rounded-lg bg-soft px-3 py-1.5 text-xs font-bold text-brand" key={t}>{t}</span>)}</div>{kind==="bundle"?<><p className="text-2xl font-extrabold">{entry.price===null?"Үнэ тохируулаагүй":`${entry.price.toLocaleString("en-US")}₮`}</p><p className="text-sm leading-relaxed text-muted">Багцын үнэ, авах боломж болон хүргэлтийн талаар лавлах бол холбоо барина уу.</p><Link className="ax-button ax-button-primary w-full" href={{ pathname: "/contact", query: { bundle: entry.slug } }}>Багцын талаар асуух</Link></>:kind==="portfolio"?<Link href="/order" className="ax-button ax-button-primary w-full">Ийм төрлийн веб захиалах</Link>:<Link href="/learn" className="ax-button w-full">Холбоотой заавар</Link>}<Link className="block text-sm font-bold text-brand underline" href="/contact">Асуух зүйл байна уу?</Link></aside></div></>;
}
export function LibraryDetail({kind,params}:{kind:LibraryKind;params:Promise<{slug:string}>}){return <><SiteHeader active={kind==="bundle"?"/bundles":`/${kind}`}/><main id="main" className="ax-page"><Suspense fallback={<p aria-busy="true">Ачаалж байна…</p>}><DetailContent kind={kind} params={params}/></Suspense></main></>}
