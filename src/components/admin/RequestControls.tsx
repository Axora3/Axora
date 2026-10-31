"use client";

import { runAdminAction } from "@/lib/admin/action-client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { confirmPaymentAction, createDownloadLinkAction, updateRequestAction } from "@/app/admin/actions";
import { Copy, Lock, More } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { REQUEST_STATUS, type RequestStatus } from "@/lib/admin/labels";
import { PAYMENT_DONE, canRequestTransition } from "@/lib/admin/transitions";

export type RequestInfo = {
  id: string;
  updatedAt: string;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  customer: string;
  product: string;
  channelLabel: string;
  contact: string;
  /** Price at request time, e.g. "15,000₮"; null when no snapshot exists. */
  priceLabel: string | null;
  priceAmount: number | null;
  currency: string | null;
};

const paid = (r: RequestInfo) => r.paymentStatus !== "not_required";
const paymentOk = (r: RequestInfo) => (PAYMENT_DONE as readonly string[]).includes(r.paymentStatus);
const sheetBtn = "ax-btn flex min-h-[54px] w-full cursor-pointer items-center gap-3 rounded-[14px] border border-line bg-surface px-3.5 text-left text-[15px] font-bold text-ink";
const primary = "ax-btn ax-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-[13px] border-0 bg-primary px-4 text-[15px] font-bold text-on-primary no-underline";
const ghost = "ax-btn ax-ghost inline-flex min-h-12 items-center justify-center gap-2 rounded-[13px] border border-line-strong bg-surface px-4 text-[15px] font-bold text-ink no-underline";

function useStatusChange(r: RequestInfo, onDone: () => void) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const run = (to: RequestStatus, text: string, expected = r.updatedAt) =>
    start(async () => {
      const res = await runAdminAction(() => updateRequestAction({ id: r.id, expected, status: to }));
      if (!res.ok) {
        toast({ kind: "err", text: res.message, action: res.code === "conflict" ? { label: "Шинэчлэх", onClick: () => router.refresh() } : { label: "Дахин", onClick: () => run(to, text, expected) } });
        return;
      }
      onDone();
      router.refresh();
      const back = res.from as RequestStatus;
      toast({
        kind: "ok",
        text,
        action: back !== to && canRequestTransition(to, back, r.paymentStatus) ? { label: "Буцаах", onClick: () => run(back, `Буцаалаа: ${REQUEST_STATUS[back].label}`, res.updatedAt) } : undefined,
      });
    });
  return { pending, run };
}

