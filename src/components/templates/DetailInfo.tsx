import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import type { Template } from "@/lib/templates/types";

const LICENSE = "[Лицензийн нөхцөлийг энд оруулна — хувийн/арилжааны хэрэглээ, дахин борлуулах эсэх]";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-6">
      <h2 className="ax-h4">{title}</h2>
      {children}
    </section>
  );
}

/** Product information, all from the template's own record. Empty fields are left out rather than filled in. */
export function DetailInfo({ t }: { t: Template }) {
  const features: { icon: IconName; label: string; value: string }[] = [
    { icon: "layers", label: "Ангилал", value: `${t.category} загвар` },
    { icon: "file-text", label: "Формат", value: t.format },
    { icon: "lock", label: "Шаардлагатай", value: t.requirements },
    { icon: "users", label: "Хэнд тохирох", value: t.forWhom },
  ].filter((feature): feature is { icon: IconName; label: string; value: string } => !!feature.value);

  return (
    <div className="flex flex-col gap-8">
      {t.longDescription && <p className="text-[17px] leading-[1.7] text-muted">{t.longDescription}</p>}

      <Section title="Онцлог">
        <dl className="m-0 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.label} className="flex gap-3 rounded-control border border-line bg-surface p-4">
              <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-inner bg-soft text-brand">
                <Icon name={feature.icon} size={18} />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-extrabold text-muted">{feature.label}</dt>
                <dd className="m-0 mt-0.5 text-[14.5px] leading-snug font-semibold [overflow-wrap:anywhere]">{feature.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Section>

      {t.included.length > 0 && (
        <Section title="Багтсан файлууд">
          <ul className="m-0 flex list-none flex-col overflow-hidden rounded-control border border-line bg-surface p-0">
            {t.included.map((item, index) => (
              <li key={`${item}-${index}`} className={`flex min-h-12 items-center gap-3 px-4 py-2.5 text-[15px] leading-normal ${index ? "border-t border-line-soft" : ""}`}>
                <Icon name="circle-check" size={18} className="shrink-0 text-brand" />
                <span className="[overflow-wrap:anywhere]">{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {t.howTo.length > 0 && (
        <Section title="Яаж ашиглах">
          <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
            {t.howTo.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-3 text-[15px] leading-normal">
                <span aria-hidden="true" className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-soft text-[13px] font-extrabold text-brand">{index + 1}</span>
                <span className="[overflow-wrap:anywhere]">{step}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <p className="border-t border-line pt-4 text-sm leading-normal text-muted">Лиценз: {LICENSE}</p>
    </div>
  );
}
