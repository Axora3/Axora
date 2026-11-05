"use client";

import Link from "next/link";
import { useState } from "react";
import { Chat } from "@/components/icons";

const TABS = [
  {
    id: "reviews",
    label: "Сэтгэгдэл",
    title: "Сэтгэгдэл удахгүй нэмэгдэнэ",
    description: "Бодит хэрэглэгчийн зөвшөөрөлтэй сэтгэгдэл ирэхэд энд гарна.",
    slot: "Сэтгэгдлийн байр",
  },
  {
    id: "work",
    label: "Хийсэн ажил",
    title: "Хийсэн ажил удахгүй нэмэгдэнэ",
    description: "Хүлээлгэн өгсөн төслийг зөвшөөрөлтэйгээр энд нийтэлнэ.",
    slot: "Төслийн байр",
  },
] as const;

export function Trust() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("reviews");
  const cur = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <section aria-labelledby="trust-title" className="border-y border-line bg-soft">
      <div className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,40px)] py-14 min-[900px]:py-[104px]">
        <div className="ax-reveal flex flex-wrap items-end justify-between gap-4">
          <div className="flex max-w-[640px] flex-col gap-3">
            <h2 id="trust-title" className="text-[clamp(28px,3.4vw,44px)] leading-[1.12] font-extrabold tracking-[-0.025em]">
              Хэрэглэгчид ба <span className="serif">хийсэн ажил</span>
            </h2>
            <p className="text-[17px] leading-relaxed text-muted">
              Зөвхөн бодит хэрэглэгчийн зөвшөөрөлтэй сэтгэгдэл, хүлээлгэн өгсөн төслийг энд нийтэлнэ.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Агуулга"
            className="flex gap-1 rounded-xl border border-line bg-surface p-1"
          >
            {TABS.map((t) => {
              const on = t.id === tab;
              return (
                <button
                  key={t.id}
                  id={`trust-tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="trust-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  onKeyDown={(event) => {
                    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
                    if (!keys.includes(event.key)) return;
                    event.preventDefault();
                    const next = event.key === "Home" ? TABS[0] : event.key === "End" ? TABS[1] : TABS.find((item) => item.id !== tab)!;
                    setTab(next.id);
                    document.getElementById(`trust-tab-${next.id}`)?.focus();
                  }}
                  className={`ax-btn min-h-11 rounded-[9px] border-0 px-4 text-[14.5px] font-bold ${on ? "bg-band text-on-band" : "bg-transparent text-ink"}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div id="trust-panel" role="tabpanel" tabIndex={0} aria-labelledby={`trust-tab-${tab}`} className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-line bg-surface px-6 py-5">
            <span className="flex items-center gap-3.5">
              <span
                aria-hidden="true"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[13px] bg-soft text-brand"
              >
                <Chat size={22} />
              </span>
              <span className="flex flex-col gap-0.5">
                <strong className="text-[17px]">{cur.title}</strong>
                <span className="text-[14.5px] text-muted">{cur.description}</span>
              </span>
            </span>
            <Link
              href="/templates"
              className="ax-btn inline-flex min-h-12 items-center rounded-xl border border-line-strong bg-surface px-[18px] text-[15px] font-bold text-ink no-underline"
            >
              Загварууд үзэх
            </Link>
          </div>

          <div className="mt-3 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
            {[0, 1, 2].map((n) => (
              <div
                key={n}
                aria-hidden="true"
                className="flex min-h-[180px] flex-col gap-3 rounded-[20px] border-[1.5px] border-dashed border-line-mid p-6"
              >
                <span className="h-2.5 w-[88%] rounded-[5px] bg-line" />
                <span className="h-2.5 w-[72%] rounded-[5px] bg-line" />
                <span className="h-2.5 w-[80%] rounded-[5px] bg-line" />
                <span className="mt-auto flex items-center gap-2.5">
                  <span className="h-9 w-9 rounded-full bg-line" />
                  <span className="text-[13px] font-bold text-faint">{cur.slot}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
