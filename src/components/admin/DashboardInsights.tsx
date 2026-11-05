import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Period } from "@/lib/admin/period";
import { fmtDate, fmtDateTime } from "@/lib/admin/labels";
import { LoadFailed, Panel } from "./ui";

export type ChartRow = { label: string; orders: number; requests: number };

const SERIES = [
  { key: "orders", label: "Веб захиалга", color: "var(--ax-primary)" },
  { key: "requests", label: "Template хүсэлт", color: "var(--ax-done-bar)" },
] as const;

/** Grouped bars in CSS. The hidden table carries the same numbers for screen readers. */
export function RequestsChart({ rows, title }: { rows: ChartRow[]; title: string }) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.orders, row.requests]));
  const empty = rows.every((row) => !row.orders && !row.requests);
  return (
    <Panel title={title}>
      <div className="flex flex-col gap-4 p-5">
        <ul className="m-0 flex list-none flex-wrap gap-4 p-0 text-[13px] font-semibold text-muted">
          {SERIES.map((s) => (
            <li key={s.key} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
        <div aria-hidden="true" className="relative flex h-[200px] items-end gap-[clamp(6px,1.4vw,16px)] border-b border-line-mid">
          {empty && <p className="absolute inset-0 grid place-items-center text-sm text-muted">Энэ хугацаанд ирсэн зүйл алга.</p>}
          {rows.map((row) => (
            <div key={row.label} className="flex h-full min-w-0 flex-1 items-end justify-center gap-[3px]">
              {SERIES.map((s) => (
                <span key={s.key} title={`${row.label} · ${s.label}: ${row[s.key]}`} className="ax-bar max-w-[28px] flex-1" style={{ height: `${(row[s.key] / max) * 100}%`, background: s.color }} />
              ))}
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="-mt-2 flex gap-[clamp(6px,1.4vw,16px)]">
          {rows.map((row) => <span key={row.label} className="min-w-0 flex-1 truncate text-center text-[11px] font-semibold text-muted">{row.label}</span>)}
        </div>
        <table className="sr-only">
          <caption>{title}</caption>
          <thead><tr><th scope="col">Хугацаа</th>{SERIES.map((s) => <th key={s.key} scope="col">{s.label}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.orders}</td><td>{row.requests}</td></tr>)}</tbody>
        </table>
      </div>
    </Panel>
  );
}

/** Exact database counts in at most seven disjoint time buckets; no row-limit truncation. */
export async function DashboardInsights({ db, period, adminId }: { db: SupabaseClient; period: Period; adminId: string }) {
  const from = Date.parse(period.from);
  const days = Math.round((Date.parse(period.to) - from) / 86400000);
  const size = Math.max(1, Math.ceil(days / 7));
  const buckets = Array.from({ length: Math.ceil(days / size) }, (_, i) => ({
    from: new Date(from + i * size * 86400000).toISOString(),
    to: new Date(from + Math.min(days, (i + 1) * size) * 86400000).toISOString(),
  }));
  const [counts, notifications] = await Promise.all([
    Promise.all(buckets.map(async (bucket) => {
      const [orders, requests] = await Promise.all(["website_orders", "template_requests"].map((table) => db.from(table).select("id", { count: "exact", head: true }).gte("created_at", bucket.from).lt("created_at", bucket.to)));
      return { ...bucket, orders: orders.count ?? 0, requests: requests.count ?? 0, failed: !!orders.error || !!requests.error || orders.count === null || requests.count === null };
    })),
    db.from("admin_notifications").select("id,title,created_at,read_at").eq("admin_id", adminId).order("created_at", { ascending: false }).limit(5),
  ]);
  const title = `Ирсэн хүсэлтүүд · ${period.label}`;
  const rows: ChartRow[] = counts.map((row) => ({ label: `${fmtDate(row.from)}${size > 1 ? ` – ${fmtDate(new Date(Date.parse(row.to) - 1).toISOString())}` : ""}`, orders: row.orders, requests: row.requests }));
  return (
    <>
      {counts.some((row) => row.failed) ? <Panel title={title}><LoadFailed what="хугацааны графикийг" /></Panel> : <RequestsChart rows={rows} title={title} />}
      <Panel title="Сүүлийн мэдэгдэл" action={<Link href="/admin/notifications" className="inline-flex min-h-11 items-center text-sm font-bold">Бүгд <Icon name="arrow-right" size={16} /></Link>}>
        {notifications.error ? <LoadFailed what="сүүлийн мэдэгдлийг" /> : !notifications.data?.length ? <p className="p-5 text-sm text-muted">Одоогоор мэдэгдэл алга.</p> : (
          <ul className="m-0 list-none divide-y divide-line-soft p-0">
            {notifications.data.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/notifications/${item.id}`} className="flex items-start gap-3 px-5 py-3.5 text-sm text-ink no-underline hover:bg-sunken">
                  <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read_at ? "bg-line-strong" : "bg-primary"}`} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <strong className="truncate">{item.title}</strong>
                    <span className="text-xs text-muted">{fmtDateTime(item.created_at)} · {item.read_at ? "Уншсан" : "Уншаагүй"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
