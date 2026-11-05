import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { PublishSwitch } from "@/components/admin/ProductControls";
import { RequestCardActions } from "@/components/admin/RequestControls";
import { Body, EmptyState, Notice, OrderPrompt, PageHeader, Panel, PaymentPill, StatCard, StatusPill } from "@/components/admin/ui";
import { buildOrderPrompt } from "@/lib/order/prompt";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { RequestsChart } from "@/components/admin/DashboardInsights";
import { WorkChecklist } from "@/components/admin/ProjectControls";
import { BankPreview } from "@/components/order/BankPreview";
import { OrderPaymentPanel } from "@/components/admin/OrderPaymentPanel";

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
    <AdminShell counts={{ orders: 3, requests: 12, support: 0, notifications: 0 }} email="preview@example.test">
      <PageHeader title="UI preview (туршилт)" description="Зөвхөн development — бодит өгөгдөл биш." />
      <Body>
        <Notice tone="warn">Туршилтын дэлгэц. Энд хадгалах үйлдэл серверт эрхгүй тул алдаа буцаана.</Notice>
        <div className="grid grid-cols-2 gap-3.5 min-[900px]:grid-cols-4">
          <StatCard band label="[Гол үзүүлэлт]" value="00" note="Туршилтын утга" icon="calendar" />
          <StatCard label="[Үзүүлэлт]" value="00" note="Туршилтын утга" icon="inbox" />
          <StatCard label="[Анхааруулга]" value="00" note="Туршилтын утга" icon="clock" warn />
          <StatCard label="[Холбоостой]" value="—" note="Уншиж чадаагүй үед" icon="activity" href="#" />
        </div>
        <RequestsChart title="График (туршилтын утга)" rows={[["1", 2, 1], ["2", 0, 3], ["3", 4, 2], ["4", 1, 1], ["5", 3, 0], ["6", 5, 2], ["7", 2, 4]].map(([label, orders, requests]) => ({ label: `Өдөр ${label}`, orders: Number(orders), requests: Number(requests) }))} />
        <Panel title="Хүснэгт" className="overflow-x-auto">
          <table className="ax-table min-w-[640px]">
            <thead><tr><th scope="col">ID</th><th scope="col">Бизнес</th><th scope="col">Төлөв</th><th scope="col">Төлбөр</th></tr></thead>
            <tbody>
              {["new", "in_progress", "completed"].map((status) => (
                <tr key={status}>
                  <td className="font-mono text-[13px]">AX-TEST</td>
                  <td className="font-bold">[Бизнесийн нэр]</td>
                  <td><StatusPill kind="order" status={status} /></td>
                  <td><PaymentPill status="pending" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Төлбөр" className="max-w-[340px]"><div className="p-[18px]"><OrderPaymentPanel id="00000000-0000-4000-8000-000000000001" updatedAt={t} amount={1500000} paid={false} paidAt={null} token="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" /></div></Panel>
        <BankPreview />
        <Panel title="Ажлын checklist" className="max-w-[340px]"><div className="p-[18px]"><WorkChecklist projectId="00000000-0000-4000-8000-000000000009" milestones={[{ id: "00000000-0000-4000-8000-00000000000a", project_id: "00000000-0000-4000-8000-000000000009", title: "Анкетыг шалгах", description: "", due_on: null, completed_at: t, updated_at: t }, { id: "00000000-0000-4000-8000-00000000000b", project_id: "00000000-0000-4000-8000-000000000009", title: "Захиалагчтай холбогдох", description: "", due_on: null, completed_at: null, updated_at: t }]} /></div></Panel>
        <OrderPrompt text={buildOrderPrompt({ reference: "AX-TEST0001", attachments: [{ field: "q22", name: "logo.png" }], design: { type: "[Төрөл]", style: "Modern", palette: "forest", primary: "#2F5D46", secondary: "#E9E2CF", bg: "#FBF8F0", name: "[Нэр]", headline: "[Гарчиг]", desc: "", cta: "[CTA]" }, answers: { q1: "[Нэр, овог]", q2: "[Бизнесийн нэр]", q12: "Бусад", q12o: "[Тодруулга]", q13: ["Онлайн захиалга авах"], q14: "Тийм", q15: "example.test", q17u: true, q18: "#E9E2CF", q22d: "https://example.test/drive", q38: "Messenger", q38x: "[Messenger нэр]", q39: true } })} />
        <Panel><EmptyState title="Хоосон төлөв" text="Энд өгөгдөл ирмэгц харагдана." /></Panel>
        <div className="-m-[clamp(16px,3vw,32px)]"><AdminPageSkeleton /></div>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          <li className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3.5">
            <strong>[Бизнесийн нэр]</strong>
            <div className="flex items-center gap-2">
              <OrderStatusControl id="00000000-0000-4000-8000-000000000001" updatedAt={t} status="new" title="[Бизнесийн нэр]" reference="AX-TEST0001" />
              <StatusPill kind="order" status="in_progress" />
            </div>
          </li>
          <li className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3.5">
            <strong>[Template нэр]</strong>
            <PaymentPill status="pending" />
            <RequestCardActions
              detailHref="#"
              r={{ id: "00000000-0000-4000-8000-000000000002", updatedAt: t, status: "new", paymentStatus: "needs_review", deliveryStatus: "not_sent", customer: "[Хэрэглэгч]", product: "[Template нэр]", channelLabel: "Утас", contact: "[утас]", priceLabel: null, priceAmount: null, currency: null }}
            />
          </li>
          <li className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-3.5">
            <strong>[Бүтээгдэхүүн]</strong>
            <PublishSwitch id="00000000-0000-4000-8000-000000000003" title="[Бүтээгдэхүүн]" published={false} editHref="#" />
          </li>
        </ul>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Keyboard тест
          <input className="ax-control min-h-11 px-3 text-base" placeholder="Энд дарахад доод цэс нуугдана" />
        </label>
      </Body>
    </AdminShell>
  );
}
