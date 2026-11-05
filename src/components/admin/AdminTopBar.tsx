"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Icon } from "@/components/ui/icon";
import { Menu } from "@/components/ui/menu";
import { AdminBell, SignOutButton } from "./AdminShell";

/** Every scope is an existing list page that already filters by `q`. */
const SCOPES = [
  { href: "/admin/orders", label: "Захиалга" },
  { href: "/admin/template-requests", label: "Хүсэлт" },
  { href: "/admin/templates", label: "Бүтээгдэхүүн" },
  { href: "/admin/projects", label: "Төсөл" },
  { href: "/admin/payments", label: "Төлбөр" },
];

/** Desktop header: scoped search, notifications, theme and the profile menu. */
export function AdminTopBar({ email }: { email: string }) {
  const router = useRouter();
  const path = usePathname();
  const inScope = SCOPES.find((s) => path.startsWith(s.href))?.href ?? SCOPES[0].href;
  const [picked, setPicked] = useState<string | null>(null);
  const scope = picked ?? inScope;
  const [q, setQ] = useState("");

  return (
    <div className="sticky top-0 z-30 hidden h-16 shrink-0 items-center gap-3 border-b border-line bg-header-admin px-[clamp(16px,3vw,32px)] backdrop-blur-[10px] min-[1024px]:flex">
      <form
        role="search"
        aria-label="Админ хайлт"
        className="flex w-full max-w-[520px] items-center overflow-hidden rounded-control border border-line-strong bg-surface focus-within:border-focus focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ax-focus)_24%,transparent)]"
        onSubmit={(e) => {
          e.preventDefault();
          const term = q.trim();
          router.push(term ? `${scope}?q=${encodeURIComponent(term)}` : scope);
        }}
      >
        <label htmlFor="admin-scope" className="sr-only">Хайх хэсэг</label>
        <select id="admin-scope" value={scope} onChange={(e) => setPicked(e.target.value)} className="min-h-10 cursor-pointer border-0 border-r border-line bg-transparent pr-1 pl-3 text-sm font-bold text-ink outline-none">
          {SCOPES.map((s) => <option key={s.href} value={s.href}>{s.label}</option>)}
        </select>
        <Icon name="search" size={17} className="ml-3 shrink-0 text-muted" />
        <label htmlFor="admin-q" className="sr-only">Хайх үг</label>
        <input id="admin-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Хайх…" className="min-h-10 w-full min-w-0 border-0 bg-transparent px-2.5 text-[15px] text-ink outline-none" />
      </form>

      <span className="ml-auto flex items-center gap-2">
        <AdminBell />
        <ThemeToggle size={20} />
        <Menu
          label={`Профайл: ${email}`}
          triggerClassName="ax-btn inline-flex h-11 cursor-pointer items-center gap-2 rounded-control border border-line bg-surface pr-2 pl-1.5 text-ink"
          trigger={
            <>
              <span aria-hidden="true" className="inline-flex h-8 w-8 items-center justify-center rounded-inner bg-band text-xs font-extrabold text-lime uppercase">{email.slice(0, 2)}</span>
              <Icon name="chevron-down" size={16} />
            </>
          }
        >
          <p className="truncate px-2.5 pt-1.5 pb-2 text-[13px] text-muted" title={email}>{email}</p>
          <Link href="/admin/settings" role="menuitem" className="ax-menu-item"><Icon name="settings" size={18} />Тохиргоо</Link>
          <a href="/" target="_blank" rel="noopener noreferrer" role="menuitem" className="ax-menu-item"><Icon name="external-link" size={18} />Сайт харах</a>
          <span className="my-1 h-px bg-line-soft" />
          <SignOutButton className="ax-menu-item" />
        </Menu>
      </span>
    </div>
  );
}
