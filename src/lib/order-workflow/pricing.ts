import type { Answers } from "@/lib/order/questions";
import {
  MAX_MONEY,
  quoteItemSchema,
  pricingPolicySchema,
  type PricingPolicy,
  type QuoteItem,
} from "./contracts";

export function priceItems(raw: unknown, discount = 0) {
  const items = quoteItemSchema
    .array()
    .max(100)
    .parse(raw)
    .map((item) => {
      const total = item.quantity * item.unitPrice;
      if (!Number.isSafeInteger(total) || total > MAX_MONEY)
        throw new Error("Үнийн дүн хязгаараас их байна.");
      return { ...item, total };
    });
  const sum = (billing: string) =>
    items.filter((i) => i.billing === billing).reduce((s, i) => s + i.total, 0);
  const subtotal = sum("one_time"),
    monthlyTotal = sum("monthly"),
    externalTotal = sum("external");
  if (
    [subtotal, monthlyTotal, externalTotal].some(
      (n) => !Number.isSafeInteger(n) || n > MAX_MONEY,
    ) ||
    !Number.isSafeInteger(discount) ||
    discount < 0 ||
    discount > subtotal
  )
    throw new Error("Хөнгөлөлт эсвэл нийт дүн буруу байна.");
  return {
    items,
    subtotal,
    discount,
    total: subtotal - discount,
    monthlyTotal,
    externalTotal,
  };
}

