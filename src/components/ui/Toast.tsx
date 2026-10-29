"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Toast = { id: number; kind: "ok" | "err"; text: string; action?: { label: string; onClick: () => void } };
type Push = (t: Omit<Toast, "id">) => void;

const Ctx = createContext<Push>(() => {});

/** Toasts are shown only after the server confirmed (ok) or refused (err) an action. */
export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const seq = useRef(0);
  const push = useCallback<Push>((t) => {
    const id = ++seq.current;
    // One at a time keeps it readable on a phone.
    setList([{ ...t, id }]);
  }, []);
  const dismiss = useCallback((id: number) => setList((l) => l.filter((x) => x.id !== id)), []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[95] flex flex-col items-center gap-2 min-[1024px]:inset-x-auto min-[1024px]:right-6 min-[1024px]:bottom-6 min-[1024px]:items-end"
      >
        {list.map((t) => (
          <ToastItem key={t.id} t={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ t, onDone }: { t: Toast; onDone: () => void }) {
  useEffect(() => {
    const h = setTimeout(onDone, t.action ? 8000 : t.kind === "err" ? 7000 : 4000);
    return () => clearTimeout(h);
  }, [t, onDone]);
  return (
    <div
      role={t.kind === "err" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-[440px] items-start gap-2.5 rounded-[14px] px-4 py-3 text-sm leading-snug font-semibold shadow-[0_20px_40px_-20px_rgba(0,0,0,.5)] [animation:axUpSm_.25s_ease_both] ${
        t.kind === "ok" ? "bg-band text-on-band" : "border border-danger-line bg-danger-bg text-danger-ink"
      }`}
    >
      <span aria-hidden="true" className={`font-extrabold ${t.kind === "ok" ? "text-lime" : ""}`}>
        {t.kind === "ok" ? "✓" : "✕"}
      </span>
      <span className="flex-1">{t.text}</span>
      {t.action && (
        <button
          type="button"
          onClick={() => {
            t.action!.onClick();
            onDone();
          }}
          className={`min-h-9 shrink-0 cursor-pointer rounded-[9px] border-0 px-2.5 text-[13px] font-extrabold ${t.kind === "ok" ? "bg-band-chip text-on-band" : "bg-surface text-danger"}`}
        >
          {t.action.label}
        </button>
      )}
      <button type="button" onClick={onDone} aria-label="Мэдэгдэл хаах" className="-mr-1 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-current opacity-70">
        ✕
      </button>
    </div>
  );
}
