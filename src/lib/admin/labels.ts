/** Status vocab shared by admin pages. Colour + text, never colour alone. */

export const ORDER_STATUSES = ["new", "contacted", "in_progress", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS: Record<OrderStatus, { label: string; bg: string; fg: string; bar: string }> = {
  new: { label: "Шинэ", bg: "var(--ax-info-bg)", fg: "var(--ax-info)", bar: "var(--ax-info-bar)" },
  contacted: { label: "Холбогдсон", bg: "var(--ax-warn-bg)", fg: "var(--ax-warn)", bar: "var(--ax-warn-bar)" },
  in_progress: { label: "Хийгдэж байгаа", bg: "var(--ax-success-bg)", fg: "var(--ax-success)", bar: "var(--ax-success-bar)" },
  completed: { label: "Дууссан", bg: "var(--ax-done-bg)", fg: "var(--ax-done)", bar: "var(--ax-done-bar)" },
  cancelled: { label: "Цуцлагдсан", bg: "var(--ax-neutral-bg)", fg: "var(--ax-neutral)", bar: "var(--ax-neutral-bar)" },
};

/**
 * Template-request flow (existing schema). "fulfilled" only records that the
 * admin delivered it by hand — nothing is sent automatically, and no payment
 * status exists because there is no payment system.
 */
export const REQUEST_STATUSES = ["new", "contacted", "fulfilled", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS: Record<RequestStatus, { label: string; hint: string; bg: string; fg: string }> = {
  new: { label: "Шинэ", hint: "Хүсэлт ирсэн, хараахан холбогдоогүй.", bg: "var(--ax-info-bg)", fg: "var(--ax-info)" },
  contacted: { label: "Холбогдсон", hint: "Хэрэглэгчтэй холбогдож, нөхцөлөө тохирч байгаа.", bg: "var(--ax-warn-bg)", fg: "var(--ax-warn)" },
  fulfilled: { label: "Хүргэж дууссан", hint: "Та загварыг гараар хүргэсэн гэдгийг тэмдэглэнэ. Файл автоматаар илгээгддэггүй.", bg: "var(--ax-done-bg)", fg: "var(--ax-done)" },
  cancelled: { label: "Цуцлагдсан", hint: "Хүсэлтийг цааш үргэлжлүүлэхгүй.", bg: "var(--ax-neutral-bg)", fg: "var(--ax-neutral)" },
};

/**
 * Payment is tracked apart from the request status. "confirmed_manual" only
 * means an admin confirmed it by hand — no bank or gateway checked it.
 */
export const PAYMENT_STATUSES = ["not_required", "pending", "needs_review", "confirmed_manual"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; bg: string; fg: string; icon: string }> = {
  not_required: { label: "Үнэгүй", bg: "var(--ax-neutral-bg)", fg: "var(--ax-neutral)", icon: "—" },
  pending: { label: "Төлбөр хүлээгдэж байна", bg: "var(--ax-warn-bg)", fg: "var(--ax-warn)", icon: "…" },
  needs_review: { label: "Баталгаажуулах шаардлагатай", bg: "var(--ax-danger-bg)", fg: "var(--ax-danger)", icon: "!" },
  confirmed_manual: { label: "Төлбөр гараар баталгаажсан", bg: "var(--ax-success-bg)", fg: "var(--ax-success)", icon: "✓" },
};

/** Creating or copying a link is not sending it, and not a download. */
export const DELIVERY_STATUS: Record<string, string> = {
  not_sent: "Хүргэх холбоос үүсгээгүй",
  link_created: "Холбоос үүсгэсэн (илгээсэн эсэх тодорхойгүй)",
  delivered: "Хүргэсэн гэж тэмдэглэсэн",
};

export const CHANNEL_LABEL: Record<string, string> = { phone: "Утас", email: "Имэйл", messenger: "Messenger", instagram: "Instagram" };

export const AUDIT_ACTION: Record<string, string> = {
  payment_confirmed: "Төлбөр гараар баталгаажуулсан",
  status_changed: "Төлөв өөрчилсөн",
  dates_changed: "Огноо шинэчилсэн",
  note_added: "Тэмдэглэл нэмсэн",
  created: "Үүсгэсэн",
  updated: "Засварласан",
  published: "Нийтэлсэн",
  unpublished: "Нийтлэлээс буулгасан",
  draft_saved: "Ноорог хадгалсан",
  download_link_created: "Татах холбоос үүсгэсэн",
};

export const AUDIT_ENTITY: Record<string, string> = {
  order: "Веб захиалга",
  template_request: "Загварын хүсэлт",
  template: "Загвар",
  site_content: "Сайтын агуулга",
};

export function statusLabel(entity: string, s: string | null | undefined): string {
  if (!s) return "—";
  if (entity === "template_request") return REQUEST_STATUS[s as RequestStatus]?.label ?? s;
  return ORDER_STATUS[s as OrderStatus]?.label ?? s;
}

const TZ = "Asia/Ulaanbaatar";
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("mn-MN", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("mn-MN", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso.length === 10 ? iso + "T00:00:00+08:00" : iso));
}
export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/** "3 цагийн өмнө" — coarse age of a timestamp, for list cards. */
export function fmtAgo(iso: string, nowMs: number = Date.now()): string {
  const min = Math.max(0, Math.floor((nowMs - Date.parse(iso)) / 60000));
  if (min < 1) return "Дөнгөж сая";
  if (min < 60) return `${min} минутын өмнө`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} цагийн өмнө`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} хоногийн өмнө`;
  return fmtDate(iso);
}

export function hoursSince(iso: string, nowMs: number = Date.now()): number {
  return (nowMs - Date.parse(iso)) / 3600000;
}