const oldFeatures: Record<string, string> = {
  "Цаг захиалга": "booking",
  "Онлайн захиалга": "online-orders",
  "Админ удирдлага": "admin-dashboard",
  "Google Maps": "location",
  "Шууд залгах товч": "contact-info",
  "Messenger холбоос": "social-links",
  "Instagram холбоос": "social-links",
};
export function generateQuotation(answers: Answers, rawPolicy: PricingPolicy) {
  const policy = pricingPolicySchema.parse(rawPolicy);
  const text = (key: string) =>
    typeof answers[key] === "string" ? answers[key].trim() : "";
  const list = (key: string): string[] =>
    Array.isArray(answers[key]) ? [...new Set(answers[key])] : [];
  const pageText = text("qPages"),
    pages = /^\d{1,4}$/.test(pageText) ? Number(pageText) : null;
  const ids = new Set<string>(),
    reviewFlags: string[] = [], timingFlags: string[] = [];
  for (const value of list("q29")) {
    if (oldFeatures[value]) ids.add(oldFeatures[value]);
    else if (!["Шаардлагагүй", "Онлайн төлбөр", "QR код"].includes(value))
      reviewFlags.push(`“${value}” шаардлагыг админ тодруулна.`);
  }
  for (const value of list("qAddons")) {
    const rule = policy.features.find((f) => f.id === value || f.answerValue === value);
    if (rule) ids.add(rule.id);
    else reviewFlags.push(`“${value}” нэмэлтийн дүрмийг админ шалгана.`);
  }
  if (text("q12") === "Онлайн дэлгүүр") ids.add("product-catalog");
  if (text("q12") === "Цаг захиалга") ids.add("booking");
  if (list("q13").includes("Цаг захиалга авах")) ids.add("booking");
  if (list("q13").includes("Онлайн захиалга авах")) ids.add("online-orders");
  if (text("q12") === "Кафе / QR меню") ids.add("qr-menu");
  if (list("q23").includes("Gallery")) ids.add("gallery");
  if (list("q30").includes("Веб форм")) ids.add("contact-form");
  if (list("q28").length > 1 || list("q28").includes("Бусад"))
    ids.add("multilingual");
  if (list("q29").includes("Онлайн төлбөр") && !ids.has("qpay"))
    reviewFlags.push(
      "Онлайн төлбөрийн үйлчилгээ үзүүлэгчийг тодруулна. QPay гэж автоматаар тооцоогүй.",
    );
  if (list("q29").includes("QR код") && !ids.has("qr-menu"))
    reviewFlags.push(
      "QR кодын зорилгыг тодруулна; QR менюгийн төлбөр автоматаар нэмээгүй.",
    );
  if (text("q12") === "Бусад" || text("q37"))
    reviewFlags.push("Тусгай шаардлагыг админ нягтална.");
  if (!pages || pages > 1000)
    reviewFlags.push(
      "Нийт хуудасны тоог тодруулна. Хэсгүүдийг хуудас гэж давхар тооцоогүй.",
    );
  if (!policy.enabled) reviewFlags.push("Үнийн дүрэм идэвхгүй байна.");
  const sorted = [...policy.packages].sort(
    (a, b) => a.includedPages - b.includedPages,
  );
  const explicit = policy.packages.find(
    (p) =>
      p.id.toLowerCase() === text("qPackage").toLowerCase() ||
      p.label === text("qPackage"),
  );
  const selected =
    explicit ??
    (pages && pages <= 1000
      ? (sorted.find((p) => p.includedPages >= pages) ?? sorted.at(-1))
      : undefined);
  if (!selected) reviewFlags.push("Үндсэн багцыг админ сонгоно.");
  const items: QuoteItem[] = [];
  let effortDays: number | null = selected?.maxDays ?? null,
    additionalPages: number | null = null;
  const add = (
    kind: QuoteItem["kind"],
    code: string,
    label: string,
    quantity: number,
    unitPrice: number,
    billing: QuoteItem["billing"] = "one_time",
  ) => items.push({ kind, code, label, quantity, unitPrice, billing });
  if (selected && policy.enabled) {
    add("base_package", selected.id, selected.label, 1, selected.basePrice);
    if (pages && pages <= 1000) {
      additionalPages = Math.max(0, pages - selected.includedPages);
      if (additionalPages) {
        add(
          "additional_pages",
          "additional-pages",
          "Багцаас нэмэлт хуудас",
          additionalPages,
          policy.additionalPagePrice,
        );
        if (effortDays !== null)
          effortDays += additionalPages * policy.additionalPageDays;
      }
    }
    for (const id of ids) {
      if (selected.includedFeatures.includes(id)) continue;
      const rule = policy.features.find((f) => f.id === id);
      if (!rule) {
        reviewFlags.push(
          `“${id}” боломжийн ажлын хүрээ, үнийг админ тодруулна.`,
        );
        continue;
      }
      add("feature", rule.id, rule.label, 1, rule.unitPrice);
      if (effortDays !== null) effortDays += rule.durationDays;
    }
    const revisions = text("qExtraRevs") ? Number(text("qExtraRevs")) : 0;
    if (!Number.isInteger(revisions) || revisions < 0 || revisions > 100)
      reviewFlags.push("Нэмэлт засварын тоо буруу байна.");
    else if (revisions) {
      add(
        "feature",
        "extra-revisions",
        "Багцаас нэмэлт засвар",
        revisions,
        policy.extraRevisionPrice,
      );
      if (policy.extraRevisionDays === null) {
        effortDays = null;
        timingFlags.push("Нэмэлт засварын хугацааг админ тодруулна.");
      } else if (effortDays !== null)
        effortDays += revisions * policy.extraRevisionDays;
    }
    if (text("qUrgent") === "Тийм") {
      const base = priceItems(items).subtotal;
      add(
        "rush",
        "rush",
        "Яаралтай хөгжүүлэлтийн нэмэгдэл",
        1,
        Math.round((base * policy.rushPercent) / 100),
      );
      timingFlags.push(
        "Яаралтай хөгжүүлэлтийн хугацааг админ тусад нь батална.",
      );
    }
    if (text("qMaintenance") === "Тийм")
      add(
        "maintenance",
        "maintenance",
        "Сарын үйлчилгээ, арчилгаа",
        1,
        policy.monthlyMaintenancePrice,
        "monthly",
      );
  }
  const subtotal = priceItems(items).subtotal,
    calculated = priceItems(
      items,
      Math.round((subtotal * policy.discountPercent) / 100),
    );
  const requirements = {
    websiteType: text("q12"),
    style: text("q19"),
    pages,
    sections: list("q23"),
    features: [...ids],
    languages: list("q28"),
    includedPages: selected?.includedPages ?? null,
    additionalPages,
    includedRevisions: selected?.includedRevisions ?? null,
    urgent: text("qUrgent") === "Тийм",
    timingFlags,
    externalCosts:
      "Домэйн, hosting, гуравдагч талын үйлчилгээний зардал нэг удаагийн хөгжүүлэлтийн төлбөрт ороогүй. Админ тусад нь нягтална.",
  };
  return {
    pricingVersion: policy.enabled ? policy.version : null,
    packageLabel: selected?.label ?? null,
    requirements,
    items: calculated.items,
    subtotal: calculated.subtotal,
    discount: calculated.discount,
    total: reviewFlags.length || !calculated.total ? null : calculated.total,
    monthlyTotal: calculated.monthlyTotal,
    externalTotal: calculated.externalTotal,
    reviewFlags: [...new Set(reviewFlags)],
    effortDays,
  };
}
