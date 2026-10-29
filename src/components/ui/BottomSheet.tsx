"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Close } from "@/components/icons";
import { useDialog } from "./use-dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Sticky action row (stays above the keyboard and the safe area). */
  footer?: React.ReactNode;
  /** Unsaved changes: closing asks first instead of discarding silently. */
  dirty?: boolean;
  /** "tall" = near full height on phones (long editors). */
  size?: "auto" | "tall";
};

/**
 * Bottom sheet on phones, centred dialog from 768px — one component, one
 * markup. Focus moves in and is trapped, Escape / backdrop / close button
 * all close it (no drag-only closing), the page behind does not scroll,
 * focus returns to the opener, and the panel follows the visual viewport so
 * the on-screen keyboard never covers the focused field.
 */
export function BottomSheet({ open, onClose, title, description, children, footer, dirty = false, size = "auto" }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [kb, setKb] = useState(0);
  const titleId = useId();
  const descId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);

  const requestClose = () => {
    if (dirty && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onClose();
  };
  const ref = useDialog<HTMLDivElement>(open, requestClose);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the confirm step when the sheet closes
  useEffect(() => { if (!open) setConfirming(false); }, [open]);
  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  // Keyboard inset from the visual viewport (iOS does not resize the layout).
  useEffect(() => {
    if (!open || typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => setKb(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center md:p-6" style={{ paddingBottom: kb || undefined }}>
      <div aria-hidden="true" onClick={requestClose} className="absolute inset-0 bg-overlay [animation:axFade_.2s_ease_both]" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`ax-sheet-panel relative flex w-full flex-col overflow-hidden rounded-t-[24px] border border-line bg-elevated text-ink shadow-[0_-20px_60px_-30px_var(--ax-shadow)] md:rounded-[24px] ${
          size === "tall" ? "h-[min(94dvh,100%)] md:h-auto md:max-h-[88dvh] md:max-w-[720px]" : "max-h-[min(92dvh,100%)] md:max-h-[85dvh] md:max-w-[520px]"
        }`}
      >
        <div className="flex shrink-0 flex-col gap-2 border-b border-line-soft px-5 pt-2.5 pb-3">
          <span aria-hidden="true" className="mx-auto mb-1 block h-[5px] w-10 rounded-full bg-line-mid md:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 id={titleId} className="text-[19px] leading-tight font-extrabold">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-[13px] text-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Хаах"
              className="ax-btn inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink"
            >
              <Close size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {(footer || confirming) && (
          <div className="shrink-0 border-t border-line-soft bg-elevated px-5 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))] md:pb-4">
            {confirming ? (
              <div role="alertdialog" aria-label="Хадгалаагүй өөрчлөлт" className="flex flex-col gap-3">
                <p className="text-sm font-bold text-warn-ink">Хадгалаагүй өөрчлөлт байна. Хаавал алга болно.</p>
                <div className="flex gap-2.5">
                  <button
                    ref={keepRef}
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="ax-btn ax-primary min-h-12 flex-[2] rounded-[14px] border-0 bg-primary px-4 text-[15px] font-bold text-on-primary"
                  >
                    Үргэлжлүүлэх
                  </button>
                  <button type="button" onClick={requestClose} className="ax-btn min-h-12 flex-1 rounded-[14px] border border-danger-line bg-surface px-4 text-[15px] font-bold text-danger">
                    Хаах
                  </button>
                </div>
              </div>
            ) : (
              footer
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
