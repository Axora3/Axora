"use client";
import { workflowTime } from "@/lib/order-workflow/display";
import { useEffect, useState } from "react";
import Link from "next/link";
import {BottomSheet} from "@/components/ui/BottomSheet";
import type { CustomerWorkflow } from "@/lib/order-workflow/contracts";
import { formatMnt } from "@/lib/order/payment";
import { CopyButton } from "@/components/admin/client";
import { buttonStyles } from "@/components/ui/button";
import { FEATURE_LABELS } from "@/lib/order-workflow/defaults";
const statusLabels: Record<string, string> = {
  draft: "Тусгай шаардлагыг тодруулж байна",
  sent: "Үнийн саналтай танилцана уу",
  accepted: "Үнийн саналыг зөвшөөрсөн",
  revision_requested: "Засварын хүсэлтийг хянаж байна",
  rejected: "Үнийн саналаас татгалзсан",
  superseded: "Үнийн санал шинэчлэгдсэн",
};
export function QuoteBreakdown({
  quote,
}: {
  quote: NonNullable<CustomerWorkflow["quote"]>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Багцад багтсан хуудас</dt>
          <dd>{typeof quote.requirements.includedPages==='number'?quote.requirements.includedPages:'Тодорхойгүй'}</dd>
        </div>
        <div>
          <dt className="text-muted">Веб сайтын багц</dt>
          <dd>{quote.package_label ?? "Админ хянана"}</dd>
        </div>
        <div>
          <dt className="text-muted">Хуудасны тоо</dt>
          <dd>
            {typeof quote.requirements.pages === "number"
              ? quote.requirements.pages
              : "Тодорхойгүй"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Нэмэлт хуудас</dt>
          <dd>
            {typeof quote.requirements.additionalPages === "number"
              ? quote.requirements.additionalPages
              : "Тодорхойгүй"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Сонгосон функцүүд</dt>
          <dd>
            {Array.isArray(quote.requirements.features) &&
            quote.requirements.features.length
              ? quote.requirements.features
                  .map((id: string) => FEATURE_LABELS[id] ?? id)
                  .join(", ")
              : "Нэмэлт функц сонгоогүй"}
          </dd>
        </div>
      </dl>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Үнийн задаргаа</caption>
          <thead>
            <tr>
              <th className="py-2">Үйлчилгээ</th>
              <th>Тоо</th>
              <th className="text-right">Дүн</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((i, n) => (
              <tr key={n} className="border-t border-line-soft">
                <td className="py-3 pr-3">
                  {i.label}
                  {i.billing === "monthly"
                    ? " · сар бүр"
                    : i.billing === "external"
                      ? " · тусдаа зардал"
                      : ""}
                </td>
                <td>{i.quantity}</td>
                <td className="text-right whitespace-nowrap">
                  {formatMnt(i.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Нэг удаагийн дэд дүн: <strong>{formatMnt(quote.subtotal)}</strong>
      </p>
      {quote.discount > 0 && <p>Хөнгөлөлт: −{formatMnt(quote.discount)}</p>}
      <p className="text-lg font-bold">
        Нэг удаагийн хөгжүүлэлт:{" "}
        {quote.total == null ? "Хяналтад" : formatMnt(quote.total)}
      </p>
      <p>Сарын арчилгаа: {formatMnt(quote.monthly_total)} / сар</p>
      <p>Төлөвлөсөн хөгжүүлэлт: {quote.estimated_effort_days==null?'Хугацааг админ тодруулна':`${quote.estimated_effort_days} ажлын өдөр`} · дараалал, нөөц хугацааг төлбөр баталгаажуулах үед тооцно.</p>
      {quote.external_total > 0 && (
        <p>Бусад зардал: {formatMnt(quote.external_total)}</p>
      )}
      <p className="text-sm text-muted">
        Домэйн, hosting болон гуравдагч талын үйлчилгээний үнийг тусад нь
        батална.
      </p>
      {quote.notes && <p className="whitespace-pre-wrap">{quote.notes}</p>}
    </div>
  );
}
export function CustomerOrderWorkflow({
  initial,
  token,
}: {
  initial: CustomerWorkflow;
  token: string;
}) {
  const [data, setData] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [choice, setChoice] = useState(""),
    [message, setMessage] = useState(""),
    [reference, setReference] = useState("");
  const [requestKey, setRequestKey] = useState<string | null>(null);
  const [decisionQuote, setDecisionQuote] = useState<{
    version: number;
    total: number | null;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setInterval(async () => {
      if (document.hidden || busy) return;
      try {
        const r = await fetch("/api/order-workflow/" + token, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await r.json();
        if (r.ok && body.workflow) setData(body.workflow);
      } catch {}
    }, 30000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [token, busy]);
  function select(action: string) {
    setDecisionQuote(
      data.quote
        ? { version: data.quote.version, total: data.quote.total }
        : null,
    );
    setChoice(action);
    setMessage("");
    setReference("");
    setError("");
    setRequestKey(crypto.randomUUID());
  }
  async function submit() {
    if (!data.quote || !decisionQuote || !choice || busy) return;
    if (
      data.quote.version !== decisionQuote.version ||
      data.quote.total !== decisionQuote.total
    ) {
      setError(
        "Үнийн санал шинэчлэгдсэн. Шинэ задаргаатай танилцаад дахин сонгоно уу.",
      );
      setChoice("");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/order-workflow/" + token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: choice,
          key: requestKey ?? crypto.randomUUID(),
          version: decisionQuote.version,
          expectedAmount: decisionQuote.total ?? undefined,
          message,
          reference,
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.message ?? "Илгээсэнгүй.");
      setData(body.workflow);
      setChoice("");
      setRequestKey(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Холболтоо шалгана уу.");
    } finally {
      setBusy(false);
    }
  }
  const { order, quote, project, paymentReport, bank } = data;
  const stage = project?.delivered_at
    ? 6
    : project?.actual_completed_at
      ? 5
      : project?.actual_started_at
        ? 4
        : order.payment_status === "paid"
          ? 3
          : quote?.status === "accepted"
            ? 2
            : 1;
  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-muted">Захиалга · {order.reference}</p>
        <h1 className="ax-h1">{order.business_name}</h1>
      </header>
      <ol
        className="ax-surface grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 lg:grid-cols-7"
        aria-label="Захиалгын явц"
      >
        {[
          "Анкет",
          "Үнийн санал",
          "Төлбөр",
          "Дараалал",
          "Хөгжүүлэлт",
          "Дууссан",
          "Хүлээлгэн өгсөн",
        ].map((s, i) => (
          <li
            key={s}
            aria-current={i === stage ? "step" : undefined}
            className={i <= stage ? "font-bold" : "text-muted"}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      {order.status === "cancelled" && (
        <p role="status">Захиалга цуцлагдсан.</p>
      )}
      <section className="ax-surface flex flex-col gap-4 p-6">
        <h2 className="ax-h3">
          {quote ? statusLabels[quote.status] : "Үнийн саналыг бэлтгэж байна"}
        </h2>
        {quote && quote.status !== "draft" && (
          <>
            <p className="text-sm text-muted">
              Хувилбар {quote.version} · {quote.package_label}
            </p>
            <QuoteBreakdown quote={quote} />
          </>
        )}
        {quote?.status === "draft" && (
          <div><p>Дараах тусгай шаардлагад найдвартай автомат үнэ тогтоох боломжгүй тул админ тодруулна:</p><ul>{quote.review_flags.map(flag=><li key={flag}>{flag}</li>)}</ul></div>
        )}
        {quote?.status === "sent" && order.status !== "cancelled" && (
          <div className="flex flex-wrap gap-2">
            <Link href={'/order?revise='+encodeURIComponent(token)} className={buttonStyles('secondary')}>Анкетаа өөрчлөх</Link>
            <button className={buttonStyles()} onClick={() => select("accept")}>
              Үнийн саналыг зөвшөөрөх
            </button>
            <button
              className={buttonStyles("secondary")}
              onClick={() => select("cancel")}
            >Захиалгыг цуцлах</button>
            <button
              className={buttonStyles("secondary")}
              onClick={() => select("revision")}
            >
              Өөрчлөлт хүсэх
            </button>
            <button
              className={buttonStyles("secondary")}
              onClick={() => select("reject")}
            >
              Татгалзах
            </button>
          </div>
        )}
      </section>
      {quote?.status === "accepted" &&
        order.payment_status !== "paid" &&
        order.status !== "cancelled" && (
          <section className="ax-surface flex flex-col gap-4 p-6">
            <h2 className="ax-h3">Банкны шилжүүлэг</h2>
            {bank ? (
              <>
                <dl className="grid gap-3">
                  <div>
                    <dt>Банк</dt>
                    <dd>{bank.name}</dd>
                  </div>
                  <div>
                    <dt>Данс эзэмшигч</dt>
                    <dd>{bank.holder}</dd>
                  </div>
                  <div>
                    <dt>Данс</dt>
                    <dd className="flex gap-3 items-center">
                      {bank.account}
                      <CopyButton optical value={bank.account} label="Данс" />
                    </dd>
                  </div>
                  <div>
                    <dt>Шилжүүлэх дүн</dt>
                    <dd>
                      {formatMnt(quote.total!)}{" "}
                      <CopyButton value={String(quote.total)} label="Дүн" />
                    </dd>
                  </div>
                  <div>
                    <dt>Гүйлгээний утга</dt>
                    <dd>
                      {order.reference}{" "}
                      <CopyButton
                        value={order.reference}
                        label="Гүйлгээний утга"
                      />
                    </dd>
                  </div>
                </dl>
                {data.bankInstructions && <p>{data.bankInstructions}</p>}
                <p>Төлбөрөө шилжүүлсний дараа доорх товчийг дарна уу. Бид таны гүйлгээг шалгаж баталгаажуулна.</p>
                <p>Гүйлгээний утга дээр захиалгын дугаараа заавал бичнэ үү.</p>
                <p className="text-sm text-muted">
                  Сарын арчилгаа болон бусад зардлыг дээрх нэг удаагийн дүнд
                  нэмж шилжүүлэхгүй. Төлбөрийг админ шалгаж батална.
                </p>
                {paymentReport?.status === "reported" ? (
                  <p role="status">
                    Таны төлбөрийн мэдээллийг хүлээн авлаа. Бид банкны гүйлгээг шалгаж баталгаажуулсны дараа танд мэдэгдэх болно.
                  </p>
                ) : (
                  <>
                    <p>
                      {paymentReport?.status === "review_required"
                        ? "Төлбөрийн мэдээллийг дахин шалгаж мэдэгдэнэ үү. " +
                          (paymentReport.review_note ?? "")
                        : ""}
                    </p>
                    <button
                      className={buttonStyles()}
                      onClick={() => select("report_payment")}
                    >
                      Төлбөр шилжүүлсэн
                    </button>
                  </>
                )}
              </>
            ) : (
              <p>
                Банкны мэдээллийг админ баталгаажуулсны дараа төлбөрийн заавар
                харагдана.
              </p>
            )}
          </section>
        )}
      {paymentReport?.verification_note && (
        <p className="ax-surface p-4">
          Админы тайлбар: {paymentReport.verification_note}
        </p>
      )}
      {order.payment_status === "paid" && (
        <section className="ax-surface flex flex-col gap-3 p-6">
          <h2 className="ax-h3">
            {project?.delivered_at
              ? "Хүлээлгэн өгсөн"
              : project?.actual_completed_at
                ? "Хөгжүүлэлт дууссан"
                : project?.actual_started_at
                  ? "Хөгжүүлэлт явагдаж байна"
                  : "Төлбөр баталгаажсан · ажлын дараалалд"}
          </h2>
          <p>
            Баталсан дуусах огноо:{" "}
            <strong>{order.agreed_deadline ?? "Админ батална"}</strong> ·
            Улаанбаатарын цагаар
          </p>
          {project?.actual_started_at && (
            <p>Бодит эхэлсэн: {workflowTime(project.actual_started_at)}</p>
          )}
          {project && <p>Админы бүртгэсэн явц: {project.progress_percent}%</p>}
          {project?.delivered_at && project.delivery_url && (
            <a
              href={project.delivery_url}
              rel="noreferrer"
              target="_blank"
              className={buttonStyles()}
            >
              Веб сайтаа нээх
            </a>
          )}
        </section>
      )}
      {choice && (
        <BottomSheet open={true} onClose={()=>{if(!busy)setChoice('')}} title="Үйлдлийг батлах">
          <h2 className="ax-h3">
            {choice === "accept"
              ? "Энэ хувилбарын үнэ, ажлын хүрээг зөвшөөрөх үү?"
              : choice === "cancel" ? "Захиалгаа цуцлах уу?" : choice === "reject"
                ? "Үнийн саналаас татгалзах уу?"
                : choice === "revision"
                  ? "Өөрчлөх хүсэлт"
                  : "Шилжүүлгийн мэдээлэл"}
          </h2>
          {choice === "report_payment" && (
            <div className="rounded-xl border border-line-soft p-4 text-sm">
              <p>
                Захиалгын дугаар / гүйлгээний утга:{" "}
                <strong>{order.reference}</strong>
              </p>
              <p>
                Төлөх дүн:{" "}
                <strong>
                  {quote?.total == null
                    ? "Админ батална"
                    : formatMnt(quote.total)}
                </strong>
              </p>
              {bank && (
                <p>
                  {bank.name} · {bank.holder} · {bank.account}
                </p>
              )}
              <p>Гүйлгээний утга дээр захиалгын дугаараа заавал бичнэ үү.</p>
              <p>
                Банкны шилжүүлгээ хийсэн бол батална уу. Админ дансны хуулгатай
                тулгаж шалгана.
              </p>
            </div>
          )}
          {choice === "report_payment" && (
            <label>
              Гүйлгээний лавлах дугаар (сонголтоор)
              <input
                className="ax-input mt-2 w-full"
                maxLength={100}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
          )}
          {["revision", "report_payment"].includes(choice) && (
            <label>
              Тайлбар {choice === "revision" ? "(заавал)" : "(сонголтоор)"}
              <textarea
                className="ax-input mt-2 w-full"
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
          )}
          <div className="flex gap-2">
            <button
              className={buttonStyles()}
              disabled={
                busy || (choice === "revision" && message.trim().length < 3)
              }
              onClick={submit}
            >
              {busy ? "Илгээж байна…" : "Батлах"}
            </button>
            <button
              className={buttonStyles("secondary")}
              disabled={busy}
              onClick={() => setChoice("")}
            >
              Болих
            </button>
          </div>
        </BottomSheet>
      )}
      {error && <p role="alert">{error}</p>}
      <section className="ax-surface p-6">
        <h2 className="ax-h3 mb-3">Захиалгын түүх</h2>
        <ol className="flex flex-col gap-3">
          {data.history.map((h) => (
            <li key={h.id}>
              {h.label}{" "}
              <time className="text-sm text-muted">
                {workflowTime(h.created_at)}
              </time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
