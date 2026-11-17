"use client";
import { useRef, useState } from "react";
import {
  Body,
  PageHeader,
  Panel,
  btn as buttonStyles,
  field as fieldStyles,
} from "@/components/admin/ui";
const btn = (kind: "primary" | "secondary") =>
  kind === "primary" ? buttonStyles.primary : buttonStyles.ghost;
const field = fieldStyles.input;
const sections = {
  overview: "Тойм",
  customers: "Хэрэглэгчид",
  orders: "Захиалга ба шаардлага",
  projects: "Веб төслүүд",
  templates: "Factory загварууд",
  jobs: "Factory / интеграцын ажлууд",
  providers: "AI үйлчилгээ",
  qa: "QA тайлан",
  preview: "Preview",
  delivery: "Хүлээлгэн өгөх",
  access: "Dashboard эрх",
  sheets: "Google Sheets төлөв",
  subscriptions: "Захиалгын эрх",
  payments: "Төлбөрүүд",
  audit: "Аудит",
};
type Row = Record<string, unknown>;
type Data = {
  tables: Record<string, Row[]>;
  orders: Row[];
  services: Record<string, boolean>;
  asOf: string;
};
const object = (value: unknown): Row =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : {};
const text = (value: unknown) => (value == null ? "—" : String(value));
const labels: Record<string, string> = {
  not_submitted: "Илгээгээгүй",
  not_provisioned: "Үүсгээгүй",
  ready: "Бэлэн",
  pending: "Хүлээгдэж байна",
  queued: "Дараалалд",
  running: "Ажиллаж байна",
  completed: "Дууссан",
  blocked: "Оролцоо шаардлагатай",
  failed: "Амжилтгүй",
  error: "Алдаа",
  submitted: "Илгээсэн",
  awaiting_delivery: "Хүргэлт баталгаажаагүй",
  trial: "Үнэгүй туршилт",
  active: "Идэвхтэй",
  past_due: "Хугацаа хэтэрсэн",
  suspended: "Түр хязгаарлах бодлого",
  cancelled: "Цуцлагдсан",
  paid: "Provider баталгаажуулсан",
  invited: "Урилга илгээсэн",
  awaiting_approval: "Зөвшөөрөл хүлээж байна",
  awaiting_delivery_confirmation: "Хүргэлтийн баталгаа хүлээж байна",
  delivered: "Хүргэлт баталгаажсан",
};
const stamp = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleString("mn-MN", {
        timeZone: "Asia/Ulaanbaatar",
      })
    : "—";
