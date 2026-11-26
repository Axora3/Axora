"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useId, useState, useTransition } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Icon } from "@/components/ui/icon";
import { Menu as AccountMenu } from "@/components/ui/menu";
import { GlobalSearchResults } from "./GlobalSearchResults";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import { AdminBell, AdminMenuButton, SignOutButton, useAdminChrome } from "./AdminShell";
import { ADMIN_NAV, isActive } from "./nav";

/** Every scope is an existing list page that already filters by `q`. */
const SCOPES = [
  { href: "all", label: "Бүгд" },
  { href: "/admin/orders", label: "Захиалга" },
  { href: "/admin/template-requests", label: "Хүсэлт" },
  { href: "/admin/templates", label: "Бүтээгдэхүүн" },
  { href: "/admin/projects", label: "Төсөл" },
  { href: "/admin/payments", label: "Төлбөр" },
];

/** Where you are, from the URL and the navigation config, so every admin page gets it. */
function Crumbs({ path }: { path: string }) {
  const item = ADMIN_NAV.find((n) => isActive(n, path));
  const rest = item ? path.slice(item.href.length) : "";
  const leaf = !rest
    ? null
    : rest.endsWith("/new")
      ? "Шинэ"
      : rest.endsWith("/edit")
        ? "Засах"
        : "Дэлгэрэнгүй";
  return (
    <nav
      aria-label="Байршил"
      className="flex min-w-0 items-center gap-2 text-[13px] text-muted"
    >
      <Link href="/admin" className="ax-link no-underline text-muted">
        Админ
      </Link>
      {item && !item.exact && (
        <>
          <Icon name="chevron-right" size={14} />
          {leaf ? (
            <Link
              href={item.href}
              className="ax-link truncate no-underline text-muted"
            >
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="truncate font-bold text-ink">
              {item.label}
            </span>
          )}
        </>
      )}
      {item?.exact && (
        <>
          <Icon name="chevron-right" size={14} />
          <span aria-current="page" className="truncate font-bold text-ink">
            {item.label}
          </span>
        </>
      )}
      {leaf && (
        <>
          <Icon name="chevron-right" size={14} />
          <span aria-current="page" className="font-bold text-ink">
            {leaf}
          </span>
        </>
      )}
    </nav>
  );
}

/** A URL-backed search in the permanent header, also available in the mobile drawer. */
export function AdminSearch({
  compact = false,
  disabled = false,
}: {
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <Suspense fallback={<SearchFields compact={compact} disabled />}>
      <SearchFromUrl compact={compact} disabled={disabled} />
    </Suspense>
  );
}

function SearchFromUrl({
  compact,
  disabled,
}: {
  compact: boolean;
  disabled: boolean;
}) {
  const path = usePathname();
  const params = useSearchParams();
  const scope =
    (params.has("q")
      ? SCOPES.find((s) => path.startsWith(s.href))?.href
      : undefined) ?? SCOPES[0].href;
  return (
    <SearchFields
      key={`${path}?${params}`}
      compact={compact}
      disabled={disabled}
      initialScope={scope}
      initialQuery={params.get("q") ?? ""}
    />
  );
}

