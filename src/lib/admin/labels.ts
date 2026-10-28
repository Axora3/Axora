/** Status vocab shared by admin pages. Colour + text, never colour alone. */

export const ORDER_STATUSES = ["new", "contacted", "in_progress", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS: Record<OrderStatus, { label: string; bg: string; fg: string; bar: string }> = {
  new: { label: "Шинэ", bg: "#E3EDF5", fg: "#1A4F75", bar: "#1F5F8B" },
  contacted: { label: "Холбогдсон", bg: "#F6F0DC", fg: "#6B4F0E", bar: "#C9A227" },
  in_progress: { label: "Хийгдэж байгаа", bg: "#E4EFE6", fg: "#1E5039", bar: "#245C45" },
  completed: { label: "Дууссан", bg: "#EEF6CF", fg: "#3D4A12", bar: "#9DBB2E" },
  cancelled: { label: "Цуцлагдсан", bg: "#EEEEEC", fg: "#55585A", bar: "#A3A7A9" },
};

/**
 * Template-request flow (existing schema). "fulfilled" only records that the
 * admin delivered it by hand — nothing is sent automatically, and no payment
 * status exists because there is no payment system.
 */
export const REQUEST_STATUSES = ["new", "contacted", "fulfilled", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS: Record<RequestStatus, { label: string; hint: string; bg: string; fg: string }> = {
  new: { label: "Шинэ", hint: "Хүсэлт ирсэн, хараахан холбогдоогүй.", bg: "#E3EDF5", fg: "#1A4F75" },
  contacted: { label: "Холбогдсон", hint: "Хэрэглэгчтэй холбогдож, нөхцөлөө тохирч байгаа.", bg: "#F6F0DC", fg: "#6B4F0E" },
  fulfilled: { label: "Хүргэж дууссан", hint: "Та загварыг гараар хүргэсэн гэдгийг тэмдэглэнэ. Файл автоматаар илгээгддэггүй.", bg: "#EEF6CF", fg: "#3D4A12" },
  cancelled: { label: "Цуцлагдсан", hint: "Хүсэлтийг цааш үргэлжлүүлэхгүй.", bg: "#EEEEEC", fg: "#55585A" },
};

export const CHANNEL_LABEL: Record<string, string> = { phone: "Утас", email: "Имэйл", messenger: "Messenger", instagram: "Instagram" };

export const AUDIT_ACTION: Record<string, string> = {
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
