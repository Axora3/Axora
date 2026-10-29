import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { PublishSwitch } from "@/components/admin/ProductControls";
import { RequestCardActions } from "@/components/admin/RequestControls";
import { Body, Notice, PageHeader, PaymentPill, StatusPill } from "@/components/admin/ui";

export const metadata = { title: "Admin UI preview (dev)", robots: { index: false, follow: false } };

/**
 * Development-only visual check of the admin chrome (bottom nav, sheets,
 * cards) without a Supabase session. 404 in production. Saving from here
 * fails on purpose: the server actions still require a real admin.
 */
export default function AdminPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const t = "2026-10-29T01:00:00.000Z";
  return (
    <AdminShell counts={{ orders: 3, requests: 12 }} email="preview@example.test">
      <PageHeader title="UI preview (туршилт)" description="Зөвхөн development — бодит өгөгдөл биш." />
      <Body>
        <Notice tone="warn">Туршилтын дэлгэц. Энд хадгалах үйлдэл серверт эрхгүй тул алдаа буцаана.</Notice>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          <li className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-3.5">
            <strong>[Бизнесийн нэр]</strong>
            <div className="flex items-center gap-2">
              <OrderStatusControl id="00000000-0000-4000-8000-000000000001" updatedAt={t} status="new" title="[Бизнесийн нэр]" reference="AX-TEST0001" />
              <StatusPill kind="order" status="in_progress" />
            </div>
          </li>
          <li className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-3.5">
            <strong>[Template нэр]</strong>
            <PaymentPill status="pending" />
            <RequestCardActions
              detailHref="#"
              r={{ id: "00000000-0000-4000-8000-000000000002", updatedAt: t, status: "new", paymentStatus: "needs_review", deliveryStatus: "not_sent", customer: "[Хэрэглэгч]", product: "[Template нэр]", channelLabel: "Утас", contact: "[утас]", priceLabel: null, priceAmount: null, currency: null }}
            />
          </li>
          <li className="flex items-center justify-between gap-3 rounded-[18px] border border-line bg-surface p-3.5">
            <strong>[Бүтээгдэхүүн]</strong>
            <PublishSwitch id="00000000-0000-4000-8000-000000000003" title="[Бүтээгдэхүүн]" published={false} editHref="#" />
          </li>
        </ul>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Keyboard тест
          <input className="min-h-11 rounded-[10px] border border-line-strong bg-sunken px-3 text-base text-ink" placeholder="Энд дарахад доод цэс нуугдана" />
        </label>
      </Body>
    </AdminShell>
  );
}
