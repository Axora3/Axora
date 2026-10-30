import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageFrame } from "@/components/site/PageFrame";
import { getSiteContent } from "@/lib/content/service";
import { getPublishedTemplates } from "@/lib/templates/service";
import type { LibraryKind } from "@/lib/content/library";
import { LibraryBrowser, LibraryCover, LessonReader } from "./LibraryBrowser";

const copy = {
  portfolio: ["Бидний хийсэн", "ажлууд", "AXORA-ийн хэрэгжүүлсэн веб төслүүд. Санаа, шийдэл, үр дүнг нэг дороос."],
  learn: ["Сургалт ба", "заавар", "Худалдан авсан загвараа үр дүнтэй ашиглах хэрэгтэй зааврууд."],
  blog: ["Нийтлэл ба", "зөвлөгөө", "Excel, Notion, Canva болон веб хөгжүүлэлтийн хэрэгтэй мэдлэг."],
  bundle: ["Хэрэгтэй загваруудаа", "нэг дор", "Нэг зорилгод зориулсан хэрэгтэй загваруудыг багцаар нь сонгоорой."],
  release: ["Загварын", "шинэчлэлт", "Нийтлэгдсэн хувилбарууд болон өөрчлөлтийн мэдээлэл."],
};
async function Listing({kind}:{kind:LibraryKind}){const c=await getSiteContent();return <LibraryBrowser kind={kind} entries={c.library.filter(e=>e.kind===kind&&e.published)}/>}
export function LibraryIndex({kind}:{kind:LibraryKind}) {
  const [title,accent,lead]=copy[kind];
  return <PageFrame title={title} accent={accent} lead={lead} active={kind==="bundle"?"/bundles":`/${kind}`}>{kind==="portfolio"&&<div className="mb-7 flex flex-wrap items-center justify-between gap-5 rounded-[20px] bg-band p-8 text-on-band"><div><span className="text-xs font-bold uppercase tracking-widest text-lime">Портфолио</span><h2 className="mt-3 text-3xl font-extrabold">Таны дараагийн <span className="serif text-lime">веб сайт</span></h2></div><Link className="ax-button border-0 bg-lime text-on-lime" href="/order">Веб захиалах</Link></div>}<Suspense fallback={<p aria-busy="true">Агуулга ачаалж байна…</p>}><Listing kind={kind}/></Suspense></PageFrame>;
}
async function DetailContent({kind,params}:{kind:LibraryKind;params:Promise<{slug:string}>}){
  const {slug}=await params;const c=await getSiteContent();const entry=c.library.find(e=>e.kind===kind&&e.slug===slug&&e.published);if(!entry)notFound();
  if(kind==="learn")return <LessonReader entry={entry}/>;
  const products=kind==="bundle"?await getPublishedTemplates():null;
  const included=products?.ok?products.templates.filter(t=>entry.templateIds.includes(t.id)):[];
  return <><Link className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-brand" href={kind==="bundle"?"/bundles":`/${kind}`}>← {kind==="bundle"?"Багцууд":copy[kind][0]}</Link><div className="ax-detail-grid"><article className="min-w-0"><span className="text-sm font-bold text-brand">{entry.category}</span><h1 className="ax-title mt-3 mb-5">{entry.title}</h1><p className="mb-6 leading-relaxed text-muted">{entry.summary}</p><div className="overflow-hidden rounded-2xl"><LibraryCover entry={entry} large/></div><div className="my-7 space-y-4 leading-relaxed">{entry.body.split(/\n\s*\n/).map((p,i)=><p className="whitespace-pre-line" key={i}>{p}</p>)}</div>{kind==="bundle"&&<section className="ax-panel mb-6"><h2 className="mb-4 text-xl font-extrabold">Багцад багтсан {included.length} загвар</h2>{products&&!products.ok&&<p role="alert">Загваруудыг ачаалж чадсангүй.</p>}{included.map(t=><Link key={t.id} className="flex min-h-16 items-center justify-between gap-4 border-t border-line py-3 text-sm font-bold" href={`/templates/${t.slug}`}><span>{t.title}</span><span className="text-brand">Загвар үзэх →</span></Link>)}{entry.templateIds.length!==included.length&&<p className="mt-3 text-sm text-warn">Зарим загвар одоогоор нийтлэгдээгүй байна.</p>}</section>}{entry.sections.map((s,i)=><section key={i} className="ax-panel mb-5"><h2 className="mb-3 text-xl font-extrabold">{s.title}</h2><p className="whitespace-pre-line leading-relaxed text-muted">{s.body}</p></section>)}</article><aside className="ax-panel space-y-4 lg:sticky lg:top-24"><h2 className="font-extrabold">{kind==="bundle"?"Багцын мэдээлэл":kind==="portfolio"?"Төслийн мэдээлэл":"Энэ нийтлэлд"}</h2><div className="flex flex-wrap gap-2">{entry.tags.map(t=><span className="rounded-lg bg-soft px-3 py-1.5 text-xs font-bold text-brand" key={t}>{t}</span>)}</div>{kind==="bundle"?<><p className="text-2xl font-extrabold">{entry.price===null?"Үнэ тохируулаагүй":`${entry.price.toLocaleString("en-US")}₮`}</p><p className="text-sm leading-relaxed text-muted">Хүсэлт илгээсний дараа багцын үнэ, хүргэлтийг баталгаажуулна.</p><Link className="ax-button ax-button-primary w-full" href={`/checkout?bundle=${encodeURIComponent(entry.slug)}`}>Багц авах хүсэлт</Link></>:kind==="portfolio"?<Link href="/order" className="ax-button ax-button-primary w-full">Ийм төрлийн веб захиалах</Link>:<Link href="/learn" className="ax-button w-full">Холбоотой заавар</Link>}<Link className="block text-sm font-bold text-brand underline" href="/contact">Асуух зүйл байна уу?</Link></aside></div></>;
}
export function LibraryDetail({kind,params}:{kind:LibraryKind;params:Promise<{slug:string}>}){return <><SiteHeader active={kind==="bundle"?"/bundles":`/${kind}`}/><main id="main" className="ax-page"><Suspense fallback={<p aria-busy="true">Ачаалж байна…</p>}><DetailContent kind={kind} params={params}/></Suspense></main></>}
