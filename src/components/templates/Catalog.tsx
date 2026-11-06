"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Close, Search, SearchEmpty } from "@/components/icons";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { TEMPLATE_CATEGORIES, type Template } from "@/lib/templates/types";
import { useTemplateCollections } from "@/lib/templates/use-template-collections";
import { CompareTray } from "./Collections";
import { TemplateCard } from "./TemplateCard";

type Cat = "all" | (typeof TEMPLATE_CATEGORIES)[number];
type Price = "all" | "free" | "paid";
type Sort = "rec" | "asc" | "desc" | "name";

const filterHeading = "mb-1.5 hidden px-3.5 text-xs font-extrabold text-muted min-[1024px]:block";
const filterGroup = "flex shrink-0 gap-1.5 min-[1024px]:flex-col min-[1024px]:gap-0.5";

/** The catalogue is already in the browser, so filters update the URL without a server request. Next.js keeps useSearchParams in sync. */
const writeUrl = (url: string) => window.history.replaceState(null, "", url);

function pick<T extends string>(v: string | null, allowed: readonly T[], fallback: T): T {
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function Filter({ on, onClick, label, count }: { on: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className="ax-filter">
      {label}
      {count !== undefined && <span className="ax-filter-count">{count}</span>}
    </button>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <li>
      <button type="button" onClick={onRemove} aria-label={`${label} шүүлтүүрийг хасах`} className="ax-btn inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-soft px-3 text-[13px] font-bold text-ink">
        {label}
        <Close size={14} strokeWidth={2.4} />
      </button>
    </li>
  );
}

/**
 * Search / filter / sort over the published list. Filters live in the URL
 * (no personal data), so back/forward and shared links keep them.
 * Sidebar from 1024px; a single scrolling row of filters below that.
 */
export function Catalog({ templates }: { templates: Template[] }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const urlQuery = sp.get("q") ?? "";
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  const [q, setQ] = useState(urlQuery);
  // Reconcile navigation before rendering so Back/Forward cannot rewrite the URL.
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setQ(urlQuery);
  }
  const [savedOnly, setSavedOnly] = useState(false);
  const { favorites, comparison, toggleFavorite, toggleComparison } = useTemplateCollections();
  const cat = pick<Cat>(sp.get("cat"), ["all", ...TEMPLATE_CATEGORIES], "all");
  const price = pick<Price>(sp.get("price"), ["all", "free", "paid"], "all");
  const sort = pick<Sort>(sp.get("sort"), ["rec", "asc", "desc", "name"], "rec");

  function setParam(next: Record<string, string>) {
    // The live URL, not `sp`: two quick clicks must not overwrite each other.
    const p = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "all" || v === "rec") p.delete(k);
      else p.set(k, v);
    }
    const s = p.toString();
    writeUrl(s ? `${pathname}?${s}` : pathname);
  }

  // Keep the search box responsive; write it to the URL after a short pause.
  useEffect(() => {
    const id = setTimeout(() => {
      if ((sp.get("q") ?? "") === q.trim()) return;
      const params = new URLSearchParams(sp.toString());
      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");
      const query = params.toString();
      writeUrl(query ? `${pathname}?${query}` : pathname);
    }, 250);
    return () => clearTimeout(id);
  }, [q, sp, pathname]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = templates.filter((t) => {
      if (cat !== "all" && t.category !== cat) return false;
      if (price === "free" && !t.isFree) return false;
      if (price === "paid" && t.isFree) return false;
      if (needle && !`${t.title} ${t.shortDescription} ${t.longDescription} ${t.category}`.toLowerCase().includes(needle)) return false;
      if (savedOnly && !favorites.includes(t.id)) return false;
      return true;
    });
    if (sort === "asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.title.localeCompare(b.title, "mn"));
    return list;
  }, [templates, q, cat, price, sort, savedOnly, favorites]);

  const hasFilters = !!q.trim() || cat !== "all" || price !== "all" || sort !== "rec" || savedOnly;
  const clearAll = () => {
    setQ("");
    setSavedOnly(false);
    writeUrl(pathname);
  };

  // Nothing published is a different situation from "no match": filters could not help.
  if (templates.length === 0) {
    return (
      <EmptyState
        frame
        headingLevel={2}
        className="ax-in-sm mt-8"
        icon={<Icon name="layers" size={24} />}
        title="Одоогоор нийтлэгдсэн загвар алга"
        description="Загвар нийтлэгдмэгц энд харагдана. Яаралтай хэрэгтэй бол бидэнтэй холбогдоорой."
        action={<Link href="/contact" className={buttonStyles("primary")}>Холбоо барих</Link>}
      />
    );
  }

  const countOf = (c: (typeof TEMPLATE_CATEGORIES)[number]) => templates.filter((t) => t.category === c).length;
  const freeCount = templates.filter((t) => t.isFree).length;

  return (
    <div className="mt-8 grid items-start gap-x-8 gap-y-5 min-[1024px]:grid-cols-[236px_minmax(0,1fr)]">
      <aside aria-label="Шүүлтүүр" className="flex min-w-0 flex-col gap-3 min-[1024px]:sticky min-[1024px]:top-[92px] min-[1024px]:gap-6">
        <div className="relative flex items-center">
          <label htmlFor="tp-search" className="sr-only">Нэр, тайлбараар хайх</label>
          <Search className="pointer-events-none absolute left-3.5 z-[1] text-muted" />
          <Input id="tp-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Төсөв, контент, кофе…" className="min-h-12 py-0 pr-3.5 pl-[42px] text-base" />
        </div>

        <div className="ax-scroll -mx-[clamp(16px,4vw,40px)] items-start gap-3 px-[clamp(16px,4vw,40px)] pb-1 min-[1024px]:mx-0 min-[1024px]:flex-col min-[1024px]:gap-6 min-[1024px]:overflow-visible min-[1024px]:px-0 min-[1024px]:pb-0">
          <div role="group" aria-label="Ангилал" className="shrink-0 min-[1024px]:w-full">
            <p aria-hidden="true" className={filterHeading}>Ангилал</p>
            <div className={filterGroup}>
              <Filter on={cat === "all"} onClick={() => setParam({ cat: "all" })} label="Бүгд" count={templates.length} />
              {TEMPLATE_CATEGORIES.map((c) => (
                <Filter key={c} on={cat === c} onClick={() => setParam({ cat: c })} label={c} count={countOf(c)} />
              ))}
            </div>
          </div>
          <span aria-hidden="true" className="w-px shrink-0 self-stretch bg-line min-[1024px]:hidden" />
          <div role="group" aria-label="Үнэ" className="shrink-0 min-[1024px]:w-full">
            <p aria-hidden="true" className={filterHeading}>Үнэ</p>
            <div className={filterGroup}>
              <Filter on={price === "all"} onClick={() => setParam({ price: "all" })} label="Бүх үнэ" />
              <Filter on={price === "free"} onClick={() => setParam({ price: "free" })} label="Үнэгүй" count={freeCount} />
              <Filter on={price === "paid"} onClick={() => setParam({ price: "paid" })} label="Төлбөртэй" count={templates.length - freeCount} />
            </div>
          </div>
          <span aria-hidden="true" className="w-px shrink-0 self-stretch bg-line min-[1024px]:hidden" />
          <div className="shrink-0 min-[1024px]:w-full min-[1024px]:border-t min-[1024px]:border-line min-[1024px]:pt-4">
            <button type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly((v) => !v)} className="ax-filter">
              <span className="inline-flex items-center gap-2">
                <Icon name={savedOnly ? "heart-filled" : "heart"} size={16} />
                Хадгалсан
              </span>
              <span className="ax-filter-count">{favorites.length}</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-[15px] font-bold">{items.length} загвар олдлоо</p>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button variant="quiet" onClick={clearAll}>
                <Close size={14} strokeWidth={2.4} />
                Цэвэрлэх
              </Button>
            )}
            <label htmlFor="tp-sort" className="sr-only">Эрэмбэ</label>
            <NativeSelect id="tp-sort" value={sort} onChange={(e) => setParam({ sort: e.target.value })} className="w-auto bg-surface text-[15px]">
              <option value="rec">Санал болгосон</option>
              <option value="asc">Үнэ: багаас их</option>
              <option value="desc">Үнэ: ихээс бага</option>
              <option value="name">Нэрээр: А–Я</option>
            </NativeSelect>
          </div>
        </div>

        {(cat !== "all" || price !== "all" || !!q.trim()) && (
          <ul aria-label="Идэвхтэй шүүлтүүр" className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
            {cat !== "all" && <ActiveChip label={cat} onRemove={() => setParam({ cat: "all" })} />}
            {price !== "all" && <ActiveChip label={price === "free" ? "Үнэгүй" : "Төлбөртэй"} onRemove={() => setParam({ price: "all" })} />}
            {!!q.trim() && <ActiveChip label={`“${q.trim()}”`} onRemove={() => setQ("")} />}
          </ul>
        )}

        {items.length > 0 ? (
          <AnimatedGroup className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr))]">
            {items.map((t) => (
              <TemplateCard
                key={t.id}
                t={t}
                favorite={favorites.includes(t.id)}
                comparing={comparison.includes(t.id)}
                comparisonFull={comparison.length >= 3}
                onFavorite={() => toggleFavorite(t.id)}
                onCompare={() => toggleComparison(t.id)}
              />
            ))}
          </AnimatedGroup>
        ) : (
          <EmptyState
            frame
            headingLevel={2}
            className="ax-in-sm mt-4"
            icon={<SearchEmpty size={24} />}
            title={savedOnly && favorites.length === 0 ? "Хадгалсан загвар алга" : "Тохирох загвар олдсонгүй"}
            description={savedOnly && favorites.length === 0 ? "Таалагдсан загвараа зүрхэн товчоор хадгалж, эндээс дахин үзээрэй." : "Өөр түлхүүр үгээр хайх эсвэл шүүлтүүрээ цэвэрлээд дахин үзээрэй."}
            action={hasFilters ? <Button variant="primary" onClick={clearAll}>Шүүлтүүр цэвэрлэх</Button> : undefined}
          />
        )}
      </div>

      {/* The tray stays in view while browsing; the full table lives on /compare. */}
      <CompareTray templates={templates} />
    </div>
  );
}
