"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Close, Search, SearchEmpty } from "@/components/icons";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Button, buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { TEMPLATE_CATEGORIES, type Template } from "@/lib/templates/types";
import { useTemplateCollections } from "@/lib/templates/use-template-collections";
import { CompareTray } from "./Collections";
import { TemplateCard } from "./TemplateCard";

type Cat = "all" | (typeof TEMPLATE_CATEGORIES)[number];
type Price = "all" | "free" | "paid";
type Sort = "rec" | "asc" | "desc";

const CATS: { value: Cat; label: string }[] = [{ value: "all", label: "Бүгд" }, ...TEMPLATE_CATEGORIES.map((c) => ({ value: c as Cat, label: c as string }))];
const PRICES: { value: Price; label: string }[] = [
  { value: "all", label: "Бүх үнэ" },
  { value: "free", label: "Үнэгүй" },
  { value: "paid", label: "Төлбөртэй" },
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
      if ((sp.get("q") ?? "") === q.trim()) return;
      const params = new URLSearchParams(sp.toString());
      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 250);
    return () => clearTimeout(id);
  }, [q, sp, pathname, router]);

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
    return list;
  }, [templates, q, cat, price, sort, savedOnly, favorites]);

  const hasFilters = !!q.trim() || cat !== "all" || price !== "all" || sort !== "rec" || savedOnly;
  const clearAll = () => {
    setQ("");
    setSavedOnly(false);
    router.replace(pathname, { scroll: false });
  };

  // Nothing published is a different situation from "no match": filters could not help.
  if (templates.length === 0) {
    return (
      <div className="ax-empty ax-in-sm mt-8">
        <span aria-hidden="true" className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-soft text-brand">
          <Icon name="layers" size={24} />
        </span>
        <h2 className="text-[22px] font-extrabold">Одоогоор нийтлэгдсэн загвар алга</h2>
        <p className="max-w-[30em] text-base leading-relaxed text-muted">Загвар нийтлэгдмэгц энд харагдана. Яаралтай хэрэгтэй бол бидэнтэй холбогдоорой.</p>
        <Link href="/contact" className={buttonStyles("primary", "mt-1")}>
          Холбоо барих
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="ax-surface mt-8 flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex flex-[999_1_320px] items-center">
            <label htmlFor="tp-search" className="sr-only">
              Нэр, тайлбараар хайх
            </label>
            <Search className="pointer-events-none absolute left-3.5 z-[1] text-muted" />
            <input
              id="tp-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Хайх: төсөв, контент, кофе…"
              className="ax-control min-h-12 w-full py-0 pr-3.5 pl-[42px] text-base"
            />
          </div>
          <div className="flex flex-[1_1_240px] items-center gap-2.5">
            <label htmlFor="tp-sort" className="text-sm font-bold whitespace-nowrap text-muted max-[600px]:sr-only">
              Эрэмбэ
            </label>
            <select id="tp-sort" value={sort} onChange={(e) => setParam({ sort: e.target.value })} className="ax-control min-h-12 flex-1 px-3 text-base">
              <option value="rec">Санал болгосон</option>
              <option value="asc">Үнэ: багаас их</option>
              <option value="desc">Үнэ: ихээс бага</option>
            </select>
          </div>
        </div>
        <div className="ax-scroll -mx-3 items-center gap-2.5 px-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <Segmented label="Ангилал" className="shrink-0" options={CATS} value={cat} onChange={(v) => setParam({ cat: v })} />
          <Segmented label="Үнэ" className="shrink-0" options={PRICES} value={price} onChange={(v) => setParam({ price: v })} />
          <button
            type="button"
            aria-pressed={savedOnly}
            onClick={() => setSavedOnly((value) => !value)}
            className="ax-btn ax-option min-h-[52px] shrink-0 items-center gap-2 px-3.5 text-sm font-bold min-[720px]:ml-auto"
          >
            <Icon name={savedOnly ? "heart-filled" : "heart"} size={16} className="text-brand" />
            Хадгалсан
            <span className="tabular-nums text-muted">{favorites.length}</span>
          </button>
        </div>
      </div>

      <div className="mt-6 flex min-h-11 flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-[15px] font-bold">
          {items.length} загвар олдлоо
        </p>
        {hasFilters && (
          <Button variant="quiet" onClick={clearAll}>
            <Close size={14} strokeWidth={2.4} />
            Шүүлтүүр цэвэрлэх
          </Button>
        )}
      </div>

      {items.length > 0 ? (
        <AnimatedGroup className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr))]">
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
        <div className="ax-empty ax-in-sm mt-4">
          <span aria-hidden="true" className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-soft text-brand">
            <SearchEmpty size={24} />
          </span>
          <h2 className="text-[22px] font-extrabold">{savedOnly && favorites.length === 0 ? "Хадгалсан загвар алга" : "Тохирох загвар олдсонгүй"}</h2>
          <p className="max-w-[26em] text-base leading-relaxed text-muted">{savedOnly && favorites.length === 0 ? "Таалагдсан загвараа зүрхэн товчоор хадгалж, эндээс дахин үзээрэй." : "Өөр түлхүүр үгээр хайх эсвэл шүүлтүүрээ цэвэрлээд дахин үзээрэй."}</p>
          {hasFilters && (
            <Button variant="primary" onClick={clearAll} className="mt-1">
              Шүүлтүүр цэвэрлэх
            </Button>
          )}
        </div>
      )}

      {/* The tray stays in view while browsing; the full table lives on /compare. */}
      <CompareTray templates={templates} />
    </>
  );
}
