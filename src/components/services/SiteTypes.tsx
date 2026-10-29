"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check } from "@/components/icons";
import { useBuilder } from "@/components/builder/BuilderProvider";
import type { BusinessType } from "@/lib/builder/config";

type T = {
  id: string;
  b: BusinessType;
  label: string;
  desc: string;
  brand: string;
  headline: string;
  cta: string;
  bg: string;
  text: string;
  primary: string;
  soft: string;
  rows: { n: string; p: string }[];
  parts: string[];
};

const TYPES: T[] = [
  { id: "intro", b: "cafe", label: "Бизнесийн танилцуулга", desc: "Байгууллага, үйлчилгээгээ ойлгомжтой танилцуулах веб.", brand: "Нарс ХХК", headline: "Найдвартай түнш.", cta: "Холбогдох", bg: "#F5F8FA", text: "#14212B", primary: "#1F5F8B", soft: "#E3ECF3", rows: [{ n: "Бидний тухай", p: "" }, { n: "Үйлчилгээ", p: "" }, { n: "Холбоо барих", p: "" }], parts: ["Нүүр, танилцуулга", "Үйлчилгээний жагсаалт", "Холбоо барих, газрын зураг", "FAQ"] },
  { id: "cafe", b: "cafe", label: "Кафе / QR меню", desc: "Меню, үнэ, ажиллах цагаа утсаар нээхэд шууд харагдана.", brand: "Уул кофе", headline: "Өглөөг амттай эхлүүл.", cta: "Меню үзэх", bg: "#FBF7EF", text: "#2B1A12", primary: "#8A4B2E", soft: "#F1E4D2", rows: [{ n: "Латте", p: "7,500₮" }, { n: "Американо", p: "6,000₮" }, { n: "Круассан", p: "5,500₮" }], parts: ["Ангилалтай меню", "QR кодоор нээгдэх", "Ажиллах цаг, байршил", "Messenger холбоос"] },
  { id: "shop", b: "shop", label: "Онлайн дэлгүүр", desc: "Бүтээгдэхүүнээ ангиллаар харуулж, захиалга авна.", brand: "Ноос", headline: "Монгол ноолуур.", cta: "Дэлгүүр", bg: "#FAF8FD", text: "#221A30", primary: "#6A4C9C", soft: "#EEE8F7", rows: [{ n: "Цамц", p: "189,000₮" }, { n: "Ороолт", p: "79,000₮" }, { n: "Малгай", p: "49,000₮" }], parts: ["Бүтээгдэхүүний каталог", "Ангилал, хайлт", "Захиалгын форм", "Онлайн төлбөр (сонголтоор)"] },
  { id: "portfolio", b: "portfolio", label: "Portfolio", desc: "Ажлаа цэгцтэй харуулж, шинэ захиалагч татна.", brand: "Таны Нэр", headline: "Брэнд ба веб дизайнер.", cta: "Ажлууд", bg: "#FFFFFF", text: "#111111", primary: "#111111", soft: "#F0F0F0", rows: [{ n: "Брэнд төсөл", p: "" }, { n: "Веб дизайн", p: "" }, { n: "Хэвлэл", p: "" }], parts: ["Ажлын жагсаалт", "Төсөл бүрийн хуудас", "Танилцуулга, ур чадвар", "Холбогдох форм"] },
  { id: "booking", b: "beauty", label: "Цаг захиалга", desc: "Үйлчлүүлэгч үйлчилгээ, цагаа өөрөө сонгоно.", brand: "Gloss студи", headline: "Таны цаг, таны гоо сайхан.", cta: "Цаг авах", bg: "#FBF4EB", text: "#2B1A14", primary: "#A9472E", soft: "#F3E3D3", rows: [{ n: "Үс засалт", p: "35,000₮" }, { n: "Маникюр", p: "40,000₮" }, { n: "Арьс арчилгаа", p: "60,000₮" }], parts: ["Үйлчилгээ, үнэ, хугацаа", "Өдөр, цаг сонгох", "Баталгаажуулах суваг", "Ажилтны хуваарь (сонголтоор)"] },
];

