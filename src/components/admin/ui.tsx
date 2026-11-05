import { Icon, type IconName } from "@/components/ui/icon";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ORDER_STATUS, PAYMENT_STATUS, REQUEST_STATUS, type OrderStatus, type PaymentStatus, type RequestStatus } from "@/lib/admin/labels";
import { AdminBell, AdminMenuButton } from "./AdminShell";
import { CopyButton } from "./client";

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
      className={`z-30 flex flex-col gap-3 px-[clamp(16px,3vw,32px)] py-3.5 min-[1024px]:justify-center min-[1024px]:py-5 ${
        band
          ? "rounded-b-panel bg-band pb-6 text-on-band min-[1024px]:rounded-none min-[1024px]:pb-6"
          : "sticky top-0 border-b border-line bg-header-admin backdrop-blur-[10px] min-[1024px]:static min-[1024px]:border-b-0 min-[1024px]:bg-transparent min-[1024px]:pb-0 min-[1024px]:backdrop-blur-none"
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
                  <Icon name="chevron-right" size={16} />
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.025em] [overflow-wrap:anywhere] min-[1024px]:text-[30px]">{title}</h1>
          {description && <div className={`text-[13.5px] leading-normal ${band ? "text-band-muted" : "text-muted"}`}>{description}</div>}
        </div>
        {actions && <div className="order-3 flex w-full flex-wrap items-center gap-2 min-[1024px]:order-2 min-[1024px]:w-auto">{actions}</div>}
        <div className="order-2 flex shrink-0 items-center gap-2 self-start min-[1024px]:order-3 min-[1024px]:self-center">
          <span className="flex items-center gap-2 min-[1024px]:hidden">
            <AdminBell tone={band ? "band" : "default"} />
            <ThemeToggle tone={band ? "band" : "default"} size={20} />
          </span>
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
      <Icon name={s.icon} size={16} />
      {s.label}
    </span>
  );
}

export function Body({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main id="main" className={`flex flex-col gap-5 p-[clamp(16px,3vw,32px)] ${className}`}>{children}</main>;
}

export function Panel({ title, action, children, className = "", id }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <Card role={title && id ? "region" : undefined} aria-labelledby={title && id ? id : undefined} className={`overflow-hidden ${className}`}>
      {title && (
        <CardHeader>
          <h2 id={id} className="text-[17px] font-extrabold">
            {title}
          </h2>
          {action}
        </CardHeader>
      )}
      {children}
    </Card>
  );
}

export function StatusPill({ kind, status }: { kind: "order" | "request"; status: string }) {
  const s = kind === "order" ? ORDER_STATUS[status as OrderStatus] : REQUEST_STATUS[status as RequestStatus];
  if (!s) return <span>{status}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-extrabold whitespace-nowrap" style={{ background: s.bg, color: s.fg }}>
      <Icon name={s.icon} size={16} />
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
      <Icon name={published ? "eye" : "eye-off"} size={16} />
      {published ? "Нийтлэгдсэн" : "Ноорог"}
    </span>
  );
}

/** One statistic. Values always come from the caller's real query; "—" means it could not be read. */
export function StatCard({ label, value, note, icon, href, band, warn }: { label: string; value: React.ReactNode; note?: React.ReactNode; icon?: IconName; href?: string; band?: boolean; warn?: boolean }) {
  const body = (
    <>
      <span className="flex w-full items-start justify-between gap-2">
        <span className="text-[13px] leading-snug font-bold">{label}</span>
        {icon && <span aria-hidden="true" className="ax-stat-icon"><Icon name={icon} size={18} /></span>}
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="ax-stat-value">{value}</span>
        {note && (
          <span className={`text-xs font-semibold ${warn ? "text-danger" : band ? "text-band-muted" : "text-muted"}`}>
            {warn && <Icon name="circle-alert" size={14} className="mr-1 -mt-0.5" />}
            {note}
          </span>
        )}
      </span>
    </>
  );
  const className = `ax-stat ${band ? "ax-stat-band" : ""}`;
  return href ? <Link href={href} className={className}>{body}</Link> : <div className={className}>{body}</div>;
}

/** The order as one copyable text. Holds the customer's contact details, so it stays admin-only. */
export function OrderPrompt({ text }: { text: string }) {
  return (
    <Panel title="Prompt" id="order-prompt" action={<CopyButton value={text} label="Prompt" />}>
      <div className="flex flex-col gap-3 p-[18px]">
        <p className="text-[13px] leading-normal text-muted">Хэрэглэгчийн баталгаажуулж илгээсэн бүх хариултаас үүссэн. Утас, имэйл зэрэг хувийн мэдээлэл багтсан тул зөвхөн итгэлтэй хэрэгсэлд хуулна уу.</p>
        <pre tabIndex={0} aria-label="Захиалгын prompt" className="m-0 max-h-[640px] overflow-auto rounded-control border border-line bg-sunken p-4 font-mono text-[13px] leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-ink">{text}</pre>
      </div>
    </Panel>
  );
}

export function EmptyState({ title, text, action, icon = "inbox" }: { title: string; text?: string; action?: React.ReactNode; icon?: IconName }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-soft text-brand"><Icon name={icon} size={24} /></span>
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
      <Icon name={tone === "warn" ? "circle-alert" : "info-circle"} size={16} />{" "}
      {children}
    </div>
  );
}

export const btn = {
  primary: buttonStyles("primary"),
  ghost: buttonStyles("secondary"),
  danger: buttonStyles("danger"),
};

export const field = {
  label: "text-sm font-bold",
  input: "ax-control min-h-11 w-full rounded-control border border-line-strong bg-sunken px-3 text-base text-ink",
  textarea: "ax-control w-full resize-y rounded-control border border-line-strong bg-sunken px-3 py-2.5 text-base leading-normal text-ink",
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
            <Icon name="arrow-left" size={16} /> Өмнөх
          </Link>
        ) : (
          <span className={`${btn.ghost} opacity-50`} aria-disabled="true">
            <Icon name="arrow-left" size={16} /> Өмнөх
          </span>
        )}
        {page < pages ? (
          <Link href={makeHref(page + 1)} className={btn.ghost}>
            Дараах <Icon name="arrow-right" size={16} />
          </Link>
        ) : (
          <span className={`${btn.ghost} opacity-50`} aria-disabled="true">
            Дараах <Icon name="arrow-right" size={16} />
          </span>
        )}
      </span>
    </nav>
  );
}
