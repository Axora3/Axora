import Link from "next/link";
import { Body, EmptyState, LoadFailed, PageHeader, Pagination, Panel, PubPill, btn, field } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { fmtDateTime } from "@/lib/admin/labels";
import { PAGE_SIZE, hrefWith, one, page as pageOf, safeSearch } from "@/lib/admin/query";
import { previewPublicUrl } from "@/lib/supabase/server";
import { TEMPLATE_CATEGORIES, formatPrice } from "@/lib/templates/types";

export const metadata = { title: "Загварууд" };

type Row = { id: string; title: string; slug: string; category: string; price: number; currency: string; is_free: boolean; status: string; updated_at: string; preview_images: { path: string }[] | null; preview_style: { tint?: string } | null };

export default async function AdminTemplates({ searchParams }: PageProps<"/admin/templates">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const sp = await searchParams;
  const q = safeSearch(one(sp, "q"));
  const cat = (TEMPLATE_CATEGORIES as readonly string[]).includes(one(sp, "category")) ? one(sp, "category") : "";
  const status = ["draft", "published"].includes(one(sp, "status")) ? one(sp, "status") : "";
  const page = pageOf(sp);

  let query = c.ctx.db.from("templates").select("id, title, slug, category, price, currency, is_free, status, updated_at, preview_images, preview_style", { count: "exact" });
  if (q) query = query.ilike("title", `%${q}%`);
  if (cat) query = query.eq("category", cat);
  if (status) query = query.eq("status", status);
  const { data, count, error } = await query.order("updated_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as Row[];
  const total = count ?? 0;
  const filtered = !!(q || cat || status);

  return (
    <>
      <PageHeader
        title="Загварууд"
        description="Notion, Canva, Excel бүтээгдэхүүн. Ноорог сайтад харагдахгүй."
        actions={
          <Link href="/admin/templates/new" className={btn.primary}>
            + Загвар нэмэх
          </Link>
        }
      />
      <Body>
        <form method="get" className="flex flex-wrap items-end gap-3 rounded-[18px] border border-line bg-surface p-4" aria-label="Шүүлтүүр">
          <label className="flex flex-[999_1_240px] flex-col gap-1.5">
            <span className={field.label}>Нэрээр хайх</span>
            <input name="q" type="search" defaultValue={one(sp, "q")} className={field.input} />
          </label>
          <label className="flex flex-[1_1_150px] flex-col gap-1.5">
            <span className={field.label}>Ангилал</span>
            <select name="category" defaultValue={cat} className={field.input}>
              <option value="">Бүгд</option>
              {TEMPLATE_CATEGORIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-[1_1_150px] flex-col gap-1.5">
            <span className={field.label}>Төлөв</span>
            <select name="status" defaultValue={status} className={field.input}>
              <option value="">Бүгд</option>
              <option value="published">Нийтлэгдсэн</option>
              <option value="draft">Ноорог</option>
            </select>
          </label>
          <button type="submit" className={btn.primary}>
            Шүүх
          </button>
          {filtered && (
            <Link href="/admin/templates" className={btn.ghost}>
              Цэвэрлэх
            </Link>
          )}
        </form>

        <Panel>
          {error ? (
            <LoadFailed what="загваруудыг" />
          ) : !rows.length ? (
            filtered ? (
              <EmptyState title="Тохирох загвар олдсонгүй" action={<Link href="/admin/templates" className={btn.ghost}>Шүүлтүүр цэвэрлэх</Link>} />
            ) : (
              <EmptyState title="Одоогоор загвар алга." text="Эхний загвараа нэмэх." action={<Link href="/admin/templates/new" className={btn.primary}>+ Загвар нэмэх</Link>} />
            )
          ) : (
            <>
              <ul className="m-0 list-none p-0">
                {rows.map((t) => {
                  const img = t.preview_images?.[0]?.path;
                  return (
                    <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-soft px-[18px] py-3 first:border-t-0">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                        <img src={previewPublicUrl(img)} alt="" className="h-12 w-[72px] shrink-0 rounded-lg border border-line object-cover" />
                      ) : (
                        <span aria-hidden="true" className="h-12 w-[72px] shrink-0 rounded-lg border border-line" style={{ background: t.preview_style?.tint ?? "#EEF1E6" }} />
                      )}
                      <span className="flex min-w-0 flex-[1_1_220px] flex-col">
                        <strong className="text-[15px]">{t.title}</strong>
                        <span className="text-[13px] text-muted">
                          {t.category} · {formatPrice({ isFree: t.is_free, price: Number(t.price), currency: t.currency })}
                        </span>
                      </span>
                      <PubPill published={t.status === "published"} />
                      <span className="text-[13px] text-muted">Шинэчилсэн {fmtDateTime(t.updated_at)}</span>
                      <Link href={`/admin/templates/${t.id}/edit`} className={`${btn.ghost} ml-auto`} aria-label={`${t.title} — засах`}>
                        Засах
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Pagination page={page} pages={Math.max(1, Math.ceil(total / PAGE_SIZE))} total={total} makeHref={(p) => hrefWith("/admin/templates", sp, { page: p })} />
            </>
          )}
        </Panel>
      </Body>
    </>
  );
}
