"use client";

import { useState } from "react";
import { Check, ChevronDown } from "@/components/icons";
import type { Template } from "@/lib/templates/types";

const LICENSE = "[Лицензийн нөхцөлийг энд оруулна — хувийн/арилжааны хэрэглээ, дахин борлуулах эсэх]";

function Included({ items }: { items: string[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {items.map((x) => (
        <li key={x} className="flex gap-2.5 text-[15px] leading-normal">
          <Check size={18} strokeWidth={2.4} className="mt-0.5 shrink-0 text-brand" />
          {x}
        </li>
      ))}
    </ul>
  );
}

/**
 * Who it's for / what's included / how to use / licence.
 * Desktop shows all sections; phones get the accordion from the mobile design.
 */
export function DetailInfo({ t }: { t: Template }) {
  const [open, setOpen] = useState(0);
  const sections = [
    { title: "Хэнд тохирох", body: <p className="text-[15px] leading-relaxed text-muted">{t.forWhom || "—"}</p> },
    { title: "Юу багтсан", body: <Included items={t.included} /> },
    {
      title: "Яаж ашиглах",
      body: (
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {t.howTo.map((h, i) => (
            <li key={h} className="flex gap-3 text-[15px] leading-normal">
              <span className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-soft text-[13px] font-extrabold text-brand">{i + 1}</span>
              {h}
            </li>
          ))}
        </ol>
      ),
    },
    { title: "Лиценз", body: <p className="text-[15px] leading-relaxed text-muted">{LICENSE}</p> },
  ];

  return (
    <>
      <div className="hidden flex-col gap-[18px] min-[900px]:flex">
        {sections.slice(0, 3).map((s) => (
          <div key={s.title} className="flex flex-col gap-2">
            <h2 className="text-base font-extrabold">{s.title}</h2>
            {s.body}
          </div>
        ))}
        <p className="border-t border-line pt-3.5 text-sm leading-normal text-muted">Лиценз: {LICENSE}</p>
      </div>

      <section aria-label="Дэлгэрэнгүй мэдээлэл" className="rounded-[18px] border border-line bg-surface px-4 min-[900px]:hidden">
        {sections.map((s, i) => {
          const on = open === i;
          return (
            <div key={s.title} className={i < sections.length - 1 ? "border-b border-soft" : ""}>
              <h2>
                <button
                  type="button"
                  id={`acc-b-${i}`}
                  aria-expanded={on}
                  aria-controls={`acc-p-${i}`}
                  onClick={() => setOpen(on ? -1 : i)}
                  className="flex min-h-[58px] w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent p-0 text-left text-base font-extrabold text-ink"
                >
                  {s.title}
                  <ChevronDown size={18} strokeWidth={2.2} className="transition-transform duration-[250ms]" style={{ transform: on ? "rotate(180deg)" : "none" }} />
                </button>
              </h2>
              <div id={`acc-p-${i}`} role="region" aria-labelledby={`acc-b-${i}`} hidden={!on} className="ax-in-sm pb-4">
                {s.body}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
