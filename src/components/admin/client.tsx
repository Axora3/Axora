"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Remembers the list URL (filters + page) so “back to list” restores it. */
export function RememberListUrl({ storageKey }: { storageKey: string }) {
  const path = usePathname();
  const sp = useSearchParams();
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, path + (sp.toString() ? `?${sp}` : ""));
    } catch {
      /* ignore */
    }
  }, [storageKey, path, sp]);
  return null;
}

export function BackToList({ storageKey, fallback, label }: { storageKey: string; fallback: string; label: string }) {
  const [href, setHref] = useState(fallback);
  useEffect(() => {
    try {
      const v = sessionStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from storage
      if (v && v.startsWith(fallback)) setHref(v);
    } catch {
      /* ignore */
    }
  }, [storageKey, fallback]);
  return (
    <Link href={href} className="ax-ghost ax-btn inline-flex min-h-11 items-center gap-2 rounded-[11px] border border-line-strong bg-surface px-4 text-sm font-bold text-ink no-underline">
      ← {label}
    </Link>
  );
}

/** Copies a value; reports success only after the clipboard accepted it. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState("ok");
        } catch {
          setState("fail");
        }
        setTimeout(() => setState("idle"), 2000);
      }}
      aria-label={`${label} хуулах`}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border border-line-strong bg-surface px-3 text-[13px] font-bold text-ink"
    >
      <span aria-live="polite">{state === "ok" ? "Хуулсан ✓" : state === "fail" ? "Хуулж чадсангүй" : "Хуулах"}</span>
    </button>
  );
}

/** Client-only tabs over server-rendered panels; the active tab lives in ?tab= for deep links. */
export function Tabs({ tabs, initial }: { tabs: { id: string; label: string; content: React.ReactNode }[]; initial?: string }) {
  const [cur, setCur] = useState(tabs.some((t) => t.id === initial) ? initial! : tabs[0].id);
  function pick(id: string) {
    setCur(id);
    const u = new URL(location.href);
    u.searchParams.set("tab", id);
    history.replaceState(null, "", u);
  }
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Захиалгын хэсгүүд" className="ax-scroll gap-1 rounded-xl bg-soft-3 p-1">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={cur === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={cur === t.id ? 0 : -1}
            onClick={() => pick(t.id)}
            onKeyDown={(e) => {
              const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!d) return;
              const n = tabs[(i + d + tabs.length) % tabs.length];
              pick(n.id);
              document.getElementById(`tab-${n.id}`)?.focus();
            }}
            className={`min-h-11 shrink-0 cursor-pointer rounded-[9px] border-0 px-3.5 text-sm font-bold ${cur === t.id ? "bg-surface text-ink shadow-[0_1px_2px_rgba(23,37,30,.14)]" : "bg-transparent text-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} hidden={cur !== t.id} tabIndex={0}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
