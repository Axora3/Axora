import { Box, Dashboard, Form, Gear, Inbox, Pages, Clock } from "@/components/icons";

/**
 * One navigation config for both the desktop sidebar and the mobile bottom
 * tab bar. `tab` marks the four items shown in the bottom bar (in order);
 * the rest are reachable from the mobile menu.
 */
export type NavCount = "orders" | "requests";
export type NavItem = {
  href: string;
  label: string;
  /** Short label for the bottom tab bar. */
  tabLabel?: string;
  exact?: boolean;
  count?: NavCount;
  /** What the badge counts, for screen readers. */
  countLabel?: string;
  tab?: boolean;
  Icon: typeof Box;
};

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Хяналтын самбар", tabLabel: "Самбар", exact: true, tab: true, Icon: Dashboard },
  { href: "/admin/orders", label: "Веб захиалгууд", tabLabel: "Захиалга", count: "orders", countLabel: "шинэ захиалга", tab: true, Icon: Form },
  { href: "/admin/template-requests", label: "Template хүсэлтүүд", tabLabel: "Хүсэлт", count: "requests", countLabel: "хариу өгөөгүй шинэ хүсэлт", tab: true, Icon: Inbox },
  { href: "/admin/templates", label: "Бүтээгдэхүүн", tabLabel: "Бүтээгдэхүүн", tab: true, Icon: Box },
  { href: "/admin/content", label: "Сайтын агуулга", Icon: Pages },
  { href: "/admin/activity", label: "Үйлдлийн түүх", Icon: Clock },
  { href: "/admin/settings", label: "Тохиргоо", Icon: Gear },
];

export const isActive = (n: NavItem, path: string) => (n.exact ? path === n.href : path === n.href || path.startsWith(n.href + "/"));
