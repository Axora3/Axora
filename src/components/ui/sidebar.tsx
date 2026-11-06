import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Dark band navigation. Presentational and server-safe: the caller owns the
 * active route and the collapsed state. shadcn/ui's Sidebar also brings its own
 * provider and mobile sheet, which AXORA already has in AdminShell, so this keeps
 * only the composition (see THIRD_PARTY_NOTICES.md).
 */
export function Sidebar({ collapsed = false, className, ...props }: ComponentProps<"aside"> & { collapsed?: boolean }) {
  return (
    <aside
      data-slot="sidebar"
      data-collapsed={collapsed || undefined}
      className={cn("ax-admin-side flex shrink-0 flex-col gap-5 overflow-x-hidden overflow-y-auto bg-band px-3 py-4 text-on-band", collapsed ? "w-[72px]" : "w-[264px]", className)}
      {...props}
    />
  );
}

export function SidebarGroup({ label, collapsed = false, className, children }: { label: string; collapsed?: boolean; className?: string; children: ReactNode }) {
  return (
    <div data-slot="sidebar-group" className={cn("flex flex-col gap-0.5", className)}>
      {collapsed ? <span aria-hidden="true" className="mx-3 my-1 h-px bg-band-line" /> : <span className="mx-3 my-1 text-xs font-bold text-band-faint">{label}</span>}
      {children}
    </div>
  );
}

export const sidebarItemStyles = "flex min-h-11 items-center gap-3 rounded-control px-3 text-[14px] font-semibold no-underline transition-colors";

export function SidebarLink({ href, active = false, collapsed = false, icon, label, adornment, onClick }: { href: string; active?: boolean; collapsed?: boolean; icon: ReactNode; label: string; /** A count or status. In the collapsed rail it should be its own small dot. */ adornment?: ReactNode; onClick?: ComponentProps<typeof Link>["onClick"] }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        sidebarItemStyles,
        collapsed && "relative justify-center px-0",
        active ? "bg-lime font-extrabold text-on-lime shadow-[inset_0_1px_0_rgb(255_255_255_/_0.25)]" : "text-band-muted hover:bg-band-hover hover:text-on-band",
      )}
    >
      {icon}
      <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate"}>{label}</span>
      {adornment}
    </Link>
  );
}
