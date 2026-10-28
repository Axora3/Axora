"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Close, Menu } from "@/components/icons";
import { useDialog } from "@/components/ui/use-dialog";
import { browserAuthClient } from "@/lib/admin/browser-auth";

type Counts = { orders: number; requests: number };

const NAV = [
  { href: "/admin", label: "Хяналтын самбар", exact: true },
  { href: "/admin/orders", label: "Веб захиалгууд", count: "orders" as const },
  { href: "/admin/templates", label: "Загварууд" },
  { href: "/admin/template-requests", label: "Загварын хүсэлтүүд", count: "requests" as const },
  { href: "/admin/content", label: "Сайтын агуулга" },
  { href: "/admin/activity", label: "Үйлдлийн түүх" },
  { href: "/admin/settings", label: "Тохиргоо" },
];

function LogoBadge() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] bg-lime">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20L12 4l8 16h-4.2L12 12.2 8.2 20z" fill="#17251E" />
        </svg>
      </span>
      <span className="text-[17px] font-extrabold tracking-[0.08em]">AXORA</span>
      <span className="rounded-[5px] border border-[#3C5446] px-1.5 py-[3px] text-[10.5px] font-extrabold text-lime">ADMIN</span>
    </span>
  );
}

export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await browserAuthClient()?.auth.signOut();
        router.replace("/admin/login?reason=signedout");
        router.refresh();
      }}
      className={className}
    >
      {busy ? "Гарч байна…" : "Гарах"}
    </button>
  );
}

function SideContent({ counts, email, onNavigate }: { counts: Counts; email: string; onNavigate?: () => void }) {
  const path = usePathname();
  const link = "flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[14.5px] font-semibold no-underline transition-colors";
  return (
    <>
      <nav aria-label="Админ цэс" className="flex flex-col gap-0.5">
        <span className="mx-3 my-1.5 text-[11px] font-extrabold tracking-[0.1em] text-[#7F9286] uppercase">Удирдлага</span>
        {NAV.map((n) => {
          const on = n.exact ? path === n.href : path.startsWith(n.href);
          const c = n.count ? counts[n.count] : 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={onNavigate}
              aria-current={on ? "page" : undefined}
              className={`${link} ${on ? "bg-lime font-extrabold text-ink" : "text-[#B9C6BD] hover:bg-[#22352B] hover:text-white"}`}
            >
              {n.label}
              {c > 0 && (
                <span
                  className={`ml-auto inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[11px] px-1.5 text-[11.5px] font-extrabold ${on ? "bg-ink text-lime" : "bg-[#2E4438] text-white"}`}
                  aria-label={`${c} шинэ`}
                >
                  {c}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-1">
        <a href="/" target="_blank" rel="noopener" className={`${link} text-[#B9C6BD] hover:bg-[#22352B] hover:text-white`}>
          Сайт харах ↗
        </a>
        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-[#22352B] p-2.5">
          <span aria-hidden="true" className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#34483C] text-[13px] font-extrabold uppercase">
            {email.slice(0, 2)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13.5px] font-bold" title={email}>
              {email}
            </span>
            <span className="text-xs text-[#9DB0A3]">Админ</span>
          </span>
        </div>
        <SignOutButton className={`${link} w-full cursor-pointer border-0 bg-transparent text-left text-[#B9C6BD] hover:bg-[#22352B] hover:text-white`} />
      </div>
    </>
  );
}

export function AdminShell({ counts, email, children }: { counts: Counts; email: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const ref = useDialog<HTMLDivElement>(open, () => setOpen(false));
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the drawer after navigation
  useEffect(() => setOpen(false), [path]);
  const current = NAV.find((n) => (n.exact ? path === n.href : path.startsWith(n.href)))?.label ?? "Админ";

  return (
    <div className="flex min-h-dvh bg-[#F3F5EE]">
      <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col gap-6 overflow-y-auto bg-ink px-3.5 py-5 text-[#E8EDE6] min-[1024px]:flex">
        <Link href="/admin" aria-label="AXORA Admin нүүр" className="px-2 py-1 text-[#F7F8F2] no-underline">
          <LogoBadge />
        </Link>
        <SideContent counts={counts} email={email} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-ink px-2 text-[#F7F8F2] min-[1024px]:hidden">
          <button
            type="button"
            aria-label="Цэс нээх"
            aria-expanded={open}
            aria-controls="admin-drawer"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border-0 bg-transparent text-[#F7F8F2]"
          >
            <Menu size={22} />
          </button>
          <span className="truncate text-[15px] font-extrabold">{current}</span>
          {counts.orders > 0 && (
            <Link href="/admin/orders?status=new" className="ml-auto inline-flex min-h-11 items-center rounded-[10px] bg-lime px-3 text-[13px] font-extrabold text-ink no-underline">
              {counts.orders} шинэ
            </Link>
          )}
        </div>
        {children}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 min-[1024px]:hidden">
          <div aria-hidden="true" onClick={() => setOpen(false)} className="absolute inset-0 bg-[rgba(23,37,30,0.55)] [animation:axFade_.2s_ease_both]" />
          <div
            ref={ref}
            id="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Админ цэс"
            className="absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col gap-6 overflow-y-auto bg-ink px-3.5 py-4 text-[#E8EDE6] [animation:axSlide_.25s_ease_both]"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 text-[#F7F8F2]">
                <LogoBadge />
              </span>
              <button type="button" data-autofocus aria-label="Цэс хаах" onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border-0 bg-[#22352B] text-white">
                <Close size={20} />
              </button>
            </div>
            <SideContent counts={counts} email={email} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
