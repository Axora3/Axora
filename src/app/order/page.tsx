import type { Metadata } from "next";
import { OrderForm } from "@/components/order/OrderForm";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSiteContent } from "@/lib/content/service";
import { isBackendConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Веб захиалгын анкет",
  description: "39 асуулт, 7 алхамтай веб захиалгын анкет. Live demo-ийн тохиргоо автоматаар бөглөгдөнө.",
  robots: { index: false },
};

export default async function OrderPage() {
  const { bank } = await getSiteContent();
  return (
    <>
      <SiteHeader variant="compact" label="Веб захиалгын анкет" back={{ href: "/", label: "Нүүр" }} />
      <main id="main" className="ax-container pt-[clamp(24px,4vw,48px)] pb-24">
        <OrderForm backendEnabled={isBackendConfigured()} bank={bank} />
      </main>
    </>
  );
}
