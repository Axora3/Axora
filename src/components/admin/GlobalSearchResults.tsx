"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Inbox,
  Package,
  FolderKanban,
  CreditCard,
} from "lucide-react";

type Result = {
  key: string;
  kind: string;
  category: string;
  title: string;
  secondary: string;
  href: string;
};
const icons = {
  orders: ClipboardList,
  requests: Inbox,
  templates: Package,
  projects: FolderKanban,
  payments: CreditCard,
};

export function GlobalSearchResults({
  query,
  open,
  onClose,
  inputId,
}: {
  query: string;
  open: boolean;
  onClose: () => void;
  inputId: string;
}) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{
    query: string;
    results: Result[];
    failed: string[];
    error?: string;
  }>();
  const [active, setActive] = useState(-1);
  const [retry, setRetry] = useState(0);
  const term = query.trim();
  const current = state?.query === term ? state : undefined;
  const loading = !!term && !current;
  useEffect(() => {
    if (!open || !term) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) throw new Error("Хайлтыг ачаалж чадсангүй.");
        const data = await response.json();
        if (!controller.signal.aborted) {
          setState({ query: term, ...data });
          setActive(-1);
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setState({
            query: term,
            results: [],
            failed: [],
            error: error instanceof Error ? error.message : "Хайлтын алдаа.",
          });
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, term, retry]);
  useEffect(() => {
    if (!open) return;
    const input = document.getElementById(inputId);
    const listId = `${inputId}-results`;
    input?.setAttribute("role", "combobox");
    input?.setAttribute("aria-expanded", "true");
    input?.setAttribute("aria-controls", listId);
    input?.setAttribute("aria-autocomplete", "list");
    if (active >= 0 && current?.results[active])
      input?.setAttribute("aria-activedescendant", `${listId}-${active}`);
    else input?.removeAttribute("aria-activedescendant");
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.preventDefault();
        onClose();
      }
      if (event.target !== input) return;
      const count = current?.results.length ?? 0;
      if ((event.key === "ArrowDown" || event.key === "ArrowUp") && count) {
        event.preventDefault();
        setActive(
          (index) =>
            (index + (event.key === "ArrowDown" ? 1 : -1) + count) % count,
        );
      }
      if (event.key === "Enter" && active >= 0 && current?.results[active]) {
        event.preventDefault();
        onClose();
        router.push(current.results[active].href);
      }
      if (event.key === "Tab") onClose();
    };
    const outside = (event: PointerEvent) => {
      if (!panel.current?.parentElement?.contains(event.target as Node))
        onClose();
    };
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("pointerdown", outside);
      [
        "role",
        "aria-expanded",
        "aria-controls",
        "aria-autocomplete",
        "aria-activedescendant",
      ].forEach((name) => input?.removeAttribute(name));
    };
  }, [open, inputId, active, current, onClose, router]);
  useEffect(() => {
    panel.current
      ?.querySelector(`[aria-selected="true"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  if (!open) return null;
  return (
    <div ref={panel} className="ax-global-results">
      <p className="ax-global-caption">Бүх хэсгээс хайх</p>
      <div role="status" className="ax-global-status">
        {!term ? (
          "Хайх үгээ оруулна уу."
        ) : loading ? (
          "Хайж байна…"
        ) : current?.error ? (
          <>
            {current.error}{" "}
            <button
              type="button"
              onClick={() => {
                setState(undefined);
                setRetry((n) => n + 1);
              }}
            >
              Дахин оролдох
            </button>
          </>
        ) : !current?.results.length ? (
          "Тохирох үр дүн олдсонгүй."
        ) : (
          `${current.results.length} үр дүн`
        )}
        {!!current?.failed.length && (
          <span> {current.failed.join(", ")} хэсгийг ачаалж чадсангүй.</span>
        )}
      </div>
      <div role="listbox" aria-label="Хайлтын үр дүн" id={`${inputId}-results`}>
        {current?.results.map((result, index) => {
          const CategoryIcon =
            icons[result.kind as keyof typeof icons] ?? Package;
          return (
            <a
              key={result.key}
              id={`${inputId}-results-${index}`}
              href={result.href}
              role="option"
              aria-selected={active === index}
              tabIndex={-1}
              onMouseEnter={() => setActive(index)}
              onClick={(event) => {
                event.preventDefault();
                onClose();
                router.push(result.href);
              }}
            >
              <CategoryIcon size={17} aria-hidden="true" />
              <span className="ax-global-copy">
                <strong>{result.title}</strong>
                <small>{result.secondary}</small>
              </span>
              <span className="ax-global-category">{result.category}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
