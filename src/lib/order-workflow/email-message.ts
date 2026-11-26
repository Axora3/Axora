import { workflowTime } from "./display";
export type OrderEmailPayload = {
  to: string;
  name: string;
  reference: string;
  amount: number | null;
  deadline: string | null;
  trackingPath: string;
  deliveryUrl: string | null;
  notes: string;
  paymentNote?: string;
  projectStatus?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  effortDays?: number | null;
};
const labels: Record<string, string> = {
  quote_sent: "Үнийн санал бэлэн боллоо",
  payment_verified: "Таны төлбөр баталгаажлаа",
  development_started: "Таны веб сайтын хөгжүүлэлт эхэллээ",
  development_completed: "Таны веб сайт бэлэн боллоо",
  delivered: "Веб сайтыг хүлээлгэн өглөө",
  deadline_changed: "Дуусах хугацаа шинэчлэгдлээ",
};
const statuses: Record<string, string> = {
  planning: "Хөгжүүлэлт эхлэхээр хүлээгдэж байна",
  in_progress: "Хөгжүүлэлт үргэлжилж байна",
  review: "Хяналтад",
  completed: "Веб сайт бэлэн болсон",
  cancelled: "Цуцалсан",
};
export function buildOrderEmail(
  event: string,
  p: OrderEmailPayload,
  origin: string,
) {
  const label = labels[event] ?? "Захиалгын мэдээлэл";
  return {
    subject: `AXORA — ${label}`,
    text: [
      `Сайн байна уу, ${p.name} аа.`,
      "",
      label,
      event === 'payment_verified' ? 'Таны AXORA-д өгсөн веб хөгжүүлэлтийн захиалгын төлбөр амжилттай баталгаажлаа.\nМанай үйлчилгээг сонгосонд баярлалаа.' : '',
      `Захиалгын дугаар: ${p.reference}`,
      p.amount != null
        ? `${event === "payment_verified" ? "Баталгаажсан төлбөр" : "Нэг удаагийн хөгжүүлэлт"}: ${p.amount.toLocaleString("mn-MN")}₮`
        : "",
      `Төслийн төлөв: ${statuses[p.projectStatus ?? ""] ?? "Хяналтад"}`,
      p.deadline
        ? `Баталсан дуусах огноо: ${p.deadline} (Asia/Ulaanbaatar)`
        : "",
      p.effortDays != null
        ? `Тооцоолсон хөгжүүлэлтийн хугацаа: ${p.effortDays} ажлын өдөр`
        : "",
      p.startedAt ? `Ажил эхэлсэн: ${workflowTime(p.startedAt)}` : "",
      p.completedAt ? `Хөгжүүлэлт дууссан: ${workflowTime(p.completedAt)}` : "",
      p.deliveryUrl ? `Веб сайт: ${p.deliveryUrl}` : "",
      p.paymentNote ? `Админы тайлбар: ${p.paymentNote}` : "",
      p.notes ?? "",
      "",
      "Үнийн задаргаа, сарын болон бусад зардал, явцыг хувийн холбоосоор шалгана уу:",
      new URL(p.trackingPath, origin).toString(),
      "",
      "AXORA-г сонгосонд баярлалаа.",
      "",
      "Хүндэтгэсэн,",
      "AXORA баг",
    ]
      .filter((v, i, a) => v !== "" || a[i - 1] !== "")
      .join("\n"),
  };
}
