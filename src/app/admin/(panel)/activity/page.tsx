import { Suspense } from "react";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import Link from "next/link";
import { Body, EmptyState, LoadFailed, PageHeader, Pagination, Panel, btn, field } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { AUDIT_ACTION, AUDIT_ENTITY, fmtDateTime, statusLabel } from "@/lib/admin/labels";
import { hrefWith, one, page as pageOf, safeSearch } from "@/lib/admin/query";
import { dateBounds } from "@/lib/admin/dates";

export const metadata = { title: "Үйлдлийн түүх" };
const SIZE = 30;

function entityHref(type: string, id: string | null): string | null {
  if (!id) return null;
  if (type === "order") return `/admin/orders/${id}`;
  if (type === "template_request") return `/admin/template-requests/${id}`;
  if (type === "website_project") return `/admin/projects/${id}`;
  if (type === "contact_message") return `/admin/support/${id}`;
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
  const search = safeSearch(one(sp, "q"));
  const action = Object.hasOwn(AUDIT_ACTION, one(sp, "action")) ? one(sp, "action") : "";
  const dates = dateBounds(one(sp, "from"), one(sp, "to"));
  let q = c.ctx.db.from("admin_audit_log").select("id, actor_id, action, entity_type, entity_id, details, created_at", { count: "exact" });
  if (entity) q = q.eq("entity_type", entity);
  if (action) q = q.eq("action", action);
  if (dates.from) q = q.gte("created_at", dates.from);
  if (dates.to) q = q.lt("created_at", dates.to);
  if (search) q = q.or(`entity_id.ilike.*${search}*,details->>reference.ilike.*${search}*,details->>title.ilike.*${search}*`);
  const { data, count, error } = await q.order("created_at", { ascending: false }).range((page - 1) * SIZE, page * SIZE - 1);
  const me = c.ctx.user.id;

  return (
    <>
      <PageHeader title="Үйлдлийн түүх" description="Админы үйлдлүүдийг өгөгдлийн сан автоматаар бүртгэнэ. Засах, устгах боломжгүй." />
      <Body>
        <form method="get" className="flex flex-wrap items-end gap-3" aria-label="Шүүлтүүр">
          <label className="flex min-w-0 flex-col gap-1.5"><span className={field.label}>Хайх</span><input type="search" name="q" defaultValue={one(sp, "q")} placeholder="Дугаар, лавлагаа, гарчиг…" className={field.input} /></label>
          <label className="flex min-w-0 flex-col gap-1.5"><span className={field.label}>Үйлдэл</span><select name="action" defaultValue={action} className={field.input}><option value="">Бүх үйлдэл</option>{Object.entries(AUDIT_ACTION).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className={field.label}>Эхлэх өдөр</span><input name="from" type="date" defaultValue={one(sp, "from")} className={field.input} /></label>
          <label className="flex flex-col gap-1.5"><span className={field.label}>Дуусах өдөр</span><input name="to" type="date" defaultValue={one(sp, "to")} className={field.input} /></label>
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
          <Link href="/admin/activity" className={btn.ghost}>Цэвэрлэх</Link>
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
                  const d = (a.details ?? {}) as { from?: string; to?: string; title?: string; reference?: string };
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
                      <details className="w-full rounded-xl bg-sunken px-3">
                        <summary className="min-h-11 cursor-pointer py-3 font-bold">Үйлдлийн дэлгэрэнгүй</summary>
                        <dl className="grid gap-2 pb-3 text-xs [overflow-wrap:anywhere]">
                          <div><dt className="text-muted">Бүртгэлийн дугаар</dt><dd>{a.id}</dd></div>
                          <div><dt className="text-muted">Холбогдох бичлэг</dt><dd>{a.entity_id ?? "—"}</dd></div>
                          <div><dt className="text-muted">Админ</dt><dd>{a.actor_id ?? "Систем"}</dd></div>
                          {Object.entries(a.details ?? {}).filter(([key, value]) => ["from", "to", "status", "progress", "progress_from", "progress_to", "amount", "currency", "source", "method", "hours", "due_on", "completed", "agreed_deadline", "next_contact_on"].includes(key) && ["string", "number", "boolean"].includes(typeof value)).map(([key, value]) => <div key={key}><dt className="text-muted">{key}</dt><dd>{String(value)}</dd></div>)}
                        </dl>
                      </details>
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
