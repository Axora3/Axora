import { Suspense } from "react";
import { PageFrame } from "@/components/site/PageFrame";
import { Favorites } from "@/components/templates/Collections";
import { getPublishedTemplates } from "@/lib/templates/service";
export const metadata = { title: "Хадгалсан загварууд" };
async function Content(){const result=await getPublishedTemplates();return result.ok?<Favorites templates={result.templates}/>:<p role="alert" className="ax-panel text-danger">Загваруудыг ачаалж чадсангүй. Хуудсыг дахин ачаална уу.</p>;}
export default function Page(){return <PageFrame title="Хадгалсан" accent="загварууд" lead="Сонирхсон загваруудаа энд хадгалж, хүссэн үедээ үзээрэй." active="/favorites"><Suspense fallback={<p aria-busy="true">Ачаалж байна…</p>}><Content/></Suspense></PageFrame>}
