import "server-only";
import nodemailer from "nodemailer";

export const isEmailConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails a purchased template's download link over SMTP. Gmail by default;
 * any provider works by setting SMTP_HOST. Returns whether the server accepted
 * it. The link is a secret, so neither it nor the provider's reply is logged.
 */
export async function sendDownloadEmail({ to, name, title, url, expiresAt }: { to: string; name: string; title: string; url: string; expiresAt: string | null }): Promise<boolean> {
  const until = expiresAt ? new Date(expiresAt).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" }) : null;
  const expiry = until ? `Холбоос ${until} хүртэл хүчинтэй. Хугацаа дуусвал бидэнтэй холбогдоорой.` : "";
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
      subject: `${title} — татах холбоос`,
      text: `Сайн байна уу, ${name}.\n\nТөлбөр тань баталгаажлаа. “${title}” загвараа доорх холбоосоор авна уу:\n${url}\n\n${expiry}\n\nAXORA`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#17251e">
  <p>Сайн байна уу, ${escapeHtml(name)}.</p>
  <p>Төлбөр тань баталгаажлаа. <strong>${escapeHtml(title)}</strong> загвараа доорх товчоор авна уу.</p>
  <p><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#245c45;color:#ffffff;font-weight:700;text-decoration:none">Загвараа авах</a></p>
  <p style="color:#56645b;font-size:13px">${escapeHtml(expiry)}</p>
  <p style="color:#56645b;font-size:13px">AXORA</p>
</div>`,
    });
    // No addresses or links here; this is enough to tell "accepted" from "rejected".
    console.log("[email] server reply:", { accepted: info.accepted.length, rejected: info.rejected.length, response: info.response });
    return info.accepted.length > 0;
  } catch (e) {
    console.error("[email] send failed:", (e as { code?: string }).code ?? "unknown");
    return false;
  }
}
