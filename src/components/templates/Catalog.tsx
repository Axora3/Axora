"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Close, Search, SearchEmpty } from "@/components/icons";
import { TEMPLATE_CATEGORIES, type Template } from "@/lib/templates/types";
import { TemplateCard } from "./TemplateCard";

type Cat = "all" | (typeof TEMPLATE_CATEGORIES)[number];
type Price = "all" | "free" | "paid";
type Sort = "rec" | "asc" | "desc";

const CATS: [Cat, string][] = [["all", "Бүгд"], ...TEMPLATE_CATEGORIES.map((c) => [c, c] as [Cat, string])];
const PRICES: [Price, string][] = [
  ["all", "Бүх үнэ"],
  ["free", "Үнэгүй"],
  ["paid", "Төлбөртэй"],
];

function pick<T extends string>(v: string | null, allowed: readonly T[], fallback: T): T {
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

/**
 * Search / filter / sort over the published list. Filters live in the URL
 * (no personal data), so back/forward and shared links keep them.
 */
export function Catalog({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const cat = pick<Cat>(sp.get("cat"), ["all", ...TEMPLATE_CATEGORIES], "all");
  const price = pick<Price>(sp.get("price"), ["all", "free", "paid"], "all");
  const sort = pick<Sort>(sp.get("sort"), ["rec", "asc", "desc"], "rec");

  function setParam(next: Record<string, string>) {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "all" || v === "rec") p.delete(k);
      else p.set(k, v);
    }
    const s = p.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  // Keep the search box responsive; write it to the URL after a short pause.
  useEffect(() => {
    const id = setTimeout(() => {
      if ((sp.get("q") ?? "") !== q.trim()) setParam({ q: q.trim() });
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [q]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = templates.filter((t) => {
      if (cat !== "all" && t.category !== cat) return false;
      if (price === "free" && !t.isFree) return false;
      if (price === "paid" && t.isFree) return false;
      if (needle && !`${t.title} ${t.shortDescription} ${t.longDescription} ${t.category}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    if (sort === "asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [templates, q, cat, price, sort]);

  const hasFilters = !!q.trim() || cat !== "all" || price !== "all" || sort !== "rec";
  const clearAll = () => {
    setQ("");
    router.replace(pathname, { scroll: false });
  };

  return (
    <>
      <div className="ax-in-sm mt-8 flex flex-col gap-3.5 rounded-[18px] border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex flex-[999_1_320px] items-center">
            <label htmlFor="tp-search" className="sr-only">
              Нэр, тайлбараар хайх
            </label>
            <Search className="pointer-events-none absolute left-3.5 text-muted" />
            <input
              id="tp-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Хайх: төсөв, контент, кофе…"
              className="min-h-12 w-full rounded-[11px] border border-line-strong bg-sunken py-0 pr-3.5 pl-[42px] text-base text-ink"
            />
          </div>
          <div className="flex flex-[1_1_220px] items-center gap-2.5">
            <label htmlFor="tp-sort" className="text-sm font-bold whitespace-nowrap text-muted">
              Эрэмбэ
            </label>
            <select
              id="tp-sort"
              value={sort}
              onChange={(e) => setParam({ sort: e.target.value })}
              className="min-h-12 flex-1 rounded-[11px] border border-line-strong bg-surface px-3 text-base text-ink"
            >
              <option value="rec">Санал болгосон</option>
              <option value="asc">Үнэ: багаас их</option>
              <option value="desc">Үнэ: ихээс бага</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Ангилал" className="ax-scroll max-w-full gap-1.5 rounded-xl bg-soft-2 p-1">
            {CATS.map(([v, label]) => {
              const on = cat === v;
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setParam({ cat: v })}
                  className="ax-btn min-h-11 shrink-0 rounded-[9px] border-0 px-4 text-[15px] font-bold"
                  style={{ background: on ? "var(--ax-elevated)" : "transparent", color: on ? "var(--ax-ink)" : "var(--ax-muted)", boxShadow: on ? "0 1px 2px var(--ax-shadow), 0 0 0 1px var(--ax-line)" : "none" }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div role="group" aria-label="Үнэ" className="flex flex-wrap gap-1.5">
            {PRICES.map(([v, label]) => {
              const on = price === v;
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setParam({ price: v })}
                  className="ax-btn ax-opt min-h-11 rounded-[10px] px-3.5 text-sm font-bold text-ink"
                  style={{ border: on ? "2px solid var(--ax-brand)" : "1px solid var(--ax-line-strong)", background: on ? "var(--ax-soft)" : "var(--ax-surface)" }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-[15px] font-bold">
          {items.length} загвар олдлоо
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="ax-btn ax-ghost inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3.5 text-sm font-bold text-ink"
          >
            <Close size={14} strokeWidth={2.4} />
            Шүүлтүүр цэвэрлэх
          </button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="mt-5 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr))]">
          {items.map((t, i) => (
            <TemplateCard key={t.id} t={t} className="ax-in-sm" style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }} />
          ))}
        </div>
      ) : (
        <div className="ax-in-sm mt-5 flex flex-col items-center gap-3.5 rounded-[18px] border border-dashed border-line-mid bg-surface px-6 py-[clamp(32px,6vw,72px)] text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-soft text-brand">
            <SearchEmpty size={24} />
          </span>
          <h2 className="text-[22px] font-extrabold">Тохирох загвар олдсонгүй</h2>
          <p className="max-w-[26em] text-base leading-relaxed text-muted">Өөр түлхүүр үгээр хайх эсвэл шүүлтүүрээ цэвэрлээд дахин үзээрэй.</p>
          {hasFilters && (
            <button type="button" onClick={clearAll} className="ax-btn ax-primary min-h-12 rounded-xl border-0 bg-primary px-5 text-[15px] font-bold text-on-primary">
              Шүүлтүүр цэвэрлэх
            </button>
          )}
        </div>
      )}
    </>
  );
}
