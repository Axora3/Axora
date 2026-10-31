"use client";

import { runAdminAction } from "@/lib/admin/action-client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setOrderStatusAction } from "@/app/admin/actions";
import { ChevronDown } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { ORDER_STATUS, ORDER_STATUSES, type OrderStatus } from "@/lib/admin/labels";
import { canOrderTransition, orderTransitionHint } from "@/lib/admin/transitions";

type Props = { id: string; updatedAt: string; status: string; title: string; reference: string; size?: "sm" | "md" };

/**
 * Status pill that opens a sheet to change the order status. The pill keeps
 * showing the saved value until the server confirms; on failure the old
 * value stays and the admin can retry. Success offers an undo.
 */
export function OrderStatusControl({ id, updatedAt, status, title, reference, size = "sm" }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState({ status, updatedAt });
  const [pick, setPick] = useState(status);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  // A server refresh (other tab, detail page) wins over the local copy.
  const [seen, setSeen] = useState({ status, updatedAt });
  if (seen.status !== status || seen.updatedAt !== updatedAt) {
    setSeen({ status, updatedAt });
    setSaved({ status, updatedAt });
  }

  const s = ORDER_STATUS[saved.status as OrderStatus];

  function save(to: OrderStatus, expected: string, undoOf?: string) {
    setErr("");
    start(async () => {
      const r = await runAdminAction(() => setOrderStatusAction({ id, expected, status: to }));
      if (!r.ok) {
        setErr(r.message);
        toast({ kind: "err", text: r.message, action: r.code === "conflict" ? { label: "Шинэчлэх", onClick: () => router.refresh() } : { label: "Дахин", onClick: () => save(to, expected, undoOf) } });
        return;
      }
      const from = undoOf ?? r.from;
      setSaved({ status: to, updatedAt: r.updatedAt });
      setOpen(false);
      router.refresh();
      if (undoOf) toast({ kind: "ok", text: `Буцаалаа: ${ORDER_STATUS[to].label}` });
      else if (from !== to)
        toast({
          kind: "ok",
          text: `${reference} → ${ORDER_STATUS[to].label}. Хадгалагдлаа.`,
          action: canOrderTransition(to, from as OrderStatus) ? { label: "Буцаах", onClick: () => save(from as OrderStatus, r.updatedAt, to) } : undefined,
        });
    });
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`Төлөв: ${s?.label ?? saved.status}. ${title} — төлөв солих`}
        onClick={() => {
          setPick(saved.status);
          setErr("");
          setOpen(true);
        }}
        className={`ax-btn relative z-[2] inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 font-extrabold whitespace-nowrap ${size === "md" ? "min-h-11 px-3.5 text-sm" : "min-h-10 px-3 text-[12.5px]"}`}
        style={{ background: s?.bg, color: s?.fg }}
      >
        <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-current" />
        {pending ? "Хадгалж байна…" : (s?.label ?? saved.status)}
        <ChevronDown size={14} />
      </button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Төлөв солих"
        description={`${reference} · ${title}`}
        dirty={pick !== saved.status && !pending}
        footer={
          <button
            type="button"
            disabled={pending || pick === saved.status}
            onClick={() => save(pick as OrderStatus, saved.updatedAt)}
            className="ax-btn ax-primary min-h-[54px] w-full rounded-[15px] border-0 bg-primary text-base font-bold text-on-primary"
          >
            {pending ? "Хадгалж байна…" : pick === saved.status ? "Шинэ төлөв сонгоно уу" : `“${ORDER_STATUS[pick as OrderStatus].label}” болгох`}
          </button>
        }
      >
        <fieldset className="ax-fs flex flex-col gap-2">
          <legend className="sr-only">Шинэ төлөв</legend>
          {ORDER_STATUSES.map((o) => {
            const cur = o === saved.status;
            const allowed = cur || canOrderTransition(saved.status, o);
            const hint = orderTransitionHint(saved.status, o);
            return (
              <label
                key={o}
                className={`flex min-h-[56px] items-center gap-3 rounded-[14px] border px-3.5 ${allowed ? "cursor-pointer" : "cursor-not-allowed opacity-60"} ${pick === o ? "border-2 border-brand bg-soft" : "border-line bg-surface"}`}
              >
                <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ORDER_STATUS[o].bar }} />
                <span className="flex flex-1 flex-col">
                  <span className="text-[15px] font-bold">
                    {ORDER_STATUS[o].label}
                    {cur && <span className="ml-1.5 text-xs font-bold text-muted">(одоогийн)</span>}
                  </span>
                  {hint && <span className="text-xs text-muted">{hint}</span>}
                </span>
                <input type="radio" name={`ost-${id}`} checked={pick === o} disabled={!allowed || pending} onChange={() => setPick(o)} className="h-[22px] w-[22px]" />
              </label>
            );
          })}
        </fieldset>
        {err && (
          <p role="alert" className="mt-3 rounded-[10px] border border-danger-line bg-danger-bg px-3 py-2.5 text-sm font-bold text-danger-ink">
            ✕ {err} Өмнөх төлөв хэвээр байна.
          </p>
        )}
      </BottomSheet>
    </>
  );
}
