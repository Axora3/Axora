import type { IconName } from "@/components/ui/icon";

/**
 * One navigation config for both the desktop sidebar and the mobile bottom
 * tab bar. `tab` marks the four items shown in the bottom bar (in order);
 * the rest are reachable from the mobile menu.
 */
export type NavCount = "orders" | "requests" | "support" | "notifications";
export type NavItem = {
  href: string;
  label: string;
  group: "Үндсэн" | "Удирдлага" | "Систем";
  /** Short label for the bottom tab bar. */
  tabLabel?: string;
  exact?: boolean;
  count?: NavCount;
  /** What the badge counts, for screen readers. */
  countLabel?: string;
  tab?: boolean;
  icon: IconName;
};

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Хяналтын самбар", group: "Үндсэн", tabLabel: "Самбар", exact: true, tab: true, icon: "layout-grid" },
  { href: "/admin/orders", label: "Веб захиалгууд", group: "Үндсэн", tabLabel: "Захиалга", count: "orders", countLabel: "шинэ захиалга", tab: true, icon: "file-text" },
  { href: "/admin/template-requests", label: "Template хүсэлтүүд", group: "Үндсэн", tabLabel: "Хүсэлт", count: "requests", countLabel: "хариу өгөөгүй шинэ хүсэлт", tab: true, icon: "inbox" },
  { href: "/admin/templates", label: "Бүтээгдэхүүн", group: "Удирдлага", tabLabel: "Бүтээгдэхүүн", tab: true, icon: "cube" },
  { href: "/admin/projects", label: "Веб төслүүд", group: "Удирдлага", icon: "globe" },
  { href: "/admin/payments", label: "Төлбөрүүд", group: "Удирдлага", icon: "credit-card" },
  { href: "/admin/support", label: "Тусламжийн хүсэлтүүд", group: "Удирдлага", count: "support", countLabel: "шинэ тусламжийн хүсэлт", icon: "message" },
  { href: "/admin/marketing", label: "Маркетинг", group: "Удирдлага", icon: "send" },
  { href: "/admin/notifications", label: "Мэдэгдэл", group: "Систем", count: "notifications", countLabel: "уншаагүй мэдэгдэл", icon: "bell" },
  { href: "/admin/content", label: "Сайтын агуулга", group: "Систем", icon: "layers" },
  { href: "/admin/activity", label: "Үйлдлийн түүх", group: "Систем", icon: "activity" },
  { href: "/admin/settings", label: "Тохиргоо", group: "Систем", icon: "settings" },
];

export const isActive = (n: NavItem, path: string) => (n.exact ? path === n.href : path === n.href || path.startsWith(n.href + "/"));