export function SiteTypes() {
  const [id, setId] = useState("intro");
  const [anim, setAnim] = useState(0);
  const { setType } = useBuilder();
  const router = useRouter();
  const cur = TYPES.find((t) => t.id === id)!;

  function onKey(e: React.KeyboardEvent, idx: number) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = TYPES[(idx + dir + TYPES.length) % TYPES.length];
    setId(next.id);
    setAnim((a) => a + 1);
    document.getElementById(`sv-tab-${next.id}`)?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label="Вебийн төрөл" className="ax-scroll -mx-[clamp(16px,4vw,40px)] mt-4 gap-2 px-[clamp(16px,4vw,40px)] pb-1 min-[900px]:mx-0 min-[900px]:flex-wrap min-[900px]:px-0">
        {TYPES.map((t, idx) => {
          const on = t.id === id;
          return (
            <button
              key={t.id}
              id={`sv-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="sv-panel"
              tabIndex={on ? 0 : -1}
              onKeyDown={(e) => onKey(e, idx)}
              onClick={() => {
                if (!on) {
                  setId(t.id);
                  setAnim((a) => a + 1);
                }
              }}
              className="ax-btn min-h-11 shrink-0 rounded-xl px-4 text-sm font-bold"
              style={{ background: on ? "var(--ax-band)" : "var(--ax-surface)", color: on ? "var(--ax-on-band)" : "var(--ax-ink)", border: on ? "1px solid var(--ax-band)" : "1px solid var(--ax-line)" }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div id="sv-panel" role="tabpanel" aria-labelledby={`sv-tab-${cur.id}`} className="mt-3 flex flex-col gap-4 rounded-[22px] border border-line bg-surface p-[18px] min-[900px]:p-8">
        <div key={anim} className="ax-slide flex items-start gap-3.5 min-[900px]:gap-10">
          <div
            aria-hidden="true"
            className="ax-light flex h-[236px] w-[132px] shrink-0 flex-col gap-[7px] overflow-hidden rounded-[22px] border-[5px] border-band px-[9px] py-3 min-[900px]:h-[360px] min-[900px]:w-[200px] min-[900px]:gap-2.5 min-[900px]:rounded-[30px] min-[900px]:border-[7px] min-[900px]:px-3.5 min-[900px]:py-4"
            style={{ background: cur.bg, color: cur.text }}
          >
            <span className="flex items-center gap-[5px] text-[8.5px] font-extrabold min-[900px]:text-xs">
              <span className="h-[11px] w-[11px] rounded min-[900px]:h-4 min-[900px]:w-4" style={{ background: cur.primary }} />
              {cur.brand}
            </span>
            <span className="text-[13px] leading-[1.1] font-extrabold min-[900px]:text-xl">{cur.headline}</span>
            <span className="self-start rounded-[5px] px-2 py-[5px] text-[8px] font-bold text-white min-[900px]:rounded-lg min-[900px]:px-3 min-[900px]:py-2 min-[900px]:text-xs" style={{ background: cur.primary }}>
              {cur.cta}
            </span>
            <span className="mt-1 flex flex-col gap-1 min-[900px]:gap-1.5">
              {cur.rows.map((r) => (
                <span key={r.n} className="flex justify-between gap-1 rounded-[5px] px-1.5 py-[5px] text-[8px] min-[900px]:rounded-lg min-[900px]:px-2.5 min-[900px]:py-2 min-[900px]:text-xs" style={{ background: cur.soft }}>
                  <span className="font-bold">{r.n}</span>
                  <span className="font-extrabold" style={{ color: cur.primary }}>
                    {r.p}
                  </span>
                </span>
              ))}
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-2.5 min-[900px]:gap-4 min-[900px]:pt-4">
            <h3 className="text-lg leading-tight font-extrabold min-[900px]:text-[28px] min-[900px]:tracking-[-0.02em]">{cur.label}</h3>
            <p className="text-sm leading-[1.55] text-muted min-[900px]:text-[17px]">{cur.desc}</p>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 min-[900px]:gap-2.5">
              {cur.parts.map((p) => (
                <li key={p} className="flex gap-2 text-[13.5px] leading-snug font-semibold min-[900px]:text-base">
                  <Check size={16} strokeWidth={2.6} className="mt-px shrink-0 text-brand" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setType(cur.b);
            router.push("/builder");
          }}
          className="ax-btn flex min-h-[50px] items-center justify-center gap-2 rounded-[13px] border-0 bg-soft text-[15px] font-bold text-ink min-[900px]:self-start min-[900px]:px-6"
        >
          Энэ төрлөөр туршиж үзэх
          <ArrowRight size={16} />
        </button>
      </div>
      <p className="mt-2.5 text-xs text-muted">Жишээ агуулга — зөвхөн харагдах байдлыг үзүүлэх зорилготой.</p>
    </>
  );
}
