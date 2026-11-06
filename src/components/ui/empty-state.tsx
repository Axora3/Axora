import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "There is nothing here yet." A failed read is a different state and uses an
 * error message, never this. `frame` draws the dashed card for a page-level
 * empty state; leave it off when already inside a card.
 */
export function EmptyState({ title, description, icon, action, frame = false, headingLevel = 3, className }: { title: ReactNode; description?: ReactNode; icon?: ReactNode; action?: ReactNode; frame?: boolean; headingLevel?: 2 | 3; className?: string }) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div data-slot="empty-state" className={cn("flex flex-col items-center gap-3 text-center", frame ? "ax-empty" : "px-6 py-12", className)}>
      <span aria-hidden="true" className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-soft text-brand">
        {icon ?? <Inbox size={24} />}
      </span>
      <Heading className="text-lg font-extrabold">{title}</Heading>
      {description && <p className="max-w-[30em] text-body leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2.5">{action}</div>}
    </div>
  );
}
