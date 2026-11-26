"use client";
import { workflowTime } from "@/lib/order-workflow/display";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  AdminWorkflow,
  QuoteItem,
  Schedule,
} from "@/lib/order-workflow/contracts";
import { priceItems } from "@/lib/order-workflow/pricing";
import {
  orderWorkflowAction,
  orderScheduleAction,
} from "@/app/admin/order-workflow-actions";
import { QuoteBreakdown } from "@/components/order/CustomerOrderWorkflow";
import { buttonStyles } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/BottomSheet";
const inputClass = "ax-input mt-1 w-full";
export function AdminOrderWorkflow({ initial }: { initial: AdminWorkflow }) {
  const [data, setData] = useState(initial),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  const q = data.quote;
  const [editing, setEditing] = useState(false),
    [items, setItems] = useState<QuoteItem[]>(q?.items ?? []),
    [discount, setDiscount] = useState(q?.discount ?? 0),
    [days, setDays] = useState<string>(String(q?.estimated_effort_days ?? "")),
    [notes, setNotes] = useState(q?.notes ?? ""),
    [reason, setReason] = useState(""),
    [customerNote, setCustomerNote] = useState(""),
    [resolved, setResolved] = useState(false);
  const [proposal, setProposal] = useState<{
      suggestion: Schedule;
      revision: number;
      effortDays: number | null;
      activeCount: number;
      queuedCount: number;
    } | null>(null),
    [deadline, setDeadline] = useState(""),
    [amount, setAmount] = useState(""),
    [url, setUrl] = useState(data.project?.delivery_url ?? ""),
    [progress, setProgress] = useState(data.project?.progress_percent ?? 0),
    [remaining, setRemaining] = useState(
      data.project?.remaining_effort_days ?? 0,
    ),
    [priority, setPriority] = useState(data.project?.queue_priority ?? 0);
  async function run(action: string, input: Record<string, unknown> = {}) {
    setBusy(true);
    setMessage("");
    try {
      const r = await orderWorkflowAction({
        orderId: data.order.id,
        key: crypto.randomUUID(),
        action,
        input,
      });
      if (r.ok) {
        setData(r.workflow);
        setEditing(false);
        setProposal(null);
        setReason("");
        setMessage("Хадгаллаа.");
        router.refresh();
      } else setMessage(r.message);
    } catch {
      setMessage("Холболтоо шалгаад мэдээллээ шинэчилнэ үү.");
    } finally {
      setBusy(false);
    }
  }
  async function prepare() {
    setBusy(true);
    setMessage("");
    try {
      const result = await orderScheduleAction(data.order.id);
      setProposal(result);
      setDeadline(result?.suggestion.suggestedDeadline ?? "");
      setAmount(String(q?.total ?? ""));
      if (!result) setMessage("Хугацааны санал ачаалагдсангүй.");
    } catch {
      setMessage("Хугацааны санал ачаалагдсангүй. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  const paid = data.order.payment_status === "paid",
    p = data.project,
    closed = !!p?.delivered_at || data.order.status === "cancelled";
  const totals = (() => {
    try {
      return priceItems(items, discount);
    } catch {
      return null;
    }
  })();
  return (
    <section
      className="rounded-2xl border border-line-soft bg-surface p-5 flex flex-col gap-5"
      aria-label="Захиалгын ажиллагаа"
    >
      <header className="flex flex-wrap justify-between gap-3">
        <h2 className="text-xl font-bold">Үнийн санал, төлбөр, хөгжүүлэлт</h2>
        {data.trackingPath && (
          <Link
            className={buttonStyles("secondary")}
            href={data.trackingPath}
            target="_blank"
            rel="noreferrer"
          >
            Хэрэглэгчийн хуудас
          </Link>
        )}
      </header>
      <p>
        Үнийн санал: <strong>{q?.status ?? "Үүсээгүй"}</strong> · хувилбар{" "}
        {q?.version ?? 0} · төлбөр {paid ? "баталгаажсан" : "баталгаажаагүй"}
      </p>
      {data.customerRequests?.map((r, i) => (
        <p key={i} className="rounded-lg bg-soft p-3">
          Хэрэглэгчийн засварын хүсэлт: {r.message}
        </p>
      ))}
      {q && <QuoteBreakdown quote={q} />}
      {q?.review_flags?.length ? (
        <ul className="list-disc pl-5 text-sm">
          {q.review_flags.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      ) : null}
      {!paid && q?.status !== "accepted" && !closed && (
        <>
          <button
            className={buttonStyles("secondary")}
            disabled={busy}
            onClick={() => {
              setItems(q?.items ?? []);
              setEditing(!editing);
            }}
          >
            Үнийн саналын шинэ хувилбар
          </button>
          {editing && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted">
                Мөр бүрийн нэгж үнэ, тоо болон төлбөрийн давтамжийг шалгана.
                Багцад орсон функцийг нэмэлтээр тооцохгүй.
              </p>
              {items.map((item, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-xl border border-line-soft p-3 sm:grid-cols-2"
                >
                  <label>
                    Үйлчилгээ
                    <input
                      className={inputClass}
                      value={item.label}
                      onChange={(e) =>
                        setItems(
                          items.map((x, j) =>
                            i === j ? { ...x, label: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Төлбөр
                    <select
                      className={inputClass}
                      value={item.billing}
                      onChange={(e) =>
                        setItems(
                          items.map((x, j) =>
                            i === j
                              ? {
                                  ...x,
                                  billing: e.target
                                    .value as QuoteItem["billing"],
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      <option value="one_time">Нэг удаа</option>
                      <option value="monthly">Сар бүр</option>
                      <option value="external">Бусад зардал</option>
                    </select>
                  </label>
                  <label>
                    Тоо
                    <input
                      type="number"
                      min="1"
                      className={inputClass}
                      value={item.quantity}
                      onChange={(e) =>
                        setItems(
                          items.map((x, j) =>
                            i === j
                              ? { ...x, quantity: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Нэгж үнэ (₮)
                    <input
                      type="number"
                      min="0"
                      className={inputClass}
                      value={item.unitPrice}
                      onChange={(e) =>
                        setItems(
                          items.map((x, j) =>
                            i === j
                              ? { ...x, unitPrice: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    className={buttonStyles("quiet")}
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                  >
                    Мөр хасах
                  </button>
                </div>
              ))}
              <button
                className={buttonStyles("secondary")}
                onClick={() =>
                  setItems([
                    ...items,
                    {
                      kind: "custom",
                      code: "custom",
                      label: "Нэмэлт ажил",
                      quantity: 1,
                      unitPrice: 0,
                      billing: "one_time",
                    },
                  ])
                }
              >
                Мөр нэмэх
              </button>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  Хөнгөлөлт (₮)
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </label>
                <label>
                  Хөгжүүлэлтийн ажлын өдөр
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    className={inputClass}
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                  />
                </label>
              </div>
              <label>
                Хэрэглэгчид харуулах тайлбар
                <textarea
                  className={inputClass}
                  maxLength={4000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <p>
                Нэг удаагийн нийт:{" "}
                {totals?.total.toLocaleString("mn-MN") ?? "Утгаа шалгана уу."}₮
                · сар бүр {totals?.monthlyTotal ?? 0}₮
              </p>
              <label>
                Өөрчилсөн шалтгаан (заавал)
                <textarea
                  className={inputClass}
                  maxLength={2000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button
                className={buttonStyles("primary")}
                disabled={busy || !totals || reason.trim().length < 3}
                onClick={() =>
                  run("save_quote", {
                    expectedVersion: q?.version ?? 0,
                    items,
                    discount,
                    effortDays: days ? Number(days) : null,
                    notes,
                    reason,
                  })
                }
              >
                Шинэ хувилбарыг хадгалах
              </button>
            </div>
          )}
          {q?.status === "draft" && (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={resolved}
                  onChange={(e) => setResolved(e.target.checked)}
                />{" "}
                Анкет, задаргаа, давхардал болон тусгай шаардлагыг хянасан
              </label>
              <button
                className={buttonStyles("primary")}
                disabled={busy || !resolved || !q.total}
                onClick={() =>
                  run("send_quote", {
                    version: q.version,
                    reviewResolved: resolved,
                  })
                }
              >
                Үнийн саналыг баталж илгээх
              </button>
            </>
          )}
        </>
      )}
      {data.paymentReport && (
        <p className="rounded-lg bg-soft p-3">
          Шилжүүлгийн мэдэгдэл: {data.paymentReport.status} ·{" "}
          {data.paymentReport.reference} · {data.paymentReport.note}
        </p>
      )}
      {q?.status === "accepted" &&
        !paid &&
        data.paymentReport?.status === "reported" &&
        !closed && (
          <>
            <button
              className={buttonStyles("primary")}
              disabled={busy}
              onClick={prepare}
            >
              Төлбөр баталгаажуулах · хугацааны санал авах
            </button>
            <label>
              Шилжүүлгийг тодруулах тайлбар
              <textarea
                className={inputClass}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2">{['Төлбөр зөрүүтэй','Төлбөр олдоогүй','Дахин мэдээлэл хүсэх'].map(label=><button key={label} className={buttonStyles('secondary')} disabled={busy||reason.trim().length<3} onClick={()=>run('review_payment',{message:label+': '+reason})}>{label}</button>)}</div>
          </>
        )}
      {proposal && (
        <BottomSheet
          open={true}
          onClose={() => {
            if (!busy) setProposal(null);
          }}
          title="Төлбөр баталгаажуулах"
          description={
            data.order.full_name +
            " · " +
            data.order.business_name +
            " · " +
            data.order.reference +
            (data.customerEmail ? " · " + data.customerEmail : "")
          }
        >
          <div className="flex flex-col gap-3">
            <h3 className="font-bold">Банкны хуулгатай тулгаж батална уу</h3>
            <p>Хүлээн авах ёстой дүн: {q?.total?.toLocaleString('mn-MN')}₮ · Гүйлгээний утга: {data.order.reference}</p>
            <p>Идэвхтэй төсөл: {proposal.activeCount} · Дараалалд: {proposal.queuedCount}</p>
            <p>
              Тооцоолсон хугацаа: {proposal.effortDays ?? "Тодорхойгүй"} ажлын
              өдөр + нөөц. Дараалалд {proposal.suggestion.workloadCount} төсөл.
            </p>
            <p>
              Санал болгосон огноо:{" "}
              {proposal.suggestion.suggestedDeadline ?? "Админ сонгоно"}
            </p>
            {proposal.suggestion.explanations.map((s, i) => (
              <p key={i} className="text-sm text-muted">
                {s}
              </p>
            ))}
            <label>
              Бодитоор орсон дүн (₮)
              <input
                className={inputClass}
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              Батлах дуусах огноо
              <input
                className={inputClass}
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </label>
            <label>
              Огноо өөрчилсөн / нягталсан шалтгаан
              <textarea
                className={inputClass}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <label>
              Хэрэглэгчид харагдах тайлбар (сонголтоор)
              <textarea
                className={inputClass}
                maxLength={2000}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
              />
            </label>
            <button
              className={buttonStyles("primary")}
              disabled={busy || !deadline || Number(amount) !== q?.total}
              onClick={() =>
                run("verify_payment", {
                  amount: Number(amount),
                  deadline,
                  scheduleRevision: proposal.revision,
                  customerNote,
                  reason,
                })
              }
            >
              Төлбөр болон дуусах огноог батлах
            </button>
            <button
              className={buttonStyles("secondary")}
              disabled={busy}
              onClick={() => setProposal(null)}
            >
              Болих
            </button>
            {message && <p role="alert">{message}</p>}
          </div>
        </BottomSheet>
      )}
      {paid && p && !closed && (
        <div className="flex flex-col gap-4 border-t border-line-soft pt-4">
          <p>
            Төсөл: {p.status} · дуусах огноо {data.order.agreed_deadline ?? "—"}
          </p>
          {p.status === "planning" && (
            <button
              className={buttonStyles("primary")}
              disabled={busy}
              onClick={() => run("start")}
            >
              Ажил эхлэх · бодит эхэлсэн огноог бүртгэх
            </button>
          )}
          {["in_progress", "review", "completed"].includes(p.status) && (
            <label>
              Веб сайтын HTTPS холбоос
              <input
                className={inputClass}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
          )}
          {["in_progress", "review"].includes(p.status) && (
            <button
              className={buttonStyles("primary")}
              disabled={busy}
              onClick={() => run("complete", { url })}
            >
              Хөгжүүлэлт дууссаныг бүртгэх
            </button>
          )}
          {p.status === "completed" && (
            <button
              className={buttonStyles("primary")}
              disabled={busy || !url.startsWith("https://")}
              onClick={() => run("deliver", { url })}
            >
              Хэрэглэгчид хүлээлгэн өгөх
            </button>
          )}
          {p.status !== "completed" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <label>
                  Явц (%)
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    max="99"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                  />
                </label>
                <label>
                  Үлдсэн ажлын өдөр
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    value={remaining}
                    onChange={(e) => setRemaining(Number(e.target.value))}
                  />
                </label>
                <label>
                  Дарааллын эрэмбэ (бага нь эхэлж)
                  <input
                    className={inputClass}
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                  />
                </label>
              </div>
              <button
                className={buttonStyles("secondary")}
                disabled={busy}
                onClick={() =>
                  run("update_progress", {
                    progress,
                    remainingDays: remaining,
                    priority,
                  })
                }
              >
                Явц, дараалал хадгалах
              </button>
              <label>
                Шинэ дуусах огноо
                <input
                  className={inputClass}
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </label>
              <label>
                Өөрчлөх шалтгаан
                <textarea
                  className={inputClass}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button
                className={buttonStyles("secondary")}
                disabled={busy || !deadline || reason.trim().length < 3}
                onClick={() => run("change_deadline", { deadline, reason })}
              >
                Огноог өөрчилж мэдэгдэх
              </button>
            </>
          )}
        </div>
      )}
      {!closed && (
        <details>
          <summary>Захиалга цуцлах</summary>
          <label>
            Шалтгаан
            <textarea
              className={inputClass}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <p className="text-sm">
            Төлсөн мөнгийг автоматаар буцаахгүй. Буцаалтын асуудлыг тусад нь
            шийднэ.
          </p>
          <button
            className={buttonStyles("danger")}
            disabled={busy || reason.trim().length < 3}
            onClick={() => run("cancel", { reason })}
          >
            Цуцлалтыг бүртгэх
          </button>
        </details>
      )}
      {message && <p role="status">{message}</p>}
      <details>
        <summary>Үнийн хувилбар, имэйлийн төлөв, түүх</summary>
        <div className="mt-4 flex flex-col gap-3">
          {data.quotes.map((v) => (
            <p key={v.id}>
              Хувилбар {v.version} · {v.status} · {v.total ?? "Хяналтад"}₮
            </p>
          ))}
          {data.emailEvents.map((m) => (
            <div key={m.id} className="rounded-lg border border-line-soft p-3">
              <p>
                {m.event_type} · {m.status} · оролдлого {m.attempts}
                {m.last_error ? ` · ${m.last_error}` : ""}
              </p>
              {m.provider_message_id && (
                <p className="break-all text-xs text-muted">
                  SMTP Message-ID: {m.provider_message_id} · Сервер хүлээн авсан
                  нь inbox хүргэлтийн баталгаа биш.
                </p>
              )}
              {m.status === "failed" && (
                <>
                  <label>
                    Дахин илгээх тайлбар
                    <input
                      className={inputClass}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <button
                    className={buttonStyles("secondary")}
                    disabled={
                      busy ||
                      (m.last_error === "delivery_uncertain" &&
                        reason.trim().length < 3)
                    }
                    onClick={() => run("retry_email", { id: m.id, reason })}
                  >
                    Имэйл дахин илгээх
                  </button>
                </>
              )}
            </div>
          ))}
          {data.history.map((h) => (
            <p key={h.id}>
              {h.label} · {workflowTime(h.created_at)}
            </p>
          ))}
        </div>
      </details>
    </section>
  );
}