/** Primary card action + the “…” sheet for one request card. */
export function RequestCardActions({ r, detailHref }: { r: RequestInfo; detailHref: string }) {
  const [sheet, setSheet] = useState<null | "more" | "cancel" | "payment" | "delivery">(null);
  const close = () => setSheet(null);
  const { pending, run } = useStatusChange(r, close);
  const toast = useToast();
  const closed = r.status === "cancelled" || r.status === "fulfilled";

  async function copyContact() {
    try {
      await navigator.clipboard.writeText(`${r.customer} — ${r.channelLabel}: ${r.contact}`);
      toast({ kind: "ok", text: "Холбоо барих мэдээлэл хуулагдлаа." });
      close();
    } catch {
      toast({ kind: "err", text: "Хуулж чадсангүй. Мэдээллийг гараар сонгож хуулна уу." });
    }
  }

  return (
    <div className="flex gap-2">
      {closed ? (
        <Link href={detailHref} className={`${ghost} flex-1`}>
          Дэлгэрэнгүй
        </Link>
      ) : paid(r) && !paymentOk(r) ? (
        <button type="button" onClick={() => setSheet("payment")} aria-haspopup="dialog" className={`${primary} flex-1`}>
          Төлбөр баталгаажуулах
        </button>
      ) : (
        <button type="button" onClick={() => setSheet("delivery")} aria-haspopup="dialog" className={`${primary} flex-1`}>
          <Lock size={16} />
          Хүргэх холбоос
        </button>
      )}
      <button
        type="button"
        onClick={() => setSheet("more")}
        aria-haspopup="dialog"
        aria-label={`${r.customer} — бусад үйлдэл`}
        className="ax-btn inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[13px] border border-line-strong bg-surface text-ink"
      >
        <More size={20} />
      </button>

      <BottomSheet open={sheet === "more" || sheet === "cancel"} onClose={close} title={sheet === "cancel" ? "Хүсэлт цуцлах уу?" : "Үйлдэл"} description={`${r.product} · ${r.customer}`}>
        {sheet === "cancel" ? (
          <div className="flex flex-col gap-3">
            <p className="text-[15px] leading-relaxed">
              Хүсэлт “Цуцлагдсан” болно. Хэрэглэгчид юу ч илгээгдэхгүй. Шаардлагатай бол дараа нь буцааж нээж болно.
            </p>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setSheet("more")} className={`${ghost} flex-1`}>
                Үгүй
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run("cancelled", "Хүсэлт цуцлагдлаа.")}
                className="ax-btn inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-[13px] border border-danger-line bg-danger-bg px-4 text-[15px] font-bold text-danger-ink"
              >
                {pending ? "Хадгалж байна…" : "Тийм, цуцлах"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {r.status === "new" && (
              <button type="button" disabled={pending} onClick={() => run("contacted", "“Холбогдсон” гэж тэмдэглэлээ.")} className={sheetBtn}>
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--ax-warn-bar)" }} />
                {pending ? "Хадгалж байна…" : "Холбогдсон гэж тэмдэглэх"}
              </button>
            )}
            <button type="button" onClick={copyContact} className={sheetBtn}>
              <Copy size={18} />
              Холбоо барих мэдээлэл хуулах
            </button>
            {r.status === "contacted" && paymentOk(r) && (
              <button type="button" disabled={pending} onClick={() => run("fulfilled", "“Хүргэж дууссан” гэж тэмдэглэлээ.")} className={sheetBtn}>
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--ax-done-bar)" }} />
                Хүргэсэн гэж тэмдэглэх
              </button>
            )}
            <Link href={detailHref} className={`${sheetBtn} no-underline`}>
              Дэлгэрэнгүй нээх
            </Link>
            {r.status !== "cancelled" && r.status !== "fulfilled" && (
              <button type="button" onClick={() => setSheet("cancel")} className={`${sheetBtn} text-danger`}>
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-danger" />
                Хүсэлт цуцлах
              </button>
            )}
            <p className="pt-1 text-[12.5px] leading-normal text-muted">Эдгээр үйлдэл хэрэглэгчид мессеж илгээдэггүй — зөвхөн бүртгэлийг шинэчилнэ.</p>
          </div>
        )}
      </BottomSheet>

      <PaymentSheet r={r} open={sheet === "payment"} onClose={close} />
      <DeliverySheet r={r} open={sheet === "delivery"} onClose={close} />
    </div>
  );
}

/**
 * Manual payment confirmation. Shows product, customer and the amount from
 * the request-time snapshot; older requests without a snapshot ask for the
 * amount actually agreed. Saved with who/when by the database.
 */
