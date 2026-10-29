import { Suspense } from "react";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import Link from "next/link";
import { Body, EmptyState, LoadFailed, PageHeader, Pagination, Panel, btn, field } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { AUDIT_ACTION, AUDIT_ENTITY, fmtDateTime, statusLabel } from "@/lib/admin/labels";
import { hrefWith, one, page as pageOf } from "@/lib/admin/query";

export const metadata = { title: "Үйлдлийн түүх" };
const SIZE = 30;

function entityHref(type: string, id: string | null): string | null {
  if (!id) return null;
  if (type === "order") return `/admin/orders/${id}`;
  if (type === "template_request") return `/admin/template-requests/${id}`;
  if (type === "template") return `/admin/templates/${id}/edit`;
  if (type === "site_content") return "/admin/content";
  return null;
}

async function ActivityPageContent({ searchParams }: PageProps<"/admin/activity">) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const sp = await searchParams;
  const entity = Object.keys(AUDIT_ENTITY).includes(one(sp, "entity")) ? one(sp, "entity") : "";
  const page = pageOf(sp);
  let q = c.ctx.db.from("admin_audit_log").select("id, actor_id, action, entity_type, entity_id, details, created_at", { count: "exact" });
  if (entity) q = q.eq("entity_type", entity);
  const { data, count, error } = await q.order("created_at", { ascending: false }).range((page - 1) * SIZE, page * SIZE - 1);
  const me = c.ctx.user.id;

  return (
    <>
      <PageHeader title="Үйлдлийн түүх" description="Админы үйлдлүүдийг өгөгдлийн сан автоматаар бүртгэнэ. Засах, устгах боломжгүй." />
      <Body>
        <form method="get" className="flex flex-wrap items-end gap-3" aria-label="Шүүлтүүр">
          <label className="flex flex-col gap-1.5">
            <span className={field.label}>Төрөл</span>
            <select name="entity" defaultValue={entity} className={field.input}>
              <option value="">Бүгд</option>
              {Object.entries(AUDIT_ENTITY).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={btn.primary}>
            Шүүх
          </button>
        </form>
        <Panel>
          {error ? (
            <LoadFailed what="түүхийг" />
          ) : !data?.length ? (
            <EmptyState title="Бүртгэгдсэн үйлдэл алга" text="Захиалгын төлөв, загвар, агуулга өөрчлөхөд энд автоматаар бүртгэгдэнэ." />
          ) : (
            <>
              <ul className="m-0 list-none p-0">
                {data.map((a) => {
                  const d = a.details as { from?: string; to?: string; title?: string; reference?: string };
                  const href = entityHref(a.entity_type, a.entity_id);
                  return (
                    <li key={a.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-soft px-[18px] py-3 text-sm first:border-t-0">
                      <span className="min-w-[150px] text-[13px] text-muted">{fmtDateTime(a.created_at)}</span>
                      <span className="flex-[1_1_260px]">
                        <strong>{AUDIT_ACTION[a.action] ?? a.action}</strong> · {AUDIT_ENTITY[a.entity_type] ?? a.entity_type}
                        {d.title || d.reference ? ` — ${d.title ?? d.reference}` : ""}
                        {d.from && d.to ? ` (${statusLabel(a.entity_type, d.from)} → ${statusLabel(a.entity_type, d.to)})` : ""}
                      </span>
                      <span className="text-[13px] text-muted">{!a.actor_id ? "Систем" : a.actor_id === me ? "Та" : `Админ ${a.actor_id.slice(0, 6)}`}</span>
                      {href && (
                        <Link href={href} className="inline-flex min-h-11 items-center font-bold">
                          Нээх
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Pagination page={page} pages={Math.max(1, Math.ceil((count ?? 0) / SIZE))} total={count ?? 0} makeHref={(p) => hrefWith("/admin/activity", sp, { page: p })} />
            </>
          )}
        </Panel>
      </Body>
    </>
  );
}

export default function ActivityPage(props: PageProps<"/admin/activity">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <ActivityPageContent {...props} />
    </Suspense>
  );
}
