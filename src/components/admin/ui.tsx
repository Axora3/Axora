import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ORDER_STATUS, PAYMENT_STATUS, REQUEST_STATUS, type OrderStatus, type PaymentStatus, type RequestStatus } from "@/lib/admin/labels";
import { AdminMenuButton } from "./AdminShell";

/** Shared admin building blocks (server-safe). */

/**
 * Page header for every admin screen. Phones: sticky header with the title,
 * theme switch and the menu button (the bottom bar covers the main tabs).
 * Desktop: the same header row next to the sidebar.
 * tone="band" is the dark green header of the mobile dashboard.
 */
export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  tone = "default",
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs?: { href: string; label: string }[];
  actions?: React.ReactNode;
  tone?: "default" | "band";
  /** Extra header rows (search, status tabs) that stay sticky with the title on phones. */
  children?: React.ReactNode;
}) {
  const band = tone === "band";
  return (
    <header
      className={`z-30 flex flex-col gap-3 px-[clamp(16px,3vw,32px)] py-3.5 min-[1024px]:min-h-[72px] min-[1024px]:justify-center ${
        band
          ? "rounded-b-[28px] bg-band pb-6 text-on-band min-[1024px]:rounded-none min-[1024px]:pb-3.5"
          : "sticky top-0 border-b border-line bg-header-admin backdrop-blur-[10px] min-[1024px]:static min-[1024px]:bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {crumbs && crumbs.length > 0 && (
            <nav aria-label="Байршил" className={`flex flex-wrap items-center gap-1.5 text-[13px] font-semibold ${band ? "text-band-faint" : "text-muted"}`}>
              {crumbs.map((c) => (
                <span key={c.href} className="inline-flex items-center gap-1.5">
                  <Link href={c.href} className={`ax-link inline-flex min-h-8 items-center no-underline ${band ? "text-band-faint" : "text-muted"}`}>
                    {c.label}
                  </Link>
                  <span aria-hidden="true">/</span>
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.025em] [overflow-wrap:anywhere] min-[1024px]:text-2xl">{title}</h1>
          {description && <div className={`text-[13.5px] leading-normal ${band ? "text-band-muted" : "text-muted"}`}>{description}</div>}
        </div>
        {actions && <div className="order-3 flex w-full flex-wrap items-center gap-2 min-[1024px]:order-2 min-[1024px]:w-auto">{actions}</div>}
        <div className="order-2 flex shrink-0 items-center gap-2 self-start min-[1024px]:order-3 min-[1024px]:self-center">
          <ThemeToggle tone={band ? "band" : "default"} />
          <AdminMenuButton tone={band ? "band" : "default"} />
        </div>
      </div>
      {children}
    </header>
  );
}

export function PaymentPill({ status }: { status: string }) {
  const s = PAYMENT_STATUS[status as PaymentStatus];
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-extrabold whitespace-nowrap" style={{ background: s.bg, color: s.fg }}>
      <span aria-hidden="true">{s.icon}</span>
      {s.label}
    </span>
  );
}

export function Body({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main id="main" className={`flex flex-col gap-5 p-[clamp(16px,3vw,32px)] ${className}`}>{children}</main>;
}

export function Panel({ title, action, children, className = "", id }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={`min-w-0 overflow-hidden rounded-[18px] border border-line bg-surface ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-soft px-[18px] py-3.5">
          <h2 id={id} className="text-[17px] font-extrabold">
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ kind, status }: { kind: "order" | "request"; status: string }) {
  const s = kind === "order" ? ORDER_STATUS[status as OrderStatus] : REQUEST_STATUS[status as RequestStatus];
  if (!s) return <span>{status}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-extrabold whitespace-nowrap" style={{ background: s.bg, color: s.fg }}>
      <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-current" />
      {s.label}
    </span>
  );
}

export function PubPill({ published }: { published: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-extrabold whitespace-nowrap"
      style={published ? { background: "var(--ax-success-bg)", color: "var(--ax-success)" } : { background: "var(--ax-warn-bg)", color: "var(--ax-warn)" }}
    >
      <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-current" />
      {published ? "Нийтлэгдсэн" : "Ноорог"}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <h3 className="text-lg font-extrabold">{title}</h3>
      {text && <p className="max-w-[30em] text-[15px] leading-relaxed text-muted">{text}</p>}
      {action}
    </div>
  );
}

/** A real read failure — never presented as "no data". */
export function LoadFailed({ what = "өгөгдөл" }: { what?: string }) {
  return (
    <div role="alert" className="m-4 rounded-xl border border-danger-line bg-danger-bg p-4 text-[15px] font-semibold text-danger-ink">
      {what[0].toUpperCase() + what.slice(1)} уншихад алдаа гарлаа. Хуудсыг дахин ачаалаад оролдоно уу. Алдаа давтагдвал Тохиргоо хэсгээс холболтоо шалгана уу.
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn"; children: React.ReactNode }) {
  return (
    <div role="status" className={`rounded-xl border p-3.5 text-sm leading-normal font-semibold ${tone === "warn" ? "border-warn-line bg-warn-bg text-warn-ink" : "border-line bg-info-bg text-info"}`}>
      <span aria-hidden="true">{tone === "warn" ? "! " : "i "}</span>
      {children}
    </div>
  );
}

export const btn = {
  primary: "ax-btn ax-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] border-0 bg-primary px-4 text-sm font-bold text-on-primary no-underline disabled:opacity-60",
  ghost: "ax-btn ax-ghost inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] border border-line-strong bg-surface px-4 text-sm font-bold text-ink no-underline disabled:opacity-60",
  danger: "ax-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] border border-danger-line bg-surface px-4 text-sm font-bold text-danger no-underline disabled:opacity-60",
};

export const field = {
  label: "text-sm font-bold",
  input: "min-h-11 w-full rounded-[10px] border border-line-strong bg-sunken px-3 text-base text-ink",
  textarea: "w-full resize-y rounded-[10px] border border-line-strong bg-sunken px-3 py-2.5 text-base leading-normal text-ink",
  hint: "text-[13px] leading-normal text-muted",
};

export function Pagination({ page, pages, total, makeHref }: { page: number; pages: number; total: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return <p className="px-[18px] py-3 text-[13px] text-muted">Нийт {total}</p>;
  return (
    <nav aria-label="Хуудаслалт" className="flex flex-wrap items-center justify-between gap-3 border-t border-soft px-[18px] py-3">
      <span className="text-[13px] text-muted">
        Нийт {total} · {page}/{pages} хуудас
      </span>
      <span className="flex gap-2">
        {page > 1 ? (
          <Link href={makeHref(page - 1)} className={btn.ghost}>
            ← Өмнөх
          </Link>
        ) : (
          <span className={`${btn.ghost} opacity-50`} aria-disabled="true">
            ← Өмнөх
          </span>
        )}
        {page < pages ? (
          <Link href={makeHref(page + 1)} className={btn.ghost}>
            Дараах →
          </Link>
        ) : (
          <span className={`${btn.ghost} opacity-50`} aria-disabled="true">
            Дараах →
          </span>
        )}
      </span>
    </nav>
  );
}