function SearchFields({
  compact,
  disabled = false,
  initialScope = SCOPES[0].href,
  initialQuery = "",
}: {
  compact: boolean;
  disabled?: boolean;
  initialScope?: string;
  initialQuery?: string;
}) {
  const id = useId();
  const router = useRouter();
  const [scope, setScope] = useState(initialScope);
  const [q, setQ] = useState(initialQuery);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      role="search"
      aria-label="Админ хайлт"
      aria-busy={pending || undefined}
      className={`ax-admin-search ${compact ? "ax-admin-search-compact" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        if (scope === "all") {
          setResultsOpen(true);
          return;
        }
        if (!disabled)
          startTransition(() =>
            router.push(
              term ? `${scope}?q=${encodeURIComponent(term)}` : scope,
            ),
          );
      }}
    >
      <label htmlFor={`${id}-scope`} className="sr-only">
        Хайх хэсэг
      </label>
      <Select
        onOpenChange={(open) => {
          if (open) setResultsOpen(false);
        }}
        value={scope}
        onValueChange={(value) => {
          setScope(value);
          setResultsOpen(false);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={`${id}-scope`}
          aria-label="Хайх хэсэг"
          className="ax-search-scope-trigger"
          title={SCOPES.find((s) => s.href === scope)?.label}
        >
          <SelectValue>
            {SCOPES.find((s) => s.href === scope)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          className="ax-search-scope-menu"
          align="start"
          sideOffset={8}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          {SCOPES.map((s) => (
            <SelectItem key={s.href} value={s.href}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="ax-admin-search-input">
        <Search aria-hidden="true" size={16} strokeWidth={1.75} />
        <label htmlFor={`${id}-q`} className="sr-only">
          Хайх үг
        </label>
        <input
          id={`${id}-q`}
          type="search"
          value={q}
          disabled={disabled}
          onChange={(e) => {
            setQ(e.target.value);
            setResultsOpen(true);
          }}
          onFocus={() => {
            if (q.trim()) setResultsOpen(true);
          }}
          placeholder="Хайх..."
        />
        <button
          className="ax-search-submit"
          type="submit"
          aria-label={pending ? "Хайж байна" : "Хайх"}
          disabled={disabled || pending}
        >
          {pending ? (
            <LoaderCircle
              aria-hidden="true"
              size={15}
              strokeWidth={1.75}
              className="ax-search-spinner"
            />
          ) : (
            <ArrowRight aria-hidden="true" size={15} strokeWidth={1.75} />
          )}
        </button>
      </span>
      {scope === "all" && (
        <GlobalSearchResults
          query={q}
          open={resultsOpen && !disabled}
          onClose={() => setResultsOpen(false)}
          inputId={`${id}-q`}
        />
      )}
      {pending && (
        <span role="status" className="sr-only">
          Хайж байна…
        </span>
      )}
    </form>
  );
}

/** Shared mobile header retains notifications and the theme toggle. */
export function AdminMobileTopBar({ loading = false }: { loading?: boolean }) {
  const { email } = useAdminChrome();
  return (
    <div className="ax-admin-mobile-topbar sticky top-0 z-40 min-[1024px]:hidden">
      <div className="ax-mobile-identity">
        <AdminMenuButton />
        {loading || !email ? (
          <span aria-hidden="true" className="ax-sk h-9 w-28 rounded-control" />
        ) : (
          <AccountMenu
            label={`Профайл: ${email}`}
            triggerClassName="ax-mobile-account"
            trigger={
              <>
                <span className="ax-mobile-avatar" aria-hidden="true">
                  {email.slice(0, 2).toUpperCase()}
                </span>
                <span className="ax-mobile-email" title={email}>
                  {email}
                </span>
                <Icon name="chevron-down" size={14} />
              </>
            }
          >
            <p
              className="truncate px-2.5 py-2 text-xs text-muted"
              title={email}
            >
              {email}
            </p>
            <Link
              href="/admin/settings"
              role="menuitem"
              className="ax-menu-item"
            >
              <Icon name="settings" size={18} />
              Тохиргоо
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="ax-menu-item"
            >
              <Icon name="external-link" size={18} />
              Сайт харах
            </a>
            <SignOutButton className="ax-menu-item" menuItem />
          </AccountMenu>
        )}
      </div>
      <div className="ax-mobile-header-actions">
        {loading ? (
          <span aria-hidden="true" className="ax-sk h-9 w-20" />
        ) : (
          <>
            <AdminBell />
            <ThemeToggle size={20} />
          </>
        )}
      </div>
    </div>
  );
}

export function AdminTopBar({
  loading = false,
}: {
  email: string | null;
  loading?: boolean;
}) {
  const path = usePathname();
  return (
    <div className="ax-admin-topbar sticky top-0 z-30 hidden h-16 shrink-0 items-center gap-3 border-b border-line bg-header-admin px-[clamp(16px,3vw,32px)] min-[1024px]:flex">
      <Crumbs path={path} />
      <div className="ax-admin-header-search">
        <AdminSearch compact disabled={loading} />
      </div>

      <span className="ax-admin-header-actions flex min-w-0 items-center justify-end gap-2">
        {loading ? (
          <span aria-hidden="true" className="flex gap-2">
            <span className="ax-sk h-8 w-8" />
            <span className="ax-sk h-8 w-8" />
          </span>
        ) : (
          <>
            <AdminBell />
            <ThemeToggle size={20} />
          </>
        )}
      </span>
    </div>
  );
}
