"use client";

import { runAdminAction } from "@/lib/admin/action-client";

import { useUnsavedChanges } from "./useUnsavedChanges";
import { useState, useTransition } from "react";
import Link from "next/link";
import { publishContentAction, saveContentDraftAction } from "@/app/admin/content-actions";
import { LIBRARY_KINDS, LIBRARY_LABELS, libraryHref, type LibraryEntry, type LibraryKind } from "@/lib/content/library";
import type { SiteContent } from "@/lib/content/schema";

export function LibraryEditor({ initial, updatedAt, initialKind = "portfolio" }: { initial: SiteContent; updatedAt: string; initialKind?: LibraryKind }) {
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  useUnsavedChanges(JSON.stringify(content) !== saved);
  const [kind, setKind] = useState<LibraryKind>(initialKind);
  const [selected, setSelected] = useState<string | null>(null);
  const [expected, setExpected] = useState(updatedAt);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const entries = content.library.filter(e => e.kind === kind);
  const entry = entries.find(e => e.id === selected) ?? entries[0];
  function patch(p: Partial<LibraryEntry>) { if(entry) setContent(c => ({...c,library:c.library.map(e => e.id===entry.id ? {...e,...p}:e)})); }
  function add() {
    const id = crypto.randomUUID();
    const next: LibraryEntry = { id, kind, slug: `draft-${id.slice(0,8)}`, title: "Шинэ агуулга", summary:"", category:"", body:"", coverUrl:"", tags:[], sections:[], templateIds:[], price:null, version:"", published:false };
    setContent(c => ({...c,library:[...c.library,next]})); setSelected(id);
  }
  function save(publish: boolean) {
    setMessage(""); start(async()=>{const r = publish ? await runAdminAction(() => publishContentAction(expected,content)) : await runAdminAction(() => saveContentDraftAction(expected,content)); if(!r.ok){setMessage(r.message);return;}setExpected(r.updatedAt);setSaved(JSON.stringify(content));setMessage(publish?"Нийтлэгдлээ. Нийтлэхээр сонгосон агуулга сайтад харагдана.":"Ноорог серверт хадгалагдлаа.");});
  }
  const textField = (key: "title"|"slug"|"category"|"summary"|"body"|"coverUrl"|"version", label: string, multiline = false) => entry && <label className="ax-label">{label}{multiline?<textarea className="ax-input font-normal" rows={key==="body"?8:3} value={entry[key]} onChange={e=>patch({[key]:e.target.value})}/>:<input className="ax-input font-normal" value={entry[key]} onChange={e=>patch({[key]:e.target.value})}/>}</label>;
  return <div className="space-y-5"><div className="ax-scroll gap-2" role="group" aria-label="Агуулгын төрөл">{LIBRARY_KINDS.map(k=><button key={k} className="ax-choice shrink-0" aria-pressed={kind===k} onClick={()=>{setKind(k);setSelected(null)}}>{LIBRARY_LABELS[k]} · {content.library.filter(e=>e.kind===k).length}</button>)}</div><p className="rounded-xl bg-info-bg p-3 text-sm text-info">Ноорог хадгалах нь сайтад шууд нийтлэхгүй. Доорх “Нийтлэх агуулга” сонголттой бичлэгүүд “Сайтад нийтлэх” дарсны дараа нийтэд харагдана.</p><div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]"><aside className="ax-panel p-4"><div className="mb-4 flex items-center justify-between"><h2 className="font-extrabold">{LIBRARY_LABELS[kind]}</h2><button className="ax-button" onClick={add}>+ Шинэ</button></div><div className="grid gap-2">{entries.map(e=><button key={e.id} onClick={()=>setSelected(e.id)} className={`rounded-lg border p-3 text-left text-sm ${entry?.id===e.id?"border-brand bg-soft":"border-line"}`}><strong className="block">{e.title}</strong><span className="text-xs text-muted">{e.published?"Нийтлэхээр сонгосон":"Ноорог"}</span></button>)}{!entries.length&&<p className="text-sm text-muted">Агуулга оруулаагүй байна.</p>}</div></aside><section className="ax-panel space-y-4">{entry?<><div className="flex flex-wrap justify-between gap-3"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={entry.published} onChange={e=>patch({published:e.target.checked})}/>Нийтлэх агуулга</label><Link className="ax-button" href={libraryHref(entry)} target="_blank">Нийтийн хуудас ↗</Link></div><div className="grid gap-4 sm:grid-cols-2">{textField("title","Гарчиг")}{textField("slug","Slug · латин үсэг, тоо, зураас")}{textField("category","Ангилал")}{textField("coverUrl","Нүүр зургийн HTTPS холбоос")}</div>{textField("summary","Товч тайлбар",true)}{textField("body","Үндсэн агуулга · догол мөрөөр",true)}<label className="ax-label">Шошго · таслалаар тусгаарлана<input className="ax-input" value={entry.tags.join(", ")} onChange={e=>patch({tags:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})}/></label>{(kind==="bundle"||kind==="learn"||kind==="release")&&<label className="ax-label">Холбоотой загварын ID · таслалаар тусгаарлана<input className="ax-input" value={entry.templateIds.join(", ")} onChange={e=>patch({templateIds:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})}/></label>}{kind==="bundle"&&<label className="ax-label">Багцын үнэ · ₮, тохируулаагүй бол хоосон<input className="ax-input" type="number" min="0" value={entry.price??""} onChange={e=>patch({price:e.target.value===""?null:Number(e.target.value)})}/></label>}{kind==="release"&&textField("version","Хувилбар")}<h3 className="font-extrabold">{kind==="learn"?"Хичээлүүд":"Агуулгын хэсгүүд"}</h3>{entry.sections.map((s,i)=><div key={i} className="space-y-2 rounded-xl border border-line bg-sunken p-3"><label className="ax-label">{i+1}. Гарчиг<input className="ax-input" value={s.title} onChange={e=>patch({sections:entry.sections.map((x,j)=>j===i?{...x,title:e.target.value}:x)})}/></label><label className="ax-label">Тайлбар<textarea className="ax-input" rows={4} value={s.body} onChange={e=>patch({sections:entry.sections.map((x,j)=>j===i?{...x,body:e.target.value}:x)})}/></label><button className="ax-button text-danger" onClick={()=>patch({sections:entry.sections.filter((_,j)=>j!==i)})}>Хэсгийг хасах</button></div>)}<button className="ax-button" onClick={()=>patch({sections:[...entry.sections,{title:"Шинэ хэсэг",body:""}]})}>+ Хэсэг нэмэх</button></>:<p className="py-12 text-center text-muted">Шинэ агуулга нэмээд мэдээллээ оруулна уу.</p>}<div className="flex flex-wrap gap-2 border-t border-line pt-4"><button disabled={pending} className="ax-button" onClick={()=>save(false)}>Ноорог хадгалах</button><button disabled={pending} className="ax-button ax-button-primary" onClick={()=>save(true)}>{pending?"Хадгалж байна…":"Сайтад нийтлэх"}</button></div>{message&&<p role="status" className="rounded-lg bg-soft p-3 text-sm">{message}</p>}</section></div></div>;
}
