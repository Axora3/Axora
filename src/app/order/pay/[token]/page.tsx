import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { OrderPayment } from "@/components/order/OrderPayment";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSiteContent } from "@/lib/content/service";
import { isPaymentToken } from "@/lib/order/payment";
import { adminClient, isBackendConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Төлбөр", robots: { index: false, follow: false } };

/**
 * The private page behind an admin's payment link. It reads with the server key,
 * finds the order only by its random token, and selects only what the customer
 * needs, so phone, email and answers never reach this page.
 */
async function PaymentContent({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  if (!isBackendConfigured() || !isPaymentToken(token)) notFound();
  const { data: order, error } = await adminClient().from("website_orders").select("reference, business_name, quote_amount, payment_status").eq("payment_token", token).maybeSingle();
  if (error) console.error("[payment] lookup failed:", error.code);
  if (!order || order.quote_amount == null) notFound();
  const { bank } = await getSiteContent();
  return <OrderPayment reference={order.reference} business={order.business_name} amount={Number(order.quote_amount)} paid={order.payment_status === "paid"} bank={bank} />;
}

export default function PaymentPage(props: { params: Promise<{ token: string }> }) {
  return (
    <>
      <SiteHeader variant="compact" label="Төлбөр" back={{ href: "/", label: "Нүүр" }} />
      <main id="main" className="ax-container pt-[clamp(24px,4vw,48px)] pb-24">
        <Suspense fallback={<div aria-busy="true" aria-label="Ачаалж байна" className="ax-sk h-80 rounded-card" />}>
          <PaymentContent {...props} />
        </Suspense>
      </main>
    </>
  );
}
