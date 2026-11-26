"use client";

import { useId, useState } from "react";

type Point = { label: string; values: number[] };
type Series = { label: string; color: string };
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const axisNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Each real time bucket is keyboard/touch accessible; no interpolated values. */
export function TimeSeriesPlot({
  rows,
  series,
  title,
  currency,
}: {
  rows: Point[];
  series: Series[];
  title: string;
  currency?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const id = useId();
  const max = Math.max(1, ...rows.flatMap((row) => row.values));
  const ceiling = Math.max(4, Math.ceil(max / 4) * 4);
  const x = (i: number) => 48 + (i / Math.max(1, rows.length - 1)) * 824;
  const y = (value: number) => 256 - (value / ceiling) * 224;
  const value = (n: number) =>
    `${number.format(n)}${currency ? ` ${currency}` : ""}`;
  const empty = rows.every((row) => row.values.every((n) => n === 0));
  return (
    <div className="ax-admin-line-chart" onMouseLeave={() => setActive(null)}>
      <div aria-hidden="true" className="ax-admin-chart-axis">
        {[4, 3, 2, 1, 0].map((tick) => (
          <span key={tick}>{axisNumber.format((tick * ceiling) / 4)}</span>
        ))}
      </div>
      <svg viewBox="0 0 900 288" aria-hidden="true" preserveAspectRatio="none">
        {[0, 1, 2, 3, 4].map((tick) => (
          <line
            key={tick}
            x1="48"
            x2="872"
            y1={y((tick * ceiling) / 4)}
            y2={y((tick * ceiling) / 4)}
            stroke="var(--ax-line-soft)"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {active !== null && (
          <line
            x1={x(active)}
            x2={x(active)}
            y1="32"
            y2="256"
            stroke="var(--ax-line-strong)"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {series.map((s, index) => {
          const points = rows
            .map((row, i) => `${x(i)},${y(row.values[index])}`)
            .join(" ");
          return (
            <g key={s.label}>
              {rows.length > 1 && (
                <polygon
                  points={`${x(0)},256 ${points} ${x(rows.length - 1)},256`}
                  fill={s.color}
                  opacity={index === 0 ? 0.08 : 0.025}
                />
              )}
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth={index === 0 ? 2.5 : 2}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {rows.map((row, i) => (
                <circle
                  key={row.label}
                  cx={x(i)}
                  cy={y(row.values[index])}
                  r={active === i ? 5 : 3}
                  fill="var(--ax-surface)"
                  stroke={s.color}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="ax-admin-chart-targets" role="group" aria-label={title}>
        {rows.map((row, i) => (
          <button
            key={row.label}
            type="button"
            aria-label={`${row.label}: ${series.map((s, j) => `${s.label} ${value(row.values[j])}`).join(", ")}`}
            aria-describedby={active === i ? id : undefined}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setActive(null);
            }}
          />
        ))}
      </div>
      {active !== null && (
        <div id={id} role="tooltip" className="ax-admin-chart-tooltip">
          <span className="text-xs text-muted">{rows[active].label}</span>
          {series.map((s, j) => (
            <span
              key={s.label}
              className="flex items-center justify-between gap-6 text-xs"
            >
              <span>{s.label}</span>
              <strong style={{ color: s.color }}>
                {value(rows[active].values[j])}
              </strong>
            </span>
          ))}
        </div>
      )}
      {empty && (
        <p className="ax-admin-chart-empty">Энэ хугацаанд ирсэн зүйл алга.</p>
      )}
    </div>
  );
}
