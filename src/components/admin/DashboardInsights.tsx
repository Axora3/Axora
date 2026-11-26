import { TimeSeriesPlot } from "./TimeSeriesPlot";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serverNow, ubMonths, type Period } from "@/lib/admin/period";
import { fmtDate, fmtDateTime } from "@/lib/admin/labels";
import { LoadFailed, Panel } from "./ui";

export type ChartRow = { label: string; orders: number; requests: number };

const SERIES = [
  { key: "orders", label: "Веб захиалга", color: "var(--admin-chart-primary)" },
  {
    key: "requests",
    label: "Template хүсэлт",
    color: "var(--admin-chart-secondary)",
  },
] as const;

/** Exact time buckets: the overview uses a large line plot; monthly totals use bars.
 * No interpolated or comparison values are invented. The table retains every value. */
export function RequestsChart({
  rows,
  title,
  compact = false,
}: {
  rows: ChartRow[];
  title: string;
  compact?: boolean;
}) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.orders, row.requests]));
  const empty = rows.every((row) => !row.orders && !row.requests);

  return (
    <Panel
      title={title}
      className={compact ? "ax-admin-trend-panel" : "ax-admin-overview-chart"}
    >
      <div className="ax-admin-chart-content">
        <ul className="ax-admin-chart-legend">
          {SERIES.map((s) => (
            <li key={s.key} className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              <span>{s.label}</span>
              <strong>
                {rows.reduce((total, row) => total + row[s.key], 0)}
              </strong>
            </li>
          ))}
        </ul>
        {!compact ? (
          <TimeSeriesPlot
            title={title}
            rows={rows.map((row) => ({
              label: row.label,
              values: [row.orders, row.requests],
            }))}
            series={SERIES.map((s) => ({ label: s.label, color: s.color }))}
          />
        ) : (
          <div
            aria-hidden="true"
            className="ax-admin-chart relative flex h-[160px] items-end gap-4 border-b border-line-mid"
          >
            {empty && (
              <p className="absolute inset-0 grid place-items-center text-sm text-muted">
                Энэ хугацаанд ирсэн зүйл алга.
              </p>
            )}
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex h-full min-w-0 flex-1 items-end justify-center gap-[3px]"
              >
                {SERIES.map((s) => (
                  <span
                    key={s.key}
                    title={`${row.label} · ${s.label}: ${row[s.key]}`}
                    className="ax-bar max-w-[28px] flex-1"
                    style={{
                      height: `${(row[s.key] / max) * 100}%`,
                      background: s.color,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
        <div
          aria-hidden="true"
          className={`ax-admin-chart-labels ${compact ? "" : "ax-admin-chart-labels-line"}`}
        >
          {rows.map((row) => (
            <span
              key={row.label}
              className="min-w-0 flex-1 truncate text-center text-[11px] font-semibold text-muted"
            >
              {row.label}
            </span>
          ))}
        </div>
        <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Хугацаа</th>
              {SERIES.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.orders}</td>
                <td>{row.requests}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </Panel>
  );
}

/** Six months of exact counts. A failed count shows an error instead of a misleading zero. */
export async function MonthlyTrends({ db }: { db: SupabaseClient }) {
  const title = "Сарын хандлага · сүүлийн 6 сар";
  const counts = await Promise.all(
    ubMonths(6, serverNow()).map(async (month) => {
      const [orders, requests] = await Promise.all(
        ["website_orders", "template_requests"].map((table) =>
          db
            .from(table)
            .select("id", { count: "exact", head: true })
            .gte("created_at", month.from)
            .lt("created_at", month.to),
        ),
      );
      return {
        label: month.label,
        orders: orders.count ?? 0,
        requests: requests.count ?? 0,
        failed: orders.count === null || requests.count === null,
      };
    }),
  );
  if (counts.some((row) => row.failed))
    return (
      <Panel title={title}>
        <LoadFailed what="сарын хандлагыг" />
      </Panel>
    );
  return <RequestsChart rows={counts} title={title} compact />;
}

/** Exact database counts in at most seven disjoint time buckets; no row-limit truncation. */
export async function DashboardInsights({
  db,
  period,
  adminId,
}: {
  db: SupabaseClient;
  period: Period;
  adminId: string;
}) {
  const from = Date.parse(period.from);
  const days = Math.round((Date.parse(period.to) - from) / 86400000);
  const size = Math.max(1, Math.ceil(days / 7));
  const buckets = Array.from({ length: Math.ceil(days / size) }, (_, i) => ({
    from: new Date(from + i * size * 86400000).toISOString(),
    to: new Date(
      from + Math.min(days, (i + 1) * size) * 86400000,
    ).toISOString(),
  }));
  const [counts, notifications] = await Promise.all([
    Promise.all(
      buckets.map(async (bucket) => {
        const [orders, requests] = await Promise.all(
          ["website_orders", "template_requests"].map((table) =>
            db
              .from(table)
              .select("id", { count: "exact", head: true })
              .gte("created_at", bucket.from)
              .lt("created_at", bucket.to),
          ),
        );
        return {
          ...bucket,
          orders: orders.count ?? 0,
          requests: requests.count ?? 0,
          failed:
            !!orders.error ||
            !!requests.error ||
            orders.count === null ||
            requests.count === null,
        };
      }),
    ),
    db
      .from("admin_notifications")
      .select("id,title,created_at,read_at")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const title = `Ирсэн хүсэлтүүд · ${period.label}`;
  const rows: ChartRow[] = counts.map((row) => ({
    label: `${fmtDate(row.from)}${size > 1 ? ` – ${fmtDate(new Date(Date.parse(row.to) - 1).toISOString())}` : ""}`,
    orders: row.orders,
    requests: row.requests,
  }));
  return (
    <>
      {counts.some((row) => row.failed) ? (
        <Panel title={title}>
          <LoadFailed what="хугацааны графикийг" />
        </Panel>
      ) : (
        <RequestsChart rows={rows} title={title} />
      )}
      <Panel
        title="Сүүлийн мэдэгдэл"
        action={
          <Link
            href="/admin/notifications"
            className="inline-flex min-h-11 items-center text-sm font-bold"
          >
            Бүгд <Icon name="arrow-right" size={16} />
          </Link>
        }
      >
        {notifications.error ? (
          <LoadFailed what="сүүлийн мэдэгдлийг" />
        ) : !notifications.data?.length ? (
          <p className="p-5 text-sm text-muted">Одоогоор мэдэгдэл алга.</p>
        ) : (
          <ul className="m-0 list-none divide-y divide-line-soft p-0">
            {notifications.data.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/notifications/${item.id}`}
                  className="flex items-start gap-3 px-5 py-3.5 text-sm text-ink no-underline hover:bg-sunken"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read_at ? "bg-line-strong" : "bg-primary"}`}
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <strong className="truncate">{item.title}</strong>
                    <span className="text-xs text-muted">
                      {fmtDateTime(item.created_at)} ·{" "}
                      {item.read_at ? "Уншсан" : "Уншаагүй"}
                    </span>
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
