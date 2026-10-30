"use client";

import Link from "next/link";
import type { Template } from "@/lib/templates/types";
import { useTemplateCollections } from "@/lib/templates/use-template-collections";

export function TemplateCollectionActions({ template }: { template: Pick<Template, "id" | "title"> }) {
  const { favorites, comparison, ready, toggleFavorite, toggleComparison } = useTemplateCollections();
  const isFavorite = favorites.includes(template.id);
  const isComparing = comparison.includes(template.id);
  const full = comparison.length >= 3;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        disabled={!ready}
        aria-pressed={isFavorite}
        onClick={() => toggleFavorite(template.id)}
        className="ax-btn inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3.5 text-sm font-bold text-ink disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
        </svg>
        {isFavorite ? "Хадгалсан" : "Хадгалах"}
      </button>
      <button
        type="button"
        disabled={!ready || (!isComparing && full)}
        aria-pressed={isComparing}
        onClick={() => toggleComparison(template.id)}
        title={!isComparing && full ? "Нэг удаад 3 хүртэл загвар сонгоно" : undefined}
        className="ax-btn inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3.5 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden="true">{isComparing ? "✓" : "↔"}</span>
        {isComparing ? "Харьцуулалтад нэмсэн" : "Харьцуулах"}
      </button>
      {isComparing && (
        <Link href="/templates#template-comparison-title" className="ax-link inline-flex min-h-11 items-center px-2 text-sm font-bold text-brand">
          Харьцуулалт харах ({comparison.length})
        </Link>
      )}
    </div>
  );
}
