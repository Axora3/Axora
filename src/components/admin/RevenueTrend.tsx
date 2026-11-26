"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/templates/types";
import { TimeSeriesPlot } from "./TimeSeriesPlot";

export type RevenueBucket = { label: string; totals: Record<string, number> };
/** Currencies stay separate; totals come only from confirmed payment records. */
export function RevenueTrend({
  rows,
  currencies,
}: {
  rows: RevenueBucket[];
  currencies: string[];
}) {
  const [picked, setCurrency] = useState(currencies[0] ?? "MNT");
  const currency = currencies.includes(picked)
    ? picked
    : (currencies[0] ?? "MNT");
  const total = rows.reduce((sum, row) => sum + (row.totals[currency] ?? 0), 0);
  return (
    <div className="ax-admin-chart-content">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-2xl font-medium tabular-nums">
          {formatPrice({ isFree: false, price: total, currency })}
        </span>
        <label className="flex items-center gap-2 text-xs text-muted">
          Валют
          <select
            aria-label="Орлогын валют"
            className="ax-control min-h-9 w-24 px-3"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {(currencies.length ? currencies : ["MNT"]).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-muted">
        Гараар баталгаажсан төлбөр · банкны хуулга биш
      </p>
      <TimeSeriesPlot
        title="Баталгаажсан орлогын хандлага"
        currency={currency}
        rows={rows.map((row) => ({
          label: row.label,
          values: [row.totals[currency] ?? 0],
        }))}
        series={[
          { label: "Баталгаажсан орлого", color: "var(--admin-chart-primary)" },
        ]}
      />
      <div
        aria-hidden="true"
        className="ax-admin-chart-labels ax-admin-chart-labels-line"
      >
        {rows.map((row) => (
          <span
            key={row.label}
            title={row.label}
            className="min-w-0 flex-1 truncate text-center text-faint"
          >
            {row.label}
          </span>
        ))}
      </div>
      <details className="text-xs text-muted">
        <summary className="min-h-9 cursor-pointer py-2">
          Графикийн өгөгдөл
        </summary>
        <div className="relative overflow-x-auto">
          <table className="ax-table">
            <caption className="sr-only">
              Баталгаажсан орлого · {currency}
            </caption>
            <thead>
              <tr>
                <th scope="col">Хугацаа</th>
                <th scope="col">Орлого</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="text-left font-normal">
                    {row.label}
                  </th>
                  <td>
                    {formatPrice({
                      isFree: false,
                      price: row.totals[currency] ?? 0,
                      currency,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
