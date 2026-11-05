import "server-only";
import nodemailer from "nodemailer";

export const isEmailConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);

/**
 * Emails a purchased template's download link over SMTP. Gmail by default;
 * any provider works by setting SMTP_HOST. Returns whether the server accepted
 * it. The link is a secret, so neither it nor the provider's reply is logged.
 */
export async function sendDownloadEmail({ to, name, title, url, expiresAt }: { to: string; name: string; title: string; url: string; expiresAt: string | null }): Promise<boolean> {
  const until = expiresAt ? new Date(expiresAt).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" }) : null;
  const expiry = until ? `Татах эрхийн хүчинтэй хугацаа: ${until} (Улаанбаатарын цагаар).` : "";
  const user = process.env.SMTP_USER!;
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass: process.env.SMTP_PASSWORD },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
    const info = await transport.sendMail({
      // Gmail only delivers reliably as the signed-in address, so EMAIL_FROM needs a custom SMTP_HOST.
      from: (process.env.SMTP_HOST && process.env.EMAIL_FROM) || `AXORA <${user}>`,
      to,
      subject: `AXORA | ${title} — худалдан авалтын баталгаажуулалт`,
      // Plain text delivery was verified in the recipient's Inbox.
      text: `Эрхэм ${name} Танд энэ өдрийн мэнд хүргэе.\n\nAXORA-г сонгон үйлчлүүлсэн Танд баярлалаа. Таны “${title}” загварын төлбөр амжилттай баталгаажлаа.\n\nЗАГВАРАА ТАТАХ\nДоорх холбоосыг нээгээд “Файлаа нэг удаа татах” товчийг дарна уу:\n${url}\n\nЭнэхүү холбоосоор файлаа нэг удаа татах боломжтой. Админ шинэ холбоос илгээвэл нэг удаагийн татах эрх шинээр нээгдэж, өмнөх холбоос хүчингүй болно. Холбоосыг нээхэд эрх ашиглагдахгүй; татах товчийг дарж, сервер файлыг олгоход эрх ашиглагдана. Татсан файлаа төхөөрөмждөө хадгалж, холбоосоо бусдад дамжуулахгүй байхыг хүсье.\n\n${expiry}\n\nФайл татахад хүндрэл гарсан эсвэл хугацаа дууссан бол энэ имэйлд хариу бичиж бидэнтэй холбогдоно уу.\n\nХүндэтгэсэн,\nAXORA баг`,
    });
    // No addresses or links here; this is enough to tell "accepted" from "rejected".
    console.log("[email] server reply:", { accepted: info.accepted.length, rejected: info.rejected.length });
    return info.accepted.length > 0;
  } catch (e) {
    console.error("[email] send failed:", (e as { code?: string }).code ?? "unknown");
    return false;
  }
}
