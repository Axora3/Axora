"use client";

import { createContext, useCallback, useContext, useState, type ComponentProps } from "react";
import { X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { modalVariants, overlayVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Adapted from shadcn/ui Dialog (MIT), with Motion enter and exit. See THIRD_PARTY_NOTICES.md.
// For a long form with unsaved-changes protection, use BottomSheet.
const OpenContext = createContext(false);

export function Dialog({ open: controlled, defaultOpen = false, onOpenChange, children, ...props }: ComponentProps<typeof DialogPrimitive.Root>) {
  const [internal, setInternal] = useState(defaultOpen);
  const open = controlled ?? internal;
  const change = useCallback(
    (next: boolean) => {
      setInternal(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  return (
    <DialogPrimitive.Root open={open} onOpenChange={change} {...props}>
      <OpenContext.Provider value={open}>{children}</OpenContext.Provider>
    </DialogPrimitive.Root>
  );
}

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/** Bottom sheet on phones, centred from 768px. AnimatePresence keeps it mounted through the exit. */
export function DialogContent({ className, children, hideClose = false, ...props }: ComponentProps<typeof DialogPrimitive.Content> & { hideClose?: boolean }) {
  const open = useContext(OpenContext);
  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <m.div className="fixed inset-0 z-(--ax-z-modal) bg-overlay" variants={overlayVariants} initial="hidden" animate="visible" exit="exit" />
          </DialogPrimitive.Overlay>
          <div className="pointer-events-none fixed inset-0 z-(--ax-z-modal) flex items-end justify-center md:items-center md:p-6">
            <DialogPrimitive.Content asChild forceMount {...props}>
              <m.div
                data-slot="dialog-content"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  "pointer-events-auto relative flex max-h-[92dvh] w-full flex-col gap-4 overflow-y-auto rounded-t-panel border border-line bg-elevated p-5 pb-[calc(20px+env(safe-area-inset-bottom))] text-ink shadow-raised md:max-h-[85dvh] md:max-w-[520px] md:rounded-panel md:p-6",
                  className,
                )}
              >
                {children}
                {!hideClose && (
                  <DialogPrimitive.Close aria-label="Хаах" className="ax-button ax-button-quiet absolute top-3 right-3 w-11 px-0">
                    <X aria-hidden="true" size={18} />
                  </DialogPrimitive.Close>
                )}
              </m.div>
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-1.5 pr-10", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-[19px] leading-tight font-extrabold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-sm leading-relaxed text-muted", className)} {...props} />;
}
