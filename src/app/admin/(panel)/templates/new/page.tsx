import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import { TemplateEditor } from "@/components/admin/TemplateEditor";
import { Body, PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";

export const metadata = { title: "Шинэ загвар" };

export default async function NewTemplate() {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  await connection();
  return (
    <>
      <PageHeader crumbs={[{ href: "/admin/templates", label: "Загварууд" }]} title="Шинэ загвар" description="Ноорог болгон хадгалаад дараа нь нийтэлж болно." />
      <Body>
        <TemplateEditor
          id={null}
          updatedAt={null}
          status="draft"
          folder={randomUUID()}
          previewStyle={{ tint: "#EEF1E6", accent: "#245C45", soft: "#CFE0D3", p1: "", c1: "", c2: "", c3: "" }}
          initial={{ title: "", slug: "", category: "Notion", shortDescription: "", longDescription: "", isFree: false, price: 0, currency: "MNT", forWhom: "", included: [], howTo: [], requirements: "", format: "", sortOrder: 100, previewImages: [], file: null }}
        />
      </Body>
    </>
  );
}
