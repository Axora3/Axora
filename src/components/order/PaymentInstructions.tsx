"use client";

import { CopyButton } from "@/components/admin/client";
import { Icon } from "@/components/ui/icon";
import type { SiteContent } from "@/lib/content/schema";

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line-soft py-3 first:border-t-0">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-bold text-muted">{label}</span>
        <strong className="text-[16px] [overflow-wrap:anywhere]">{value}</strong>
      </span>
      <CopyButton value={value} label={label} />
    </div>
  );
}

/** How to pay, shared by website orders and template purchases. Bank transfer is the only live method. */
export function PaymentInstructions({ bank, reference }: { bank: SiteContent["bank"]; reference: string | null }) {
  return (
    <>
      <div className="grid gap-2.5 min-[560px]:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-control border-2 border-brand bg-soft p-3.5">
          <span className="inline-flex items-center gap-2 text-[15px] font-extrabold"><Icon name="credit-card" size={18} className="text-brand" />Дансаар</span>
          <span className="text-[13px] text-muted">Шилжүүлгээр төлнө</span>
        </div>
        {["QPay", "SocialPay"].map((method) => (
          <div key={method} aria-disabled="true" className="flex flex-col gap-1 rounded-control border border-dashed border-line-mid p-3.5 text-muted">
            <span className="text-[15px] font-extrabold">{method}</span>
            <span className="text-[13px]">Удахгүй</span>
          </div>
        ))}
      </div>

      {bank.name && bank.account ? (
        <div className="rounded-control border border-line bg-sunken px-4 py-1">
          <BankRow label="Банк" value={bank.name} />
          <BankRow label="Дансны дугаар" value={bank.account} />
          {bank.holder && <BankRow label="Хүлээн авагч" value={bank.holder} />}
          {reference && <BankRow label="Гүйлгээний утга" value={reference} />}
        </div>
      ) : (
        <p className="flex items-start gap-2 rounded-control bg-info-bg px-3.5 py-3 text-sm leading-normal font-semibold text-info">
          <Icon name="info-circle" size={16} className="mt-0.5 shrink-0" />
          <span>Дансны мэдээллийг бид тантай холбогдож илгээнэ.{reference ? ` Захиалгын дугаар: ${reference}` : ""}</span>
        </p>
      )}
    </>
  );
}
