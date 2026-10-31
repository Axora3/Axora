import { Box, Chat, Clock, Dashboard, File, Form, Gear, Globe, Inbox, Pages } from "@/components/icons";

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
  Icon: typeof Box;
};

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Хяналтын самбар", group: "Үндсэн", tabLabel: "Самбар", exact: true, tab: true, Icon: Dashboard },
  { href: "/admin/orders", label: "Веб захиалгууд", group: "Үндсэн", tabLabel: "Захиалга", count: "orders", countLabel: "шинэ захиалга", tab: true, Icon: Form },
  { href: "/admin/template-requests", label: "Template хүсэлтүүд", group: "Үндсэн", tabLabel: "Хүсэлт", count: "requests", countLabel: "хариу өгөөгүй шинэ хүсэлт", tab: true, Icon: Inbox },
  { href: "/admin/templates", label: "Бүтээгдэхүүн", group: "Удирдлага", tabLabel: "Бүтээгдэхүүн", tab: true, Icon: Box },
  { href: "/admin/projects", label: "Веб төслүүд", group: "Удирдлага", Icon: Globe },
  { href: "/admin/payments", label: "Төлбөрүүд", group: "Удирдлага", Icon: File },
  { href: "/admin/support", label: "Тусламжийн хүсэлтүүд", group: "Удирдлага", count: "support", countLabel: "шинэ тусламжийн хүсэлт", Icon: Chat },
  { href: "/admin/marketing", label: "Маркетинг", group: "Удирдлага", Icon: Pages },
  { href: "/admin/notifications", label: "Мэдэгдэл", group: "Систем", count: "notifications", countLabel: "уншаагүй мэдэгдэл", Icon: Inbox },
  { href: "/admin/content", label: "Сайтын агуулга", group: "Систем", Icon: Pages },
  { href: "/admin/activity", label: "Үйлдлийн түүх", group: "Систем", Icon: Clock },
  { href: "/admin/settings", label: "Тохиргоо", group: "Систем", Icon: Gear },
];

export const isActive = (n: NavItem, path: string) => (n.exact ? path === n.href : path === n.href || path.startsWith(n.href + "/"));