export function PaymentSheet({ r, open, onClose }: { r: RequestInfo; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [checked, setChecked] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MNT");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const needsAmount = r.paymentStatus === "needs_review" || r.priceAmount == null;
  const amt = Number(amount.replace(/[\s,]/g, ""));

  function submit() {
    setErr("");
    if (!checked) return setErr("Төлбөрийг шалгаж, баталгаажуулах товчийг чагтлана уу.");
    if (needsAmount && !(amt > 0)) return setErr("Тохиролцсон дүнг 0-ээс их тоогоор оруулна уу.");
    start(async () => {
      const res = await runAdminAction(() => confirmPaymentAction({ id: r.id, amount: needsAmount ? amt : r.priceAmount, currency: needsAmount ? currency : r.currency }));
      if (!res.ok) {
        setErr(res.message);
        return;
      }
      onClose();
      setChecked(false);
      router.refresh();
      toast({ kind: "ok", text: res.already ? "Төлбөр өмнө нь баталгаажсан байна." : "Төлбөр гараар баталгаажлаа. Одоо хүргэх холбоос үүсгэж болно." });
    });
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Төлбөр баталгаажуулах"
      description="Гараар баталгаажуулалт"
      dirty={(checked || !!amount) && !pending}
      footer={
        <button type="button" disabled={pending} onClick={submit} className={`${primary} min-h-[54px] w-full`}>
          {pending ? "Хадгалж байна…" : "Төлбөр баталгаажсан"}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-[14px] border border-line bg-sunken p-3.5 text-[15px]">
          <dt className="font-bold text-muted">Бүтээгдэхүүн</dt>
          <dd className="m-0 font-bold">{r.product}</dd>
          <dt className="font-bold text-muted">Хэрэглэгч</dt>
          <dd className="m-0">{r.customer}</dd>
          <dt className="font-bold text-muted">Дүн</dt>
          <dd className="m-0 font-extrabold">{needsAmount ? "Хадгалагдаагүй" : r.priceLabel}</dd>
        </dl>
        {needsAmount && (
          <div className="flex flex-col gap-2 rounded-[14px] border border-warn-line bg-warn-bg p-3.5">
            <p className="text-[13.5px] leading-normal font-semibold text-warn-ink">
              Энэ хүсэлт ирэх үеийн үнэ хадгалагдаагүй (хуучин хүсэлт). Одоогийн үнийг автоматаар авахгүй — хэрэглэгчтэй тохирсон дүнгээ оруулна уу.
            </p>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">Тохиролцсон дүн</span>
                <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className="min-h-12 rounded-xl border border-line-strong bg-surface px-3 text-base text-ink" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">Валют</span>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="min-h-12 rounded-xl border border-line-strong bg-surface px-2 text-base text-ink">
                  <option value="MNT">MNT</option>
                  <option value="USD">USD</option>
                </select>
              </label>
            </div>
          </div>
        )}
        <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-line p-3.5">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0" />
          <span className="text-[15px] font-bold">
            Төлбөр орж ирснийг шалгасан
            <span className="mt-1 block text-[13px] font-semibold text-muted">
              Банк эсвэл төлбөрийн систем автоматаар шалгаагүй. Таны нэр, хугацаатай “гараар баталгаажуулсан” гэж бүртгэгдэнэ.
            </span>
          </span>
        </label>
        {err && (
          <p role="alert" className="rounded-[10px] border border-danger-line bg-danger-bg px-3 py-2.5 text-sm font-bold text-danger-ink">
            ✕ {err}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}

/**
 * Time-limited delivery link. The server refuses it unless the product is
 * free or the payment was confirmed. Creating/copying the link does not mean
 * it was sent or downloaded.
 */
export function DeliverySheet({ r, open, onClose }: { r: RequestInfo; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [hours, setHours] = useState(72);
  const [res, setRes] = useState<{ url: string; expiresAt: string | null; external: boolean } | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const [pending, start] = useTransition();
  const { pending: marking, run } = useStatusChange(r, () => {
    setRes(null);
    onClose();
  });

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        setRes(null);
        setErr("");
        onClose();
      }}
      title="Хүргэх холбоос"
      description={`${r.product} · ${r.customer}`}
    >
      {!res ? (
        <div className="flex flex-col gap-4">
          <fieldset className="ax-fs">
            <legend className="mb-2 text-sm font-bold">Холбоосын хугацаа</legend>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-soft-3 p-1">
              {[
                [24, "24 цаг"],
                [72, "72 цаг"],
                [168, "7 хоног"],
              ].map(([h, l]) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={hours === h}
                  onClick={() => setHours(h as number)}
                  className={`min-h-11 cursor-pointer rounded-[9px] border-0 text-sm font-bold ${hours === h ? "bg-elevated text-ink shadow-[0_1px_2px_var(--ax-shadow)]" : "bg-transparent text-muted"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="text-[13.5px] leading-normal text-muted">
            Хамгаалагдсан файлаас хугацаатай signed URL үүсгэнэ. Сервер төлбөр баталгаажсан эсэх, файл байгаа эсэхийг дахин шалгана. Холбоосыг та {r.channelLabel}-аар өөрөө илгээнэ.
          </p>
          {err && (
            <p role="alert" className="rounded-[10px] border border-danger-line bg-danger-bg px-3 py-2.5 text-sm font-bold text-danger-ink">
              ✕ {err}
            </p>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setErr("");
                const out = await runAdminAction(() => createDownloadLinkAction(r.id, hours));
                if (out.ok) {
                  setRes({ url: out.url, expiresAt: out.expiresAt, external: out.external });
                  router.refresh();
                } else setErr(out.message);
              })
            }
            className={`${primary} min-h-[54px] w-full`}
          >
            {pending ? "Шалгаж байна…" : "Холбоос үүсгэх"}
          </button>
        </div>
      ) : (
        <div role="status" className="flex flex-col gap-3">
          <p className="rounded-[12px] bg-soft px-3 py-2.5 text-[13.5px] font-bold">
            {res.external ? "Хүргэх холбоос (гадаад, хугацаагүй)" : `Холбоос үүслээ · ${new Date(res.expiresAt!).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })} хүртэл хүчинтэй`}
          </p>
          <input readOnly value={res.url} aria-label="Үүсгэсэн холбоос" onFocus={(e) => e.currentTarget.select()} className="min-h-12 w-full rounded-xl border border-line-strong bg-sunken px-3 font-mono text-[13px] text-ink" />
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(res.url);
                setCopied("ok");
              } catch {
                setCopied("fail");
              }
            }}
            className={`${ghost} w-full`}
          >
            <Copy size={18} />
            <span aria-live="polite">{copied === "ok" ? "Хуулсан ✓" : copied === "fail" ? "Хуулж чадсангүй — гараар сонгоно уу" : "Холбоос хуулах"}</span>
          </button>
          <p className="text-[13px] leading-normal text-muted">Холбоос үүссэн эсвэл хуулсан нь хэрэглэгчид илгээсэн, татаж авсан гэсэн үг биш. Илгээсний дараа доорх товчоор тэмдэглэнэ.</p>
          {r.status === "contacted" ? (
            <button type="button" disabled={marking} onClick={() => run("fulfilled", "“Хүргэж дууссан” гэж тэмдэглэлээ.")} className={`${primary} min-h-[54px] w-full`}>
              {marking ? "Хадгалж байна…" : "Илгээсэн — “Хүргэж дууссан” болгох"}
            </button>
          ) : r.status === "new" ? (
            <p className="text-[13px] font-semibold text-warn-ink">“Хүргэж дууссан” болгохын өмнө хүсэлтийг “Холбогдсон” болгоно.</p>
          ) : null}
        </div>
      )}
    </BottomSheet>
  );
}

/** Detail page panels: payment + delivery with the same sheets. */
export function RequestPaymentPanel({ r, confirmedBy, confirmedAt, confirmedAmount, source }: { r: RequestInfo; confirmedBy: string | null; confirmedAt: string | null; confirmedAmount: string | null; source: string | null }) {
  const [sheet, setSheet] = useState<null | "payment" | "delivery">(null);
  const closed = r.status === "cancelled";
  return (
    <div className="flex flex-col gap-3">
      {r.paymentStatus === "confirmed_manual" ? (
        <div className="flex flex-col gap-1 rounded-[12px] border border-line bg-sunken p-3 text-sm">
          <strong>✓ Гараар баталгаажсан · {confirmedAmount}</strong>
          <span className="text-muted">
            {confirmedBy} · {confirmedAt}
            {source === "admin_entered" ? " · дүнг админ оруулсан" : " · хүсэлтийн үеийн үнэ"}
          </span>
          <span className="text-[12.5px] text-muted">Банк эсвэл төлбөрийн систем автоматаар шалгаагүй.</span>
        </div>
      ) : r.paymentStatus === "not_required" ? (
        <p className="text-sm text-muted">Үнэгүй бүтээгдэхүүн — төлбөр шаардлагагүй.</p>
      ) : (
        <>
          <p className="text-sm text-muted">{r.paymentStatus === "needs_review" ? "Хүсэлтийн үеийн үнэ хадгалагдаагүй — дүнг шалгаж баталгаажуулна." : `Хүлээгдэж буй дүн: ${r.priceLabel}`}</p>
          {!closed && (
            <button type="button" onClick={() => setSheet("payment")} aria-haspopup="dialog" className={primary}>
              Төлбөр баталгаажуулах
            </button>
          )}
        </>
      )}
      {!closed && paymentOk(r) && (
        <button type="button" onClick={() => setSheet("delivery")} aria-haspopup="dialog" className={paid(r) && r.paymentStatus !== "confirmed_manual" ? primary : ghost}>
          <Lock size={16} />
          Хүргэх холбоос үүсгэх
        </button>
      )}
      <PaymentSheet r={r} open={sheet === "payment"} onClose={() => setSheet(null)} />
      <DeliverySheet r={r} open={sheet === "delivery"} onClose={() => setSheet(null)} />
    </div>
  );
}
