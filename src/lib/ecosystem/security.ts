import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { IntegrationError } from "./contracts";
export function secureEqual(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function endpoint(name: string) {
  const value = process.env[name];
  if (!value) throw new IntegrationError("integration_unconfigured");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new IntegrationError("invalid_service_endpoint");
  }
  const local =
    process.env.AXORA_INTEGRATION_LOCAL_TEST === "1" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !local) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new IntegrationError("invalid_service_endpoint");
  return value.replace(/\/$/, "");
}
export async function readResponse(response: Response, max = 2000000) {
  const reader = response.body?.getReader();
  if (!reader) throw new IntegrationError("empty_service_response");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > max) {
      await reader.cancel();
      throw new IntegrationError("service_response_too_large");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString()) as unknown;
  } catch {
    throw new IntegrationError("invalid_service_response");
  }
}
export function signatureValid(
  raw: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
  now = Date.now(),
) {
  if (
    secret.length < 32 ||
    !timestamp ||
    !/^\d{10,13}$/.test(timestamp) ||
    !signature ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return false;
  const ms =
    timestamp.length === 10 ? Number(timestamp) * 1000 : Number(timestamp);
  if (Math.abs(now - ms) > 300000) return false;
  return secureEqual(
    createHmac("sha256", secret)
      .update(timestamp + "." + raw)
      .digest("hex"),
    signature,
  );
}
export function safeCode(error: unknown) {
  return error instanceof IntegrationError
    ? error.code
    : "integration_operation_failed";
}
export function safeDiagnostic(value: string) {
  let text = value.replace(/Bearer\s+\S+|\bsk-[A-Za-z0-9_-]+/gi, "[redacted]");
  for (const [name, secret] of Object.entries(process.env))
    if (/TOKEN|SECRET|KEY|PASSWORD/.test(name) && secret && secret.length > 8)
      text = text.split(secret).join("[redacted]");
  return text.slice(0, 2000);
}

export function assertNoSecrets(value: unknown) {
  const text = JSON.stringify(value);
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----|\bsk-[A-Za-z0-9_-]{24,}/.test(text))
    throw new IntegrationError("private_material_rejected", 422);
  for (const [name, secret] of Object.entries(process.env))
    if (
      /TOKEN|SECRET|PRIVATE_KEY|SERVICE_ROLE|PASSWORD/.test(name) &&
      secret &&
      secret.length >= 16 &&
      text.includes(secret)
    )
      throw new IntegrationError("private_material_rejected", 422);
  for (const token of text.match(
    /[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  ) ?? []) {
    try {
      if (
        JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString())
          .role === "service_role"
      )
        throw new IntegrationError("private_material_rejected", 422);
    } catch (e) {
      if (e instanceof IntegrationError) throw e;
    }
  }
}
