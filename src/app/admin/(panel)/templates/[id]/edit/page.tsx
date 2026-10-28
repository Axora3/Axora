import { notFound } from "next/navigation";
import { TemplateEditor } from "@/components/admin/TemplateEditor";
import { Body, LoadFailed, PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { TEMPLATE_CATEGORIES, type TemplateCategory } from "@/lib/templates/types";

export const metadata = { title: "Загвар засах" };

export default async function EditTemplate({ params }: PageProps<"/admin/templates/[id]/edit">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { db } = c.ctx;
  const [{ data: t, error }, { data: file }] = await Promise.all([
    db.from("templates").select("*").eq("id", id).maybeSingle(),
    db.from("template_files").select("storage_path, external_url, label").eq("template_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (error) return <Body><LoadFailed what="загварыг" /></Body>;
  if (!t) notFound();
  const style = { tint: "#EEF1E6", accent: "#245C45", soft: "#CFE0D3", p1: t.title, c1: "", c2: "", c3: "", ...(t.preview_style ?? {}) };

  return (
    <>
      <PageHeader crumbs={[{ href: "/admin/templates", label: "Загварууд" }]} title={t.title} description={`/templates/${t.slug}`} />
      <Body>
        <TemplateEditor
          id={t.id}
          updatedAt={t.updated_at}
          status={t.status}
          folder={t.id}
          previewStyle={style}
          initial={{
            title: t.title,
            slug: t.slug,
            category: (TEMPLATE_CATEGORIES as readonly string[]).includes(t.category) ? (t.category as TemplateCategory) : "Notion",
            shortDescription: t.short_description ?? "",
            longDescription: t.long_description ?? "",
            isFree: t.is_free,
            price: Number(t.price) || 0,
            currency: t.currency ?? "MNT",
            forWhom: t.for_whom ?? "",
            included: t.included ?? [],
            howTo: t.how_to ?? [],
            requirements: t.requirements ?? "",
            format: t.format ?? "",
            sortOrder: t.sort_order ?? 100,
            previewImages: (t.preview_images ?? []).map((p: { path: string; alt?: string }) => ({ path: p.path, alt: p.alt ?? "" })),
            file: file ? { storagePath: file.storage_path, externalUrl: file.external_url, label: file.label ?? "" } : null,
          }}
        />
      </Body>
    </>
  );
}
