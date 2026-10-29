import { Suspense } from "react";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import Link from "next/link";
import { FilterSheet } from "@/components/admin/FilterSheet";
import { PublishSwitch } from "@/components/admin/ProductControls";
import { Body, EmptyState, LoadFailed, PageHeader, Pagination, Panel, btn, field } from "@/components/admin/ui";
import { Lock, Pencil, Plus, Search } from "@/components/icons";
import { requireAdminPage } from "@/lib/admin/auth";
import { fmtDate } from "@/lib/admin/labels";
import { PAGE_SIZE, hrefWith, one, page as pageOf, safeSearch } from "@/lib/admin/query";
import { previewPublicUrl } from "@/lib/supabase/server";
import { TEMPLATE_CATEGORIES, formatPrice } from "@/lib/templates/types";

export const metadata = { title: "Бүтээгдэхүүн" };

type Row = { id: string; title: string; slug: string; category: string; price: number; currency: string; is_free: boolean; status: string; updated_at: string; preview_images: { path: string }[] | null; preview_style: { tint?: string; accent?: string } | null };

async function AdminTemplatesContent({ searchParams }: PageProps<"/admin/templates">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const { db } = c.ctx;
  const sp = await searchParams;
  const q = safeSearch(one(sp, "q"));
  const cat = (TEMPLATE_CATEGORIES as readonly string[]).includes(one(sp, "category")) ? one(sp, "category") : "";
  const status = ["draft", "published"].includes(one(sp, "status")) ? one(sp, "status") : "";
  const page = pageOf(sp);

  let query = db.from("templates").select("id, title, slug, category, price, currency, is_free, status, updated_at, preview_images, preview_style", { count: "exact" });
  if (q) query = query.ilike("title", `%${q}%`);
  if (cat) query = query.eq("category", cat);
  if (status) query = query.eq("status", status);
  const head = { count: "exact" as const, head: true };
  const [{ data, count, error }, all, pub, draft] = await Promise.all([
    query.order("updated_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    db.from("templates").select("id", head),
    db.from("templates").select("id", head).eq("status", "published"),
    db.from("templates").select("id", head).eq("status", "draft"),
  ]);
  const rows = (data ?? []) as Row[];
  const { data: files } = rows.length ? await db.from("template_files").select("template_id, storage_path, external_url").in("template_id", rows.map((r) => r.id)) : { data: [] };
  const hasFile = new Set((files ?? []).filter((f) => f.storage_path || f.external_url).map((f) => f.template_id));
  const total = count ?? 0;
  const filtered = !!(q || cat || status);
  const segs = [
    { id: "", label: "Бүгд", n: all.count },
    { id: "published", label: "Нийтэлсэн", n: pub.count },
    { id: "draft", label: "Ноорог", n: draft.count },
  ];

  return (
    <>
      <PageHeader
        title="Бүтээгдэхүүн"
        description={<span className="max-md:hidden">Notion, Canva, Excel бүтээгдэхүүн. Ноорог сайтад харагдахгүй.</span>}
        actions={
          <Link href="/admin/templates/new" className={`${btn.primary} max-[1023px]:hidden`}>
            <Plus size={16} /> Бүтээгдэхүүн нэмэх
          </Link>
        }
      >
        <form method="get" role="search" className="relative flex items-center" aria-label="Бүтээгдэхүүн хайх">
          {status && <input type="hidden" name="status" value={status} />}
          {cat && <input type="hidden" name="category" value={cat} />}
          <span aria-hidden="true" className="pointer-events-none absolute left-3.5 text-muted">
            <Search size={18} />
          </span>
          <label htmlFor="tpl-q" className="sr-only">
            Бүтээгдэхүүн хайх
          </label>
          <input id="tpl-q" name="q" type="search" enterKeyHint="search" defaultValue={one(sp, "q")} placeholder="Бүтээгдэхүүн хайх…" className={`${field.input} min-h-12 rounded-[13px] bg-surface pl-11`} />
        </form>
        <nav aria-label="Төлөв" className="grid grid-cols-3 gap-1 rounded-xl bg-soft-3 p-1 md:max-w-[460px]">
          {segs.map((s) => {
            const on = status === s.id;
            return (
              <Link
                key={s.id || "all"}
                href={hrefWith("/admin/templates", sp, { status: s.id || null, page: null })}
                aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-10 items-center justify-center gap-1 rounded-[9px] text-sm font-bold no-underline ${on ? "bg-elevated text-ink shadow-[0_1px_2px_var(--ax-shadow)]" : "text-muted"}`}
              >
                {s.label} <span className="opacity-60 tabular-nums">{s.n ?? ""}</span>
              </Link>
            );
          })}
        </nav>
      </PageHeader>
      <Body className="pb-[96px] min-[1024px]:pb-[clamp(16px,3vw,32px)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p aria-live="polite" className="text-[13.5px] font-bold text-muted">
            {error ? "—" : `${total} бүтээгдэхүүн`}
            {filtered && (
              <>
                {" · "}
                <Link href="/admin/templates" className="font-bold">
                  Цэвэрлэх
                </Link>
              </>
            )}
          </p>
          <FilterSheet active={cat ? 1 : 0} title="Ангилал">
            <form method="get" className="flex flex-wrap items-end gap-2" aria-label="Ангиллаар шүүх">
              {q && <input type="hidden" name="q" value={q} />}
              {status && <input type="hidden" name="status" value={status} />}
              <label className="flex flex-[1_1_180px] flex-col gap-1.5">
                <span className={field.label}>Ангилал</span>
                <select name="category" defaultValue={cat} className={field.input}>
                  <option value="">Бүгд</option>
                  {TEMPLATE_CATEGORIES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className={`${btn.ghost} max-md:w-full`}>
                Шүүх
              </button>
            </form>
          </FilterSheet>
        </div>

        {error ? (
          <LoadFailed what="бүтээгдэхүүнийг" />
        ) : !rows.length ? (
          <Panel>
            {filtered ? (
              <EmptyState title="Тохирох бүтээгдэхүүн олдсонгүй" action={<Link href="/admin/templates" className={btn.ghost}>Шүүлтүүр цэвэрлэх</Link>} />
            ) : (
              <EmptyState title="Одоогоор бүтээгдэхүүн алга" text="Эхний бүтээгдэхүүнээ нэмээрэй." action={<Link href="/admin/templates/new" className={btn.primary}>+ Бүтээгдэхүүн нэмэх</Link>} />
            )}
          </Panel>
        ) : (
          <>
            <ul className="m-0 grid list-none gap-2.5 p-0 min-[700px]:grid-cols-2 min-[1280px]:grid-cols-3">
              {rows.map((t) => {
                const img = t.preview_images?.[0]?.path;
                const edit = `/admin/templates/${t.id}/edit`;
                const fileOk = t.is_free || hasFile.has(t.id);
                return (
                  <li key={t.id} className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-3.5">
                    <div className="flex items-center gap-3">
                      {/* Product cover keeps its own colours in both themes. */}
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail from the public bucket
                        <img src={previewPublicUrl(img)} alt="" className="ax-light h-14 w-14 shrink-0 rounded-xl border border-line object-cover" />
                      ) : (
                        <span aria-hidden="true" className="ax-light inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl" style={{ background: t.preview_style?.tint ?? "#EEF1E6" }}>
                          <span className="h-6 w-5 rounded" style={{ background: t.preview_style?.accent ?? "#245C45" }} />
                        </span>
                      )}
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <strong className="text-[15px] leading-snug">{t.title}</strong>
                        <span className="text-[12.5px] text-muted">
                          {t.category} · {formatPrice({ isFree: t.is_free, price: Number(t.price), currency: t.currency })} · {fmtDate(t.updated_at)}
                        </span>
                      </span>
                      <Link href={edit} aria-label={`${t.title} — засах`} className="ax-btn inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-surface text-ink">
                        <Pencil size={18} />
                      </Link>
                    </div>
                    <div className="flex items-center justify-between gap-2.5 border-t border-soft pt-2">
                      <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold ${fileOk ? "text-muted" : "text-danger"}`}>
                        {t.is_free ? (
                          "Үнэгүй — файл заавал биш"
                        ) : fileOk ? (
                          <>
                            <Lock size={14} /> Хамгаалагдсан файлтай
                          </>
                        ) : (
                          <>! Хамгаалагдсан файлгүй</>
                        )}
                      </span>
                      <PublishSwitch id={t.id} title={t.title} published={t.status === "published"} editHref={edit} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-[12.5px] leading-normal text-muted">Нийтэд зөвхөн “Нийтэлсэн” бүтээгдэхүүн харагдана. Хамгаалагдсан файлын зам нийтийн мэдээлэлд орохгүй.</p>
            <Panel>
              <Pagination page={page} pages={Math.max(1, Math.ceil(total / PAGE_SIZE))} total={total} makeHref={(p) => hrefWith("/admin/templates", sp, { page: p })} />
            </Panel>
          </>
        )}
      </Body>
      {/* Floating “+ Шинэ”: sits above the tab bar; the list has bottom padding so it never covers the last card. */}
      <Link
        href="/admin/templates/new"
        className="ax-btn ax-primary fixed right-4 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[35] inline-flex h-14 items-center gap-2 rounded-[18px] bg-primary pr-5 pl-4 text-base font-extrabold text-on-primary no-underline shadow-[0_18px_36px_-14px_rgba(0,0,0,.45)] min-[1024px]:hidden"
      >
        <Plus size={20} /> Шинэ
      </Link>
    </>
  );
}

export default function AdminTemplates(props: PageProps<"/admin/templates">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminTemplatesContent {...props} />
    </Suspense>
  );
}
