import { Activity, Bell, ClipboardList, CreditCard, FolderKanban, Inbox, Layers, LayoutDashboard, LifeBuoy, Megaphone, Package, Settings, type LucideIcon } from "lucide-react";

/**
 * One navigation config for both the desktop sidebar and the mobile bottom
 * tab bar. `tab` marks the four items shown in the bottom bar (in order);
 * the rest are reachable from the mobile menu.
 */
export type NavCount = "orders" | "requests" | "support" | "notifications";
export const NAV_GROUPS = ["Үндсэн", "Захиалгууд", "Удирдлага", "Бусад"] as const;
export type NavItem = {
  href: string;
  label: string;
  group: (typeof NAV_GROUPS)[number];
  /** Short label for the bottom tab bar. */
  tabLabel?: string;
  exact?: boolean;
  count?: NavCount;
  /** What the badge counts, for screen readers. */
  countLabel?: string;
  tab?: boolean;
  Icon: LucideIcon;
};

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/english-words", label: "English Words", group: "Удирдлага", Icon: Package },
  { href: "/admin", label: "Хяналтын самбар", group: "Үндсэн", tabLabel: "Самбар", exact: true, tab: true, Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Веб захиалгууд", group: "Захиалгууд", tabLabel: "Захиалга", count: "orders", countLabel: "шинэ захиалга", tab: true, Icon: ClipboardList },
  { href: "/admin/template-requests", label: "Загварын хүсэлтүүд", group: "Захиалгууд", tabLabel: "Хүсэлт", count: "requests", countLabel: "хариу хүлээж буй хүсэлт", tab: true, Icon: Inbox },
  { href: "/admin/templates", label: "Бүтээгдэхүүн", group: "Удирдлага", tabLabel: "Бүтээгдэхүүн", tab: true, Icon: Package },
  { href: "/admin/projects", label: "Веб төслүүд", group: "Удирдлага", Icon: FolderKanban },
  { href: "/admin/ecosystem", label: "AXORA экосистем", group: "Удирдлага", Icon: Layers },
  // Existing modules beyond the main navigation, kept so nothing becomes unreachable.
  { href: "/admin/payments", label: "Төлбөрүүд", group: "Бусад", Icon: CreditCard },
  { href: "/admin/support", label: "Тусламжийн хүсэлтүүд", group: "Бусад", count: "support", countLabel: "шинэ тусламжийн хүсэлт", Icon: LifeBuoy },
  { href: "/admin/marketing", label: "Маркетинг", group: "Бусад", Icon: Megaphone },
  { href: "/admin/notifications", label: "Мэдэгдэл", group: "Бусад", count: "notifications", countLabel: "уншаагүй мэдэгдэл", Icon: Bell },
  { href: "/admin/content", label: "Сайтын агуулга", group: "Бусад", Icon: Layers },
  { href: "/admin/activity", label: "Үйлдлийн түүх", group: "Бусад", Icon: Activity },
  { href: "/admin/settings", label: "Тохиргоо", group: "Бусад", Icon: Settings },
];

export const isActive = (n: NavItem, path: string) => (n.exact ? path === n.href : path === n.href || path.startsWith(n.href + "/"));
