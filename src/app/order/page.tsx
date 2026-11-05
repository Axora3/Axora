import { SiteFooter } from "@/components/site/SiteFooter";
import type { Metadata } from "next";
import { OrderForm } from "@/components/order/OrderForm";
import { SiteHeader } from "@/components/site/SiteHeader";
import { isBackendConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Веб захиалгын анкет",
  description: "39 асуулт, 7 алхамтай веб захиалгын анкет. Live demo-ийн тохиргоо автоматаар бөглөгдөнө.",
  robots: { index: false },
};

export default function OrderPage() {
  return (
    <>
      <SiteHeader variant="compact" label="Веб захиалгын анкет" back={{ href: "/", label: "Нүүр" }} />
      <main id="main" className="ax-container pt-[clamp(24px,4vw,48px)] pb-24">
        <div className="ax-in-sm flex max-w-[760px] flex-col gap-2.5">
          <h1 className="ax-h1">
            Веб захиалгын <span className="serif">анкет</span>
          </h1>
          <p className="ax-lead">39 асуулт, 7 алхам. Одтой (*) талбар заавал. Хариулт тань алхам хооронд хадгалагдана.</p>
        </div>
        <OrderForm backendEnabled={isBackendConfigured()} />
      </main><SiteFooter />
    </>
  );
}
