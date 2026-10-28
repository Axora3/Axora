import { ContentEditor } from "@/components/admin/ContentEditor";
import { Body, LoadFailed, PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { DEFAULT_CONTENT, parseContent } from "@/lib/content/schema";

export const metadata = { title: "Сайтын агуулга" };

export default async function ContentPage() {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const { data, error } = await c.ctx.db.from("site_content").select("draft, published, published_at, updated_at").eq("key", "site").maybeSingle();
  return (
    <>
      <PageHeader title="Сайтын агуулга" description="Нүүрний гарчиг, холбоо барих, FAQ, footer. Ноорог нийтлэх хүртэл сайтад нөлөөлөхгүй. Зөвхөн энгийн текст." />
      <Body>
        {error || !data ? (
          <LoadFailed what="агуулгыг" />
        ) : (
          <ContentEditor
            initial={data.draft && Object.keys(data.draft).length ? parseContent(data.draft) : data.published ? parseContent(data.published) : DEFAULT_CONTENT}
            published={data.published ? parseContent(data.published) : null}
            updatedAt={data.updated_at}
            publishedAt={data.published_at}
          />
        )}
      </Body>
    </>
  );
}
