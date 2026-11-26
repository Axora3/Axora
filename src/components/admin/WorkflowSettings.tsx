"use client";
import { useState } from "react";
import { z } from "zod";
import { workflowSettingsSchema } from "@/lib/order-workflow/contracts";
import { FEATURE_LABELS } from "@/lib/order-workflow/defaults";
import { saveWorkflowSettingsAction } from "@/app/admin/order-workflow-actions";
import { buttonStyles } from "@/components/ui/button";
type Settings = z.infer<typeof workflowSettingsSchema>;
function NumberField({
  label,
  value,
  onChange,
  nullable = false,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
  nullable?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        className="ax-input w-full"
        type="number"
        min="0"
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            e.target.value === "" && nullable ? null : Number(e.target.value),
          )
        }
      />
    </label>
  );
}
export function WorkflowSettings({
  initial,
  version: initialVersion,
}: {
  initial: Settings;
  version: string;
}) {
  const [s, set] = useState(initial),
    [version, setVersion] = useState(initialVersion),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [holidayText, setHolidayText] = useState(
    initial.scheduling.holidays.join(","),
  );
  const pricing = (patch: Partial<Settings["pricing"]>) =>
    set({ ...s, pricing: { ...s.pricing, ...patch } });
  const scheduling = (patch: Partial<Settings["scheduling"]>) =>
    set({ ...s, scheduling: { ...s.scheduling, ...patch } });
  async function save() {
    setBusy(true);
    try {
      const r = await saveWorkflowSettingsAction({
        ...s,
        scheduling: {
          ...s.scheduling,
          holidays: holidayText
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        },
        expectedVersion: version,
      });
      setMessage(r.message);
      if (r.ok && r.version) setVersion(r.version);
    } catch {
      setMessage("Холболтоо шалгаад дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-col gap-6 p-5">
      <p className="text-sm text-muted">
        Үнэ нь төгрөгөөр, хугацаа нь ажлын өдрөөр. Зөвшөөрсөн үнийн саналууд
        хувилбараараа хадгалагдана.
      </p>
      <label>
        <input
          type="checkbox"
          checked={s.pricing.enabled}
          onChange={(e) => pricing({ enabled: e.target.checked })}
        />{" "}
        Автомат үнийн тооцоолол
      </label>
      {s.pricing.packages.map((p, index) => (
        <fieldset
          key={p.id}
          className="rounded-xl border border-line-soft p-4 flex flex-col gap-4"
        >
          <legend className="font-bold px-2">{p.label}</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                "basePrice",
                "includedPages",
                "includedRevisions",
                "minDays",
                "maxDays",
              ] as const
            ).map((key, i) => (
              <NumberField
                key={key}
                label={
                  [
                    "Үнэ (₮)",
                    "Багтсан хуудас",
                    "Багтсан засвар",
                    "Доод хугацаа",
                    "Төлөвлөх дээд хугацаа",
                  ][i]
                }
                value={p[key]}
                onChange={(n) =>
                  pricing({
                    packages: s.pricing.packages.map((item, j) =>
                      j === index ? { ...item, [key]: n ?? 0 } : item,
                    ),
                  })
                }
              />
            ))}
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-bold">
              Багцад багтсан боломжууд
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(FEATURE_LABELS).map(([id, label]) => (
                <label key={id} className="text-sm">
                  <input
                    type="checkbox"
                    checked={p.includedFeatures.includes(id)}
                    onChange={(e) =>
                      pricing({
                        packages: s.pricing.packages.map((item, j) =>
                          j === index
                            ? {
                                ...item,
                                includedFeatures: e.target.checked
                                  ? [...item.includedFeatures, id]
                                  : item.includedFeatures.filter(
                                      (x) => x !== id,
                                    ),
                              }
                            : item,
                        ),
                      })
                    }
                  />{" "}
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </fieldset>
      ))}
      <fieldset className="flex flex-col gap-4">
        <legend className="font-bold mb-3">
          Нэмэлт функцийн үнэ, ажлын өдөр
        </legend>
        {s.pricing.features.map((f, index) => (
          <div
            key={f.id}
            className="grid items-end gap-3 border-b border-line-soft pb-3 sm:grid-cols-[1fr_150px_150px]"
          >
            <span>{f.label}</span>
            <NumberField
              label="Үнэ (₮)"
              value={f.unitPrice}
              onChange={(n) =>
                pricing({
                  features: s.pricing.features.map((x, j) =>
                    j === index ? { ...x, unitPrice: n ?? 0 } : x,
                  ),
                })
              }
            />
            <NumberField
              label="Ажлын өдөр"
              value={f.durationDays}
              onChange={(n) =>
                pricing({
                  features: s.pricing.features.map((x, j) =>
                    j === index ? { ...x, durationDays: n ?? 0 } : x,
                  ),
                })
              }
            />
          </div>
        ))}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(
          [
            "additionalPagePrice",
            "additionalPageDays",
            "discountPercent",
            "rushPercent",
            "monthlyMaintenancePrice",
            "extraRevisionPrice",
            "extraRevisionDays",
          ] as const
        ).map((key, index) => (
          <NumberField
            key={key}
            nullable={key === "extraRevisionDays"}
            label={
              [
                "Нэмэлт хуудас (₮)",
                "Нэмэлт хуудасны өдөр",
                "Хөнгөлөлт (%)",
                "Яаралтай нэмэгдэл (%)",
                "Сарын арчилгаа (₮)",
                "Нэмэлт засвар (₮)",
                "Нэмэлт засварын өдөр (хоосон = админ хянана)",
              ][index]
            }
            value={s.pricing[key]}
            onChange={(n) => pricing({ [key]: n })}
          />
        ))}
      </div>
      <fieldset className="flex flex-col gap-4">
        <legend className="font-bold mb-3">
          Ажлын дараалал · Asia/Ulaanbaatar
        </legend>
        <label>
          <input
            type="checkbox"
            checked={s.scheduling.enabled}
            onChange={(e) => scheduling({ enabled: e.target.checked })}
          />{" "}
          Автомат хугацааны санал
        </label>
        <div className="flex flex-wrap gap-4">
          {["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"].map((d, i) => (
            <label key={d}>
              <input
                type="checkbox"
                checked={s.scheduling.workingDays.includes(i + 1)}
                onChange={(e) =>
                  scheduling({
                    workingDays: e.target.checked
                      ? [...s.scheduling.workingDays, i + 1]
                      : s.scheduling.workingDays.filter((n) => n !== i + 1),
                  })
                }
              />{" "}
              {d}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Зэрэг хөгжүүлэх төсөл"
            value={s.scheduling.maxParallelProjects}
            onChange={(n) => scheduling({ maxParallelProjects: n })}
          />
          <NumberField
            label="Нөөц ажлын өдөр"
            value={s.scheduling.bufferWorkingDays}
            onChange={(n) => scheduling({ bufferWorkingDays: n ?? 0 })}
          />
          <label className="flex flex-col gap-1 text-sm">
            Дарааллын дүрэм
            <select
              className="ax-input"
              value={s.scheduling.queueStrategy}
              onChange={(e) =>
                scheduling({
                  queueStrategy: e.target
                    .value as Settings["scheduling"]["queueStrategy"],
                })
              }
            >
              <option value="fifo">FIFO — өмнөх захиалга эхэлж</option>
              <option value="deadline">Амласан огноогоор</option>
              <option value="priority">Админы эрэмбээр</option>
            </select>
          </label>
        </div>
        <label className="text-sm">
          Амралтын нэмэлт огноо (YYYY-MM-DD, таслалаар)
          <input
            className="ax-input mt-1 w-full"
            value={holidayText}
            onChange={(e) => setHolidayText(e.target.value)}
          />
        </label>
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="font-bold mb-3">Банкны мэдээлэл</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["name", "account", "holder"] as const).map((key, i) => (
            <label key={key} className="text-sm">
              {["Банк", "Данс / IBAN", "Данс эзэмшигч"][i]}
              <input
                className="ax-input mt-1 w-full"
                value={s.bank[key]}
                onChange={(e) =>
                  set({
                    ...s,
                    bank: { ...s.bank, [key]: e.target.value },
                    bankVerified: false,
                  })
                }
              />
            </label>
          ))}
        </div>
        <label className="text-sm">
          Нэмэлт заавар
          <textarea
            className="ax-input mt-1 w-full"
            maxLength={1000}
            value={s.bankInstructions}
            onChange={(e) => set({ ...s, bankInstructions: e.target.value })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={s.bankVerified}
            onChange={(e) => set({ ...s, bankVerified: e.target.checked })}
          />{" "}
          Банк, данс, эзэмшигчийг шалгаж баталгаажуулсан
        </label>
        <p className="text-sm text-muted">
          Хэрэглэгч үнийн саналыг зөвшөөрсний дараа зөвхөн баталгаажсан банк
          харагдана.
        </p>
      </fieldset>
      <button
        className={buttonStyles("primary")}
        disabled={busy}
        onClick={save}
      >
        {busy ? "Хадгалж байна…" : "Тохиргоо хадгалах"}
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
