"use client";

import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/ui/sidebar";
import { AdminMobileTopBar, AdminTopBar } from "./AdminTopBar";
import { LogoBadge } from "./AdminShell";
import { ADMIN_NAV, NAV_GROUPS } from "./nav";

export function ChartSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="ax-admin-panel ax-surface"
      aria-busy="true"
      aria-label="График ачаалж байна"
    >
      <div data-slot="card-header">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="ax-admin-chart-content">
        <div className="flex gap-8">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div
          className={`ax-admin-chart-skeleton-plot ${compact ? "ax-admin-chart-skeleton-compact" : ""}`}
        >
          <div className="flex h-full items-end gap-4 px-8 pb-4">
            {[44, 68, 52, 80, 64, 88].map((height, i) => (
              <Skeleton
                key={i}
                className="flex-1"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="ax-admin-panel ax-surface overflow-hidden">
      <div data-slot="card-header">
        <Skeleton className="h-4 w-36" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex min-h-16 items-center gap-4 border-t border-line-soft px-6"
        >
          <Skeleton className="h-8 w-8 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Same containers, metrics count and chart dimensions as the final overview. */
export function AdminPageSkeleton({
  variant = "auto",
}: {
  variant?: "auto" | "dashboard";
}) {
  const path = usePathname();
  const dashboard = variant === "dashboard" || path === "/admin";
  return (
    <div
      className="ax-admin-content-skeleton"
      aria-busy="true"
      aria-label="Ачаалж байна"
    >
      <div className="ax-admin-page-header">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Skeleton className="h-10 w-full max-w-60" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="hidden gap-2 min-[1024px]:flex">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-36" />
          </div>
        </div>
        {dashboard && (
          <div className="grid grid-cols-2 gap-2 min-[1024px]:hidden">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        )}
      </div>
      <div className="ax-admin-body">
        {dashboard ? (
          <>
            <section className="ax-admin-metrics-section flex flex-col gap-3">
              <Skeleton className="h-5 w-28" />
              <div className="ax-admin-metrics-grid">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="ax-stat">
                    <Skeleton className="h-4 w-4/5" />
                    <div className="flex flex-col gap-3">
                      <Skeleton className="h-10 w-16" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <div className="ax-admin-skeleton-period flex flex-wrap items-center justify-between gap-4">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-16 w-[min(100%,620px)]" />
            </div>
            <div className="ax-admin-dashboard-grid grid items-start gap-6 min-[1280px]:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex min-w-0 flex-col gap-6">
                <ChartSkeleton />
                <ListSkeleton rows={3} />
                <ChartSkeleton compact />
                <ChartSkeleton compact />
                <ListSkeleton />
                <ListSkeleton rows={4} />
              </div>
              <div className="ax-admin-dashboard-secondary flex min-w-0 flex-col gap-6">
                <div className="ax-stat">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <ListSkeleton />
                <ListSkeleton rows={4} />
                <ListSkeleton />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-11 w-[min(100%,560px)]" />
              <Skeleton className="h-11 w-28" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-20" />
              ))}
            </div>
            <ListSkeleton rows={8} />
          </>
        )}
      </div>
    </div>
  );
}

/** Authentication fallback uses the very same sidebar and top-bar geometry. */
export function AdminShellSkeleton() {
  return (
    <div
      className="ax-admin-shell-skeleton flex min-h-dvh bg-bg-admin"
      aria-busy="true"
      aria-label="Админ самбар ачаалж байна"
    >
      <Sidebar className="ax-admin-sidebar-skeleton sticky top-0 hidden h-dvh min-[1024px]:flex">
        <div className="ax-admin-skeleton-brand shrink-0 px-2">
          <LogoBadge />
        </div>
        <nav aria-hidden="true" className="ax-admin-nav flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group} className="flex shrink-0 flex-col gap-[3px]">
              <Skeleton className="mx-2.5 mb-2 h-4 w-20" />
              {ADMIN_NAV.filter((n) => n.group === group).map((n) => (
                <div
                  key={n.href}
                  className="flex h-9 items-center gap-2.5 px-2.5"
                >
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <Skeleton className="ax-admin-skeleton-nav-label h-3 w-3/4" />
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div className="ax-admin-skeleton-footer flex shrink-0 flex-col gap-2 border-t border-band-line pt-3">
          <Skeleton className="h-4 w-28" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 shrink-0" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </Sidebar>
      <div className="ax-admin-canvas min-w-0 flex-1">
        <AdminMobileTopBar loading />
        <AdminTopBar email={null} loading />
        <AdminPageSkeleton />
      </div>
      <div
        aria-hidden="true"
        className="ax-admin-dock min-[1024px]:hidden"
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="ax-dock-item">
            <Skeleton className="h-[18px] w-[18px]" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
