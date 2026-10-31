import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Period } from "@/lib/admin/period";
import { fmtDate, fmtDateTime } from "@/lib/admin/labels";
import { LoadFailed, Panel } from "./ui";

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
  const max = Math.max(1, ...counts.flatMap((row) => [row.orders, row.requests]));
  return <div className="grid min-w-0 gap-5 xl:grid-cols-2">
    <Panel title={`Ирсэн хүсэлтүүд · ${period.label}`}>
      {counts.some((row) => row.failed) ? <LoadFailed what="хугацааны графикийг" /> : <div className="space-y-4 p-[18px]">
        <p className="text-xs text-muted">Веб захиалга / Template хүсэлт · Улаанбаатарын цагаар</p>
        {counts.map((row) => <div key={row.from} className="space-y-1.5">
          <p className="text-xs font-bold text-muted">{fmtDate(row.from)}{size > 1 ? ` – ${fmtDate(new Date(Date.parse(row.to) - 1).toISOString())}` : ""}</p>
          {[["Веб захиалга", row.orders, "bg-primary"], ["Template хүсэлт", row.requests, "bg-brand"]].map(([label, count, color]) => <div key={label} className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0">{label}</span><span className="h-2 flex-1 overflow-hidden rounded bg-soft" aria-hidden="true"><span className={`block h-full rounded ${color}`} style={{ width: `${Number(count) / max * 100}%` }} /></span><strong className="w-9 text-right tabular-nums">{count}</strong>
          </div>)}
        </div>)}
      </div>}
    </Panel>
    <Panel title="Сүүлийн мэдэгдэл" action={<Link href="/admin/notifications" className="inline-flex min-h-11 items-center text-sm font-bold">Бүгд →</Link>}>
      {notifications.error ? <LoadFailed what="сүүлийн мэдэгдлийг" /> : !notifications.data?.length ? <p className="p-[18px] text-sm text-muted">Одоогоор мэдэгдэл алга.</p> : <ul className="divide-y divide-soft">{notifications.data.map((item) => <li key={item.id}><Link href={`/admin/notifications/${item.id}`} className="flex flex-col gap-1 p-[18px] text-sm text-ink no-underline hover:bg-sunken"><strong>{item.title}</strong><span className="text-xs text-muted">{fmtDateTime(item.created_at)} · {item.read_at ? "Уншсан" : "Уншаагүй"}</span></Link></li>)}</ul>}
    </Panel>
  </div>;
}
