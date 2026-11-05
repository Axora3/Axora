"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CopyButton } from "@/components/admin/client";
import { PaymentInstructions } from "./PaymentInstructions";
import { Check, Download } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { TestModeNotice } from "@/components/ui/Notice";
import type { SiteContent } from "@/lib/content/schema";
import { formatMnt } from "@/lib/order/payment";
import { SUCCESS_TEXT } from "@/lib/site";

const STAGES = ["Анкет", "Үнийн санал", "Төлбөр", "Ажил эхлэх", "Хүлээлгэн өгөх"];

/**
 * Shown right after the questionnaire. It reports only what is true: the order
 * is saved, and paid only once an admin recorded it. The amount appears after the
 * quote is agreed, no gateway is connected, and nothing here can mark an order paid.
 */
export function OrderPayment({ reference, business, budget = "", amount = null, paid = false, bank, testMode = false, onReview, onDownload }: {
  reference: string | null;
  business: string;
  budget?: string;
  amount?: number | null;
  paid?: boolean;
  bank: SiteContent["bank"];
  testMode?: boolean;
  onReview?: () => void;
  onDownload?: () => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  // Quote agreed: the customer is on the payment stage. Paid: work is next.
  const activeStage = paid ? 3 : amount ? 2 : 1;

  return (
    <div className="ax-in-sm flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <span className="ax-eyebrow">{reference ? `Захиалга · ${reference}` : "Туршилтын захиалга"}</span>
          <h1 id="ox-result-title" tabIndex={-1} className="ax-h1 outline-none">
            Веб хөгжүүлэлтийн <span className="serif">төлбөр</span>
          </h1>
        </div>
        <span className={`ax-badge px-3 py-1.5 text-[13px] ${paid ? "" : "ax-badge-warn"}`}>{paid ? "Төлөгдсөн" : "Төлөгдөөгүй"}</span>
      </div>

      {testMode && <TestModeNotice>Туршилтын горим — захиалга хадгалагдаагүй, төлбөр авахгүй.</TestModeNotice>}

      <ol className="ax-surface m-0 grid list-none grid-cols-5 gap-1 p-[clamp(12px,2vw,22px)]" aria-label="Захиалгын явц">
        {STAGES.map((stage, index) => {
          const done = index < activeStage;
          const current = index === activeStage;
          return (
            <li key={stage} aria-current={current ? "step" : undefined} className="flex min-w-0 flex-col items-center gap-1.5 text-center min-[640px]:items-start min-[640px]:text-left">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold" style={{ background: done ? "var(--ax-primary)" : current ? "var(--ax-lime)" : "transparent", color: done ? "var(--ax-on-primary)" : current ? "var(--ax-on-lime)" : "var(--ax-muted)", border: done || current ? 0 : "1px solid var(--ax-line-mid)" }}>
                {done ? <Check size={14} strokeWidth={3} /> : index + 1}
              </span>
              <span className={`text-[12px] leading-tight font-bold min-[640px]:text-sm ${done || current ? "text-ink" : "text-muted"}`}>{stage}</span>
            </li>
          );
        })}
      </ol>

      <div className="grid items-start gap-5 min-[960px]:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="pay-how" className="ax-surface flex flex-col gap-5 p-[clamp(18px,3vw,32px)]">
          <div className="flex flex-col gap-2">
            <h2 id="pay-how" className="ax-h3">{paid ? "Төлбөр баталгаажсан" : "Хэрхэн төлөх вэ?"}</h2>
            <p className="text-[15px] leading-relaxed text-muted">
              {paid ? "Төлбөр тань бүртгэгдлээ. Бид ажлын дараагийн алхмын талаар тантай холбогдоно." : amount ? "Доорх дансанд төлөх дүнгээ шилжүүлж, гүйлгээний утгад захиалгын дугаараа бичнэ үү." : `${SUCCESS_TEXT} Төлөх дүн үнийн санал дээр тохирогдоно. Дүнгээ тохирсны дараа төлнө үү.`}
            </p>
          </div>

          {!paid && <PaymentInstructions bank={bank} reference={reference} />}

          <p className="text-[13px] leading-normal text-muted">{!paid && "Төлбөрийг бид шалгаж, гараар баталгаажуулна. "}Асуух зүйл байвал <Link href="/contact">бидэнтэй холбогдоорой</Link>.</p>
        </section>

        <aside aria-label="Захиалгын товч" className="flex flex-col gap-3 min-[960px]:sticky min-[960px]:top-[88px]">
          <div className="ax-surface flex flex-col gap-3 p-5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-bold text-muted">Захиалагч</span>
              <strong className="text-[17px] [overflow-wrap:anywhere]">{business || "—"}</strong>
            </div>
            {reference && (
              <div className="flex items-center justify-between gap-2 border-t border-line-soft pt-3">
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-bold text-muted">Захиалгын дугаар</span>
                  <strong className="font-mono">{reference}</strong>
                </span>
                <CopyButton value={reference} label="Захиалгын дугаар" />
              </div>
            )}
            {budget && (
              <div className="flex flex-col gap-0.5 border-t border-line-soft pt-3">
                <span className="text-[13px] font-bold text-muted">Таны сонгосон төсөв</span>
                <span className="text-[15px] font-semibold">{budget}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
              <span className="font-extrabold">{paid ? "Төлсөн дүн" : "Төлөх дүн"}</span>
              <strong className={`text-right tabular-nums ${amount ? "text-[22px]" : "text-[17px]"}`}>{amount ? formatMnt(amount) : "Үнийн саналаар"}</strong>
            </div>
          </div>
          {onDownload && (
            <button type="button" onClick={onDownload} className={buttonStyles("secondary", "w-full")}>
              <Download size={18} />
              Хариултаа JSON-оор татах
            </button>
          )}
          {onReview ? (
            <button type="button" onClick={onReview} className={buttonStyles("quiet", "w-full")}>Хариултаа харах</button>
          ) : (
            <Link href="/" className={buttonStyles("quiet", "w-full")}>Нүүр хуудас руу</Link>
          )}
        </aside>
      </div>
    </div>
  );
}
