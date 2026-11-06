import { Activity, Bell, ClipboardList, CreditCard, FolderKanban, Inbox, Layers, LayoutDashboard, LifeBuoy, Megaphone, Package, Settings, type LucideIcon } from "lucide-react";

/**
 * One navigation config for both the desktop sidebar and the mobile bottom
 * tab bar. `tab` marks the four items shown in the bottom bar (in order);
 * the rest are reachable from the mobile menu.
 */
export type NavCount = "orders" | "requests" | "support" | "notifications";
export const NAV_GROUPS = ["ҮНДСЭН", "ЗАХИАЛГУУД", "УДИРДЛАГА", "БУСАД"] as const;
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
  { href: "/admin", label: "Хяналтын самбар", group: "ҮНДСЭН", tabLabel: "Самбар", exact: true, tab: true, Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Веб захиалгууд", group: "ЗАХИАЛГУУД", tabLabel: "Захиалга", count: "orders", countLabel: "шинэ захиалга", tab: true, Icon: ClipboardList },
  { href: "/admin/template-requests", label: "Template хүсэлтүүд", group: "ЗАХИАЛГУУД", tabLabel: "Хүсэлт", count: "requests", countLabel: "хариу хүлээж буй хүсэлт", tab: true, Icon: Inbox },
  { href: "/admin/templates", label: "Бүтээгдэхүүн", group: "УДИРДЛАГА", tabLabel: "Бүтээгдэхүүн", tab: true, Icon: Package },
  { href: "/admin/projects", label: "Веб төслүүд", group: "УДИРДЛАГА", Icon: FolderKanban },
  // Existing modules beyond the main navigation, kept so nothing becomes unreachable.
  { href: "/admin/payments", label: "Төлбөрүүд", group: "БУСАД", Icon: CreditCard },
  { href: "/admin/support", label: "Тусламжийн хүсэлтүүд", group: "БУСАД", count: "support", countLabel: "шинэ тусламжийн хүсэлт", Icon: LifeBuoy },
  { href: "/admin/marketing", label: "Маркетинг", group: "БУСАД", Icon: Megaphone },
  { href: "/admin/notifications", label: "Мэдэгдэл", group: "БУСАД", count: "notifications", countLabel: "уншаагүй мэдэгдэл", Icon: Bell },
  { href: "/admin/content", label: "Сайтын агуулга", group: "БУСАД", Icon: Layers },
  { href: "/admin/activity", label: "Үйлдлийн түүх", group: "БУСАД", Icon: Activity },
  { href: "/admin/settings", label: "Тохиргоо", group: "БУСАД", Icon: Settings },
];

export const isActive = (n: NavItem, path: string) => (n.exact ? path === n.href : path === n.href || path.startsWith(n.href + "/"));
