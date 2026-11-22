export const PLANS = {
  monthly: { amount: 20000, months: 1 },
  annual: { amount: 228000, months: 12 },
} as const;
export const TRIAL_DAYS = 30;
export function trialEnd(confirmedDelivery: string | null) {
  return confirmedDelivery
    ? new Date(
        Date.parse(confirmedDelivery) + TRIAL_DAYS * 86400000,
      ).toISOString()
    : null;
}
export function addMonthsUtc(timestamp: string, months: number) {
  const d = new Date(timestamp),
    day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString();
}
export interface Subscription {
  site_id: string;
  confirmed_delivery_at: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  current_period_start: string | null;
  plan_id: "monthly" | "annual" | null;
  cancel_at_period_end: boolean;
  auto_suspend: boolean;
  grace_days: number;
  status: string;
}
export function subscriptionState(s: Subscription, now = Date.now()) {
  if (!s.confirmed_delivery_at)
    return {
      status: "awaiting_delivery",
      nextBillingAt: null,
      coverageEnd: null,
      writesSuspended: false,
    };
  const end = s.current_period_end || s.trial_ends_at!;
  if (!end) throw new Error("delivery_trial_invariant");
  const expired = now >= Date.parse(end);
  const status = expired
    ? s.cancel_at_period_end
      ? "cancelled"
      : s.auto_suspend && now >= Date.parse(end) + s.grace_days * 86400000
        ? "suspended"
        : "past_due"
    : now < Date.parse(s.trial_ends_at!)
      ? "trial"
      : "active";
  return {
    status,
    nextBillingAt: s.cancel_at_period_end ? null : end,
    coverageEnd: end,
    writesSuspended:
      expired &&
      s.auto_suspend &&
      now >= Date.parse(end) + s.grace_days * 86400000,
  };
}
