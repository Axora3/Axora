import { Suspense } from "react";
import { LibraryEditor } from "@/components/admin/LibraryEditor";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { Body, LoadFailed, PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { parseContent } from "@/lib/content/schema";
export const metadata={title:"Контент удирдах"};
async function Content(){const c=await requireAdminPage();if(c.kind!=="ok")return null;const {data,error}=await c.ctx.db.from("site_content").select("draft,published,updated_at").eq("key","site").maybeSingle();return <><PageHeader title="Сайтын контент" description="Портфолио, сургалт, нийтлэл, багц болон загварын шинэчлэлт."/><Body>{error||!data?<LoadFailed what="агуулгыг"/>:<LibraryEditor initial={parseContent(data.draft??data.published)} updatedAt={data.updated_at}/>}</Body></>}
export default function Page(){return <Suspense fallback={<AdminPageSkeleton/>}><Content/></Suspense>}
