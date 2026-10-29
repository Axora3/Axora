import type { OrderStatus, PaymentStatus, RequestStatus } from "./labels";

/**
 * Allowed status changes — the same rules are enforced again by database
 * triggers (supabase/migrations/20261029000000_payments_delivery_guards.sql),
 * so the UI can only make the safe choices easier, never bypass them.
 * Every allowed change can be undone by the reverse change.
 */

export function canOrderTransition(from: string, to: OrderStatus): boolean {
  if (from === to) return false;
  if (to === "completed") return from === "in_progress";
  if (from === "completed") return to === "in_progress";
  return true;
}

export function orderTransitionHint(from: string, to: OrderStatus): string | null {
  if (canOrderTransition(from, to) || from === to) return null;
  if (to === "completed") return "Эхлээд “Хийгдэж байгаа” болгоно.";
  if (from === "completed") return "Дууссан захиалгыг зөвхөн “Хийгдэж байгаа” руу буцаана.";
  return null;
}

export const PAYMENT_DONE: readonly PaymentStatus[] = ["not_required", "confirmed_manual"];

export function canRequestTransition(from: string, to: RequestStatus, payment: string): boolean {
  if (from === to) return false;
  if (to === "fulfilled") return from === "contacted" && (PAYMENT_DONE as readonly string[]).includes(payment);
  if (from === "fulfilled") return to === "contacted";
  return true;
}

export function requestTransitionHint(from: string, to: RequestStatus, payment: string): string | null {
  if (from === to || canRequestTransition(from, to, payment)) return null;
  if (to === "fulfilled" && !(PAYMENT_DONE as readonly string[]).includes(payment)) return "Төлбөр баталгаажаагүй байна.";
  if (to === "fulfilled") return "Эхлээд “Холбогдсон” болгоно.";
  if (from === "fulfilled") return "Хүргэсэн хүсэлтийг зөвхөн “Холбогдсон” руу буцаана.";
  return null;
}
