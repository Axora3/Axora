"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { saveOrderQuoteAction, setOrderPaidAction } from "@/app/admin/order-payment-actions";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/Toast";
import { runAdminAction } from "@/lib/admin/action-client";
import { fmtDateTime } from "@/lib/admin/labels";
import { formatMnt } from "@/lib/order/payment";
import { CopyButton } from "./client";
import { btn, field } from "./ui";

const noSubscribe = () => () => {};

/**
 * Sets the agreed amount and records a manual payment for a website order.
 * The customer sees the amount through a private link the admin sends them.
 */
export function OrderPaymentPanel({ id, updatedAt, amount, paid, paidAt, token }: { id: string; updatedAt: string; amount: number | null; paid: boolean; paidAt: string | null; token: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(amount ? String(amount) : "");
  const [confirming, setConfirming] = useState(false);
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");
  const parsed = Number(value.replace(/[\s,]/g, ""));
  const valid = Number.isInteger(parsed) && parsed > 0;
  const link = token ? `/order/pay/${token}` : null;

  const save = () =>
    start(async () => {
      const result = await runAdminAction(() => saveOrderQuoteAction({ id, expected: updatedAt, amount: parsed }));
      if (!result.ok) return toast({ kind: "err", text: result.message, action: result.code === "conflict" ? { label: "Шинэчлэх", onClick: () => router.refresh() } : undefined });
      toast({ kind: "ok", text: `Дүн хадгалагдлаа: ${formatMnt(parsed)}` });
      router.refresh();
    });

  const markPaid = (next: boolean) =>
    start(async () => {
      const result = await runAdminAction(() => setOrderPaidAction({ id, expected: updatedAt, paid: next }));
      setConfirming(false);
      if (!result.ok) return toast({ kind: "err", text: result.message, action: result.code === "conflict" ? { label: "Шинэчлэх", onClick: () => router.refresh() } : undefined });
      toast({ kind: "ok", text: next ? "Төлөгдсөн гэж тэмдэглэлээ." : "Төлөгдөөгүй болголоо." });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3.5">
      <span className={`ax-badge self-start ${paid ? "" : "ax-badge-warn"}`}>
        <Icon name={paid ? "circle-check" : "clock"} size={14} />
        {paid ? `Төлөгдсөн${paidAt ? ` · ${fmtDateTime(paidAt)}` : ""}` : "Төлөгдөөгүй"}
      </span>

      <form className="flex flex-col gap-1.5" onSubmit={(event) => { event.preventDefault(); if (valid && !paid) save(); }}>
        <label htmlFor="order-amount" className={field.label}>Төлөх дүн (₮)</label>
        <div className="flex gap-2">
          <input id="order-amount" inputMode="numeric" className={field.input} value={value} disabled={paid} placeholder="Жишээ: 1500000" onChange={(event) => setValue(event.target.value)} aria-invalid={!!value && !valid} />
          <button className={`${btn.primary} shrink-0`} disabled={pending || paid || !valid || parsed === amount}>Хадгалах</button>
        </div>
        {!!value && !valid && <span className="text-[13px] font-bold text-danger">Дүнгээ 0-ээс их бүхэл тоогоор оруулна уу.</span>}
      </form>

      {link && amount ? (
        <div className="flex flex-col gap-2 border-t border-line-soft pt-3">
          <span className={field.label}>Хэрэглэгчид илгээх холбоос</span>
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-[13px] [overflow-wrap:anywhere]">{origin}{link}</a>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={`${origin}${link}`} label="Төлбөрийн холбоос" />
          </div>
          <p className="m-0 text-xs leading-relaxed text-muted">Холбоос автоматаар илгээгдэхгүй. Хуулаад хэрэглэгчид өөрөө илгээнэ үү. Дүн болон дансны мэдээллийг харуулна.</p>
        </div>
      ) : (
        <p className="m-0 text-[13px] leading-relaxed text-muted">Дүн хадгалахад хэрэглэгчид илгээх төлбөрийн холбоос үүснэ.</p>
      )}

      {amount && (
        <button type="button" className={paid ? btn.ghost : btn.primary} disabled={pending} onClick={() => (paid ? markPaid(false) : setConfirming(true))}>
          {paid ? "Төлөгдөөгүй болгох" : "Төлөгдсөн гэж тэмдэглэх"}
        </button>
      )}

      <BottomSheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Төлбөр орсон уу?"
        description={amount ? formatMnt(amount) : undefined}
        footer={<button type="button" className={`${btn.primary} w-full`} disabled={pending} onClick={() => markPaid(true)}>{pending ? "Хадгалж байна…" : "Тийм, төлөгдсөн"}</button>}
      >
        <p className="text-[15px] leading-relaxed">Дансаа шалгасны дараа тэмдэглэнэ үү. Систем банктай холбогдоогүй тул гүйлгээг автоматаар шалгахгүй.</p>
      </BottomSheet>
    </div>
  );
}
