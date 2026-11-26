"use client";
import {useEffect,useState} from 'react';
import type {Answers} from '@/lib/order/questions';
import type {generateQuotation} from '@/lib/order-workflow/pricing';
import {formatMnt} from '@/lib/order/payment';
type Preview=ReturnType<typeof generateQuotation>;
export function PricePreview({answers}:{answers:Answers}){
 const [state,setState]=useState<{quote?:Preview;error?:string;loading?:boolean}>({});
 const inputs=JSON.stringify(Object.fromEntries(['qPackage','qPages','qAddons','q12','q13','q23','q28','q29','q30','q37','qUrgent','qMaintenance','qExtraRevs'].map(k=>[k,answers[k]])));
 useEffect(()=>{const controller=new AbortController();const timer=setTimeout(async()=>{
  setState(s=>({...s,loading:true,error:undefined}));
  try{const r=await fetch('/api/quotation/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers:JSON.parse(inputs)}),signal:controller.signal});const b=await r.json();if(!controller.signal.aborted)setState(r.ok&&b.quotation?{quote:b.quotation}:{error:'Урьдчилсан тооцоо түр ачаалагдахгүй байна. Анкетаа үргэлжлүүлж болно.'});}
  catch{if(!controller.signal.aborted)setState({error:'Урьдчилсан тооцоо түр ачаалагдахгүй байна. Анкетаа үргэлжлүүлж болно.'});}
 },600);return()=>{clearTimeout(timer);controller.abort()};},[inputs]);
 return <aside aria-label="Урьдчилсан тооцоо" className="my-5 rounded-2xl border border-line-soft p-4 text-sm" aria-busy={state.loading}>
  <h2 className="font-bold">Урьдчилсан тооцоо</h2>
  {state.loading?<p>Тооцоолж байна…</p>:state.error?<p>{state.error}</p>:state.quote?<><p>{state.quote.packageLabel??'Багцаа сонгоно уу'} · {state.quote.total==null?'Тусгай шаардлагыг тодруулна':formatMnt(state.quote.total)}</p>{state.quote.monthlyTotal>0&&<p>Сарын арчилгаа: {formatMnt(state.quote.monthlyTotal)}</p>}<p className="text-muted">Эцсийн үнийг анкет илгээх үед сервер баталгаажуулна.</p></>:<p>Хуудасны тоо болон функцүүдээ сонгоно уу.</p>}
 </aside>;
}
