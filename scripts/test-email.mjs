#!/usr/bin/env node
/**
 * Sends one test message over SMTP to check the email settings.
 * Only reads the database, to find the address, and prints no passwords.
 *
 *   npm run test:email                  the latest template purchase's address
 *   npm run test:email -- you@example.com
 */
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_USER: user, SMTP_PASSWORD: pass, EMAIL_FROM, NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;

async function latestPurchaseEmail() {
  if (!url || !serviceKey) return null;
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data } = await db.from("template_requests").select("contact_value").eq("contact_channel", "email").order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data?.contact_value ?? null;
}

const to = process.argv[2] ?? (await latestPurchaseEmail());

if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
  console.error("Имэйл хаяг олдсонгүй. Ингэж зааж өгнө үү: npm run test:email -- you@example.com");
  process.exit(1);
}
if (!user || !pass) {
  console.error(`.env.local файлд дутуу: ${[!user && "SMTP_USER", !pass && "SMTP_PASSWORD"].filter(Boolean).join(", ")}`);
  process.exit(1);
}

try {
  const from = (SMTP_HOST && EMAIL_FROM) || `AXORA <${user}>`;
  const info = await nodemailer
    .createTransport({ host: SMTP_HOST || "smtp.gmail.com", port: 465, secure: true, auth: { user, pass }, connectionTimeout: 10000, socketTimeout: 15000 })
    .sendMail({ from, to, subject: "AXORA имэйлийн туршилт", text: "Энэ захидал ирсэн бол имэйлийн тохиргоо зөв байна." });
  console.log(`Сервер хүлээн авлаа: ${info.accepted.join(", ") || "хэн ч биш"}. Илгээгч: ${from}`);
  console.log(`${to} хаягаа шалгана уу (Spam хавтсыг ч үзээрэй).`);
} catch (e) {
  const hint = e.code === "EAUTH" ? "Gmail хаяг эсвэл App Password буруу байна." : e.code === "ESOCKET" || e.code === "ETIMEDOUT" || e.code === "ECONNECTION" ? "Сервертэй холбогдож чадсангүй. Интернэтээ шалгана уу." : "Илгээж чадсангүй.";
  console.error(`Алдаа (${e.code ?? "unknown"}): ${hint}`);
  process.exit(1);
}
