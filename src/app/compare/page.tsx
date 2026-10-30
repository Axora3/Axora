import { Suspense } from "react";
import { PageFrame } from "@/components/site/PageFrame";
import { Comparison } from "@/components/templates/Collections";
import { getPublishedTemplates } from "@/lib/templates/service";
export const metadata = { title: "Загвар харьцуулах" };
async function Content(){const result=await getPublishedTemplates();return result.ok?<Comparison templates={result.templates}/>:<p role="alert" className="ax-panel text-danger">Загваруудыг ачаалж чадсангүй.</p>;}
export default function Page(){return <PageFrame title="Загвар" accent="харьцуулах" active="/templates"><Suspense fallback={<p aria-busy="true">Ачаалж байна…</p>}><Content/></Suspense></PageFrame>}
