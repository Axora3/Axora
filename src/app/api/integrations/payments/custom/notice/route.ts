import { rateLimit, canonical } from "@/lib/server/http";
import { isBackendConfigured } from "@/lib/supabase/server";
import { PaymentNotice, IntegrationError } from "@/lib/ecosystem/contracts";
import { signatureValid, hash } from "@/lib/ecosystem/security";
import { VerifiedPaymentProvider } from "@/lib/ecosystem/connections";
import { checked } from "@/lib/ecosystem/processor";
import { failure, serviceDb } from "@/lib/ecosystem/http";
export async function POST(request: Request) {
  try {
    if (!isBackendConfigured())
      throw new IntegrationError("backend_unconfigured");
    const reader = request.body?.getReader();
    if (!reader) throw new IntegrationError("invalid_body", 400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16000) {
        await reader.cancel();
        throw new IntegrationError("payload_too_large", 413);
      }
      chunks.push(value);
    }
    const raw = Buffer.concat(chunks).toString();
    if (
      !signatureValid(
        raw,
        request.headers.get("x-provider-timestamp"),
        request.headers.get("x-provider-signature"),
        process.env.AXORA_PAYMENT_WEBHOOK_SECRET || "",
      )
    )
      throw new IntegrationError("invalid_provider_signature", 401);
    const notice = PaymentNotice.parse(JSON.parse(raw));
    const db = serviceDb();
    const processed = checked(
      await db
        .from("ecosystem_provider_events")
        .select("payload_hash")
        .eq("provider", "custom_http")
        .eq("event_id", notice.event_id)
        .maybeSingle(),
    );
    if (processed) {
      if (processed.payload_hash !== hash(canonical(notice)))
        throw new IntegrationError("provider_event_conflict", 409);
      return Response.json(
        { ok: true, settled: true, duplicate: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!(await rateLimit(request, "ecosystem-payment-notice", 120, 60)))
      throw new IntegrationError("rate_limited", 429);
    const payment = await new VerifiedPaymentProvider().verify(
      notice.payment_id,
    );
    if (payment.status !== "paid")
      return Response.json(
        { ok: true, settled: false, status: payment.status },
        { headers: { "Cache-Control": "no-store" } },
      );
    const invoice = checked(
      await db
        .from("ecosystem_invoices")
        .select("id,amount,currency")
        .eq("provider", "custom_http")
        .eq("provider_invoice_id", payment.invoice_reference)
        .single(),
    );
    if (
      !invoice ||
      payment.amount !== invoice.amount ||
      payment.currency !== invoice.currency
    )
      throw new IntegrationError("payment_invoice_binding_invalid", 409);
    const result = checked(
      await db.rpc("ecosystem_settle", {
        p_invoice: invoice.id,
        p_event: notice.event_id,
        p_hash: hash(canonical(notice)),
        p_payment: payment,
      }),
    );
    return Response.json(
      { ok: true, settled: true, result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