function safeUrl(value: unknown) {
  try {
    const u = new URL(String(value));
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
function Json({ value }: { value: unknown }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-xl bg-surface-alt p-4 text-xs whitespace-pre-wrap [overflow-wrap:anywhere]">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
export function EcosystemConsole({
  initial,
  error: initialError,
}: {
  initial: Data | null;
  error?: string;
}) {
  const [data, setData] = useState(initial),
    [view, setView] = useState<keyof typeof sections>("overview"),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(initialError || ""),
    [editor, setEditor] = useState<{ siteId: string; value: string } | null>(
      null,
    );
  const keys = useRef(new Map<string, string>());
  async function reload() {
    const response = await fetch("/api/admin/ecosystem", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw Error(body.code || "ecosystem_unavailable");
    setData(body);
    setError("");
  }
  async function run(action: string, siteId?: string, payload: Row = {}) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const fingerprint = JSON.stringify({ action, siteId, payload });
      if (!keys.current.has(fingerprint))
        keys.current.set(fingerprint, crypto.randomUUID());
      const response = await fetch("/api/admin/ecosystem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          siteId,
          key: keys.current.get(fingerprint),
          data: payload,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.code || "operation_failed");
      keys.current.delete(fingerprint);
      setNotice(body.message || "Хүсэлт хадгалагдлаа.");
      await reload();
      return body;
    } catch (e) {
      setError(e instanceof Error ? e.message : "operation_failed");
    } finally {
      setBusy(false);
    }
  }
  async function process() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/ecosystem/process", {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.code || "worker_unavailable");
      setNotice(
        body.processed
          ? body.status === "completed"
            ? "Нэг ажил бодитоор дууслаа."
            : "Ажил баталгаажаагүй: " + body.code
          : "Бэлэн ажил алга.",
      );
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "worker_unavailable");
    } finally {
      setBusy(false);
    }
  }
  async function registry(
    operation: "sync" | "verify" | "approve" | "register",
    templateId?: string,
    template?: Row,
  ) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/ecosystem/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          key: crypto.randomUUID(),
          templateId,
          template,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.code || "factory_unavailable");
      setNotice(body.message);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "factory_unavailable");
    } finally {
      setBusy(false);
    }
  }
  const table = (name: string) => data?.tables[name] ?? [],
    sites = table("ecosystem_sites");
  const button = (
    title: string,
    action: string,
    site: Row,
    payload: Row = {},
  ) => (
    <button
      type="button"
      disabled={busy}
      className={btn("secondary")}
      onClick={() => void run(action, String(site.id), payload)}
    >
      {title}
    </button>
  );
  const siteCards = (render: (site: Row) => React.ReactNode) =>
    sites.length ? (
      sites.map((site) => (
        <Panel
          key={String(site.id)}
          title={text(
            data?.orders.find((o) => o.id === site.order_id)?.business_name ||
              site.id,
          )}
        >
          <div className="space-y-4 p-4">
            <p className="text-xs text-muted [overflow-wrap:anywhere]">
              site_id: {text(site.id)} · customer: {text(site.customer_id)}
            </p>
            {render(site)}
          </div>
        </Panel>
      ))
    ) : (
      <p className="rounded-card border border-line p-8 text-muted">
        Экосистемд холбосон сайт алга. “Захиалга ба шаардлага”-аас бодит
        захиалга сонгоно уу.
      </p>
    );
  return (
    <>
      <PageHeader
        title="AXORA экосистем"
        description="Factory, тусдаа dashboard, Sheets болон баталгаажсан төлбөрийн удирдлага."
        actions={
          <>
            <button
              disabled={busy}
              className={btn("secondary")}
              onClick={() => {
                setBusy(true);
                void reload()
                  .catch((e) => setError(e.message))
                  .finally(() => setBusy(false));
              }}
            >
              Шинэчлэх
            </button>
            <button
              disabled={busy}
              className={btn("primary")}
              onClick={() => void process()}
            >
              Нэг ажил боловсруулах
            </button>
          </>
        }
      />
      <Body>
        {view === "templates" ? (
          <Panel title="Factory registry-г удирдах">
            <div className="space-y-4 p-5">
              <button
                disabled={busy}
                className={btn("secondary")}
                onClick={() => void registry("sync")}
              >
                Factory registry татах
              </button>
              <p className="text-sm text-muted">
                Баталгаажуулалт, оноо болон зөвшөөрлийг зөвхөн Factory шалгана.
                Энэ нь сүүлд ажигласан mirror өгөгдөл.
              </p>
              <details>
                <summary>Бүртгэлийн metadata-г Factory-д илгээх</summary>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    try {
                      void registry(
                        "register",
                        undefined,
                        JSON.parse(
                          String(new FormData(e.currentTarget).get("json")),
                        ),
                      );
                    } catch {
                      setError("JSON формат буруу");
                    }
                  }}
                >
                  <textarea
                    name="json"
                    required
                    className={field + " min-h-48 font-mono text-xs"}
                  />
                  <button disabled={busy} className={btn("secondary")}>
                    Factory-д шалгуулж хадгалах
                  </button>
                </form>
              </details>
            </div>
          </Panel>
        ) : null}

        <nav
          aria-label="Экосистемийн хэсгүүд"
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {Object.entries(sections).map(([key, label]) => (
            <button
              key={key}
              className={btn(view === key ? "primary" : "secondary")}
              onClick={() => setView(key as keyof typeof sections)}
            >
              {label}
            </button>
          ))}
        </nav>
        {busy ? <p role="status">Хүсэлт ажиллаж байна…</p> : null}
        {notice ? (
          <p
            role="status"
            className="rounded-xl border border-line bg-surface p-4"
          >
            {notice}
          </p>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-line p-4 text-danger-ink"
          >
            {error} · Бодит ажиллагаа баталгаажаагүй. Migration болон
            үйлчилгээний тохиргоог шалгана уу.
          </div>
        ) : null}
        {!data ? (
          <p>Экосистемийн өгөгдөл уншигдаагүй; жишээ өгөгдөл ашиглахгүй.</p>
        ) : (
          <>
            {view === "overview" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Хэрэглэгч", table("ecosystem_customers").length],
                    ["Сайт", sites.length],
                    [
                      "Хүргэлт баталгаажсан",
                      sites.filter((s) => s.confirmed_delivery_at).length,
                    ],
                    [
                      "Оролцоо шаардлагатай",
                      table("ecosystem_tasks").filter((t) =>
                        ["blocked", "failed"].includes(String(t.status)),
                      ).length,
                    ],
                  ].map(([label, count]) => (
                    <Panel key={String(label)} title={String(label)}>
                      <p className="p-5 text-3xl font-bold">{count}</p>
                    </Panel>
                  ))}
                </div>
                <Panel title="Үйлчилгээний холболт">
                  <div className="space-y-2 p-5">
                    {Object.entries(data.services).map(([name, configured]) => (
                      <p key={name}>
                        {name}:{" "}
                        {configured
                          ? "Тохируулсан; live ажиллагааг тусад нь батална"
                          : "Тохируулаагүй"}
                      </p>
                    ))}
                    <p className="text-sm text-muted">
                      Туршилт зөвхөн Factory-ийн бодит хүлээлгэн өгсөн
                      баталгаанаас эхэлнэ. Код, build эсвэл preview нь туршилтын
                      эхлэл биш.
                    </p>
                  </div>
                </Panel>
              </>
            ) : null}
            {view === "customers"
              ? table("ecosystem_customers").map((c) => (
                  <Panel key={String(c.id)} title={text(c.name)}>
                    <div className="p-5">
                      <p>
                        {text(c.email)} · {text(c.phone)}
                      </p>
                      <p className="text-xs text-muted">{text(c.id)}</p>
                    </div>
                  </Panel>
                ))
              : null}
            {view === "orders" ? (
              <>
                <Panel title="Бодит захиалгыг экосистемд холбох">
                  <form
                    className="flex flex-wrap gap-3 p-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      void run("register", undefined, {
                        orderId: form.get("orderId"),
                      });
                    }}
                  >
                    <select name="orderId" className={field} required>
                      {data.orders.map((o) => (
                        <option key={String(o.id)} value={String(o.id)}>
                          {text(o.reference)} · {text(o.business_name)}
                        </option>
                      ))}
                    </select>
                    <button disabled={busy} className={btn("primary")}>
                      Холбох
                    </button>
                  </form>
                </Panel>
                {siteCards((s) => (
                  <>
                    <p>
                      Factory:{" "}
                      {labels[String(s.factory_status)] ||
                        text(s.factory_status)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={busy}
                        className={btn("secondary")}
                        onClick={() => {
                          const existing = object(s.factory_answers),
                            order = data.orders.find(
                              (o) => o.id === s.order_id,
                            );
                          setEditor({
                            siteId: String(s.id),
                            value: JSON.stringify(
                              {
                                answers: Object.keys(existing).length
                                  ? existing
                                  : {
                                      siteId: s.id,
                                      businessName: order?.business_name,
                                      contactEmail: order?.email,
                                      contactPhone: order?.phone,
                                    },
                                enabledModules: s.enabled_modules,
                              },
                              null,
                              2,
                            ),
                          });
                        }}
                      >
                        Factory шаардлагыг хянах
                      </button>
                      {button("Factory-д илгээх", "submit", s)}
                      {button("Явц / тохирох загвар авах", "poll", s)}
                      {button("Backend / Sheets бэлтгэх", "prepare_site", s)}
                    </div>
                    <details>
                      <summary>
                        Factory-ийн асуулт, үнэлгээ, дизайны үр дүн
                      </summary>
                      <Json value={s.factory_options} />
                    </details>
                  </>
                ))}
              </>
            ) : null}
            {editor ? (
              <Panel title="Factory API-д дамжуулах хариулт">
                <form
                  className="space-y-3 p-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    try {
                      const value = JSON.parse(editor.value);
                      void run("requirements", editor.siteId, value);
                    } catch {
                      setError("JSON формат буруу");
                    }
                  }}
                >
                  <p className="text-sm text-muted">
                    Дутуу хариултыг зохиохгүй. Тохирох загвар, асуулт болон
                    үнэлгээг Factory шийднэ. siteId-г өөрчилж болохгүй.
                  </p>
                  <textarea
                    value={editor.value}
                    onChange={(e) =>
                      setEditor({ ...editor, value: e.target.value })
                    }
                    className={field + " min-h-72 font-mono text-xs"}
                  />
                  <div className="flex gap-2">
                    <button disabled={busy} className={btn("primary")}>
                      Хадгалах
                    </button>
                    <button
                      type="button"
                      className={btn("secondary")}
                      onClick={() => setEditor(null)}
                    >
                      Хаах
                    </button>
                  </div>
                </form>
              </Panel>
            ) : null}
            {view === "projects"
              ? siteCards((s) => (
                  <>
                    <p>
                      {labels[String(s.factory_status)] ||
                        text(s.factory_status)}
                    </p>
                    <p>
                      Factory project: <code>{text(s.factory_project_id)}</code>
                    </p>
                    <form
                      className="grid gap-3 sm:grid-cols-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = new FormData(e.currentTarget);
                        void run("generate", String(s.id), {
                          templateId: form.get("templateId"),
                          designId: form.get("designId"),
                          provider: form.get("provider"),
                        });
                      }}
                    >
                      <label>
                        Factory санал болгосон template_id
                        <input name="templateId" required className={field} />
                      </label>
                      <label>
                        Factory design_id
                        <input name="designId" required className={field} />
                      </label>
                      <select name="provider" className={field}>
                        {[
                          "codex",
                          "claude-code",
                          "codex+claude-code",
                          "custom",
                        ].map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                      <button disabled={busy} className={btn("primary")}>
                        Factory generation дараалалд
                      </button>
                    </form>
                    <Json value={s.factory_options} />
                  </>
                ))
              : null}
            {view === "templates" ? (
              table("ecosystem_remote_registry").length ? (
                table("ecosystem_remote_registry")
                  .filter((t) => t.kind === "template")
                  .map((t) => (
                    <Panel
                      key={String(t.remote_id)}
                      title={text(object(t.body).name || t.remote_id)}
                    >
                      <div className="p-5">
                        <p>Factory төлөв: {text(object(t.body).status)}</p>
                        <p className="text-xs text-muted">
                          Ажигласан: {stamp(t.observed_at)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={busy}
                            className={btn("secondary")}
                            onClick={() =>
                              void registry("verify", String(t.remote_id))
                            }
                          >
                            Factory QA хүсэх
                          </button>
                          <button
                            disabled={busy}
                            className={btn("secondary")}
                            onClick={() =>
                              void registry("approve", String(t.remote_id))
                            }
                          >
                            Factory-ийн verification-г зөвшөөрөх
                          </button>
                        </div>
                        <Json value={t.body} />
                      </div>
                    </Panel>
                  ))
              ) : (
                <p>
                  Factory-оос баталгаажуулж татсан registry өгөгдөл алга. AXORA
                  загварын үнэлгээ, баталгаажуулалтыг давхар хийхгүй.
                </p>
              )
            ) : null}
            {view === "jobs" ? (
              <>
                {table("ecosystem_tasks").map((t) => (
                  <Panel key={String(t.id)} title={text(t.kind)}>
                    <div className="space-y-3 p-5">
                      <p>
                        {labels[String(t.status)] || text(t.status)} ·{" "}
                        {text(t.attempts)}/5 · {text(t.error_code)}
                      </p>
                      <p className="text-xs">site: {text(t.site_id)}</p>
                      {["blocked", "failed"].includes(String(t.status)) &&
                      Number(t.attempts) < 5 ? (
                        <button
                          disabled={busy}
                          className={btn("secondary")}
                          onClick={() =>
                            void run("retry_task", String(t.site_id), {
                              taskId: t.id,
                            })
                          }
                        >
                          Шалтгааныг зассаны дараа дахин оролдох
                        </button>
                      ) : null}
                    </div>
                  </Panel>
                ))}
                {siteCards((s) => (
                  <Json value={s.factory_jobs || []} />
                ))}
              </>
            ) : null}
            {view === "providers" ? (
              <Panel title="AI provider тохиргоо">
                <div className="space-y-3 p-5">
                  <p>
                    Codex, Claude Code, хосолсон болон custom provider нь тусдаа
                    Factory дээр тохируулагдана.
                  </p>
                  <p className="text-sm text-muted">
                    AXORA зөвхөн сайт бүрийн сонголтыг API-аар дамжуулна.
                    Түлхүүр браузерт ирэхгүй.
                  </p>
                  <p>
                    Factory API:{" "}
                    {data.services.factory
                      ? "Тохируулсан; live баталгаажуулалт тусдаа"
                      : "Тохируулаагүй"}
                  </p>
                </div>
              </Panel>
            ) : null}
            {view === "qa"
              ? siteCards((s) => (
                  <Json
                    value={
                      object(s.factory_snapshot).qa || { status: "unverified" }
                    }
                  />
                ))
              : null}
            {view === "preview"
              ? siteCards((s) => {
                  const p = object(object(s.factory_snapshot).preview),
                    url = safeUrl(p.url);
                  return (
                    <>
                      <p>{text(p.status || "Баталгаажаагүй")}</p>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={btn("secondary")}
                        >
                          Бодит preview нээх ↗
                        </a>
                      ) : (
                        <p>Бодит preview URL ирээгүй.</p>
                      )}
                      <p>Шалгасан: {stamp(p.accessibleAt)}</p>
                    </>
                  );
                })
              : null}
            {view === "delivery"
              ? siteCards((s) => (
                  <>
                    <p>
                      Factory:{" "}
                      {labels[String(s.factory_status)] ||
                        text(s.factory_status)}
                    </p>
                    <p>
                      Баталгаажсан хүргэлт: {stamp(s.confirmed_delivery_at)}
                    </p>
                    <div className="flex gap-2">
                      {button("Factory хүргэлтийг зөвшөөрөх", "approve", s)}
                      {button("Шинэ төлөв авах", "poll", s)}
                    </div>
                    <form
                      className="space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void run("confirm", String(s.id), {
                          reference: new FormData(e.currentTarget).get(
                            "reference",
                          ),
                        });
                      }}
                    >
                      <label>
                        Бодит хүлээлгэн өгсөн баримтын лавлагаа
                        <input
                          name="reference"
                          required
                          minLength={8}
                          className={field}
                        />
                      </label>
                      <button disabled={busy} className={btn("primary")}>
                        Factory дээр хүргэлт батлах
                      </button>
                    </form>
                    <p className="text-sm text-muted">
                      Factory-ийн баталгаажсан хариу ирсний дараа л 30 хоногийн
                      туршилт үүснэ.
                    </p>
                  </>
                ))
              : null}
            {view === "access"
              ? siteCards((s) => (
                  <>
                    <p>
                      Dashboard:{" "}
                      {labels[String(s.dashboard_status)] ||
                        text(s.dashboard_status)}
                    </p>
                    <p>Зөв хэрэглэгчийн UID: {text(s.dashboard_user_id)}</p>
                    {button(
                      "Баталгаажсан хүргэлтийн дараа эрх үүсгэх",
                      "provision_access",
                      s,
                    )}
                    <Json value={s.access_receipt} />
                    <p className="text-sm text-muted">
                      Хүлээн авагч endpoint байхгүй бол ажил blocked хэвээр
                      байна. Нэвтрэх эрхийг зохиож харуулахгүй.
                    </p>
                  </>
                ))
              : null}
            {view === "sheets"
              ? siteCards((s) => (
                  <>
                    <p>
                      Google Sheets:{" "}
                      {labels[String(s.sheets_status)] || text(s.sheets_status)}
                    </p>
                    <p>
                      Сүүлийн амжилттай синк: {stamp(s.last_successful_sync)}
                    </p>
                    <p>
                      Бизнес: {text(s.business_type)} · Modules:{" "}
                      {text((s.enabled_modules as string[]).join(", "))}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {button("Backend бэлтгэх", "prepare_site", s)}
                      {button(
                        "Sheets алдааг дахин шалгуулах",
                        "retry_sheets",
                        s,
                      )}
                    </div>
                    <p className="text-sm text-muted">
                      Google credential болон spreadsheet mapping нь сервер талд
                      үлдэнэ.
                    </p>
                  </>
                ))
              : null}
            {view === "subscriptions" ? (
              <>
                <Panel title="Үнийн нөхцөл">
                  <p className="p-5">
                    Хүргэлт баталгаажсанаас 30 хоног үнэгүй · Сар: 20,000 MNT ·
                    Жил: 228,000 MNT · Жилийн хөнгөлөлт: 5%.
                  </p>
                </Panel>
                {table("ecosystem_subscriptions").map((sub) => (
                  <Panel key={String(sub.site_id)} title={text(sub.site_id)}>
                    <div className="space-y-3 p-5">
                      <p>
                        {labels[String(sub.effective_status || sub.status)] ||
                          text(sub.status)}{" "}
                        · {text(sub.plan_id)}
                      </p>
                      <p>
                        Хүргэлт: {stamp(sub.confirmed_delivery_at)}
                        <br />
                        Туршилт дуусах: {stamp(sub.trial_ends_at)}
                        <br />
                        Төлсөн хугацаа дуусах: {stamp(sub.current_period_end)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {button("Хугацааны төгсгөлд цуцлах", "cancel", {
                          id: sub.site_id,
                        })}
                        {button("Сунгалтыг үргэлжлүүлэх", "resume", {
                          id: sub.site_id,
                        })}
                      </div>
                      <form
                        className="flex flex-wrap items-end gap-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const f = new FormData(e.currentTarget);
                          void run("policy", String(sub.site_id), {
                            autoSuspend: f.get("autoSuspend") === "on",
                            graceDays: Number(f.get("graceDays")),
                          });
                        }}
                      >
                        <label>
                          <input
                            name="autoSuspend"
                            type="checkbox"
                            defaultChecked={Boolean(sub.auto_suspend)}
                          />{" "}
                          Хугацаа хэтэрсэн бичих эрхийг хязгаарлах бодлого
                        </label>
                        <label>
                          Нэмэлт хоног
                          <input
                            type="number"
                            name="graceDays"
                            min={0}
                            max={60}
                            defaultValue={Number(sub.grace_days)}
                            className={field}
                          />
                        </label>
                        <button disabled={busy} className={btn("secondary")}>
                          Бодлого хадгалах
                        </button>
                      </form>
                      <p className="text-sm text-muted">
                        Бодлогын өөрчлөлт нь remote endpoint батлах хүртэл
                        бодитоор хэрэгжсэнд тооцогдохгүй. Сайт болон өгөгдөл
                        устгахгүй.
                      </p>
                    </div>
                  </Panel>
                ))}
              </>
            ) : null}
            {view === "payments" ? (
              <>
                {siteCards((s) => (
                  <form
                    className="flex flex-wrap gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run("invoice", String(s.id), {
                        plan: new FormData(e.currentTarget).get("plan"),
                      });
                    }}
                  >
                    <select name="plan" className={field}>
                      <option value="monthly">Сар · 20,000 MNT</option>
                      <option value="annual">Жил · 228,000 MNT</option>
                    </select>
                    <button disabled={busy} className={btn("primary")}>
                      Бодит provider invoice үүсгүүлэх
                    </button>
                  </form>
                ))}
                {table("ecosystem_invoices").map((i) => (
                  <Panel key={String(i.id)} title={text(i.id)}>
                    <div className="space-y-2 p-5">
                      <p>
                        {text(i.amount)} MNT ·{" "}
                        {labels[String(i.status)] || text(i.status)}
                      </p>
                      {safeUrl(i.payment_url) ? (
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href={safeUrl(i.payment_url)!}
                        >
                          Provider checkout ↗
                        </a>
                      ) : (
                        <p>Provider checkout хараахан үүсээгүй.</p>
                      )}
                    </div>
                  </Panel>
                ))}
                <Panel title="Зөвхөн provider баталгаажуулсан түүх">
                  <div className="p-5">
                    <Json value={table("ecosystem_payments")} />
                  </div>
                </Panel>
              </>
            ) : null}
            {view === "audit" ? (
              <Panel title="Экосистемийн аудит">
                <div className="p-5">
                  <Json value={table("ecosystem_audit")} />
                </div>
              </Panel>
            ) : null}
          </>
        )}
      </Body>
    </>
  );
}
