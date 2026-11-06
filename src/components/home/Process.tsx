"use client";

import { useState } from "react";
import { Info } from "@/components/icons";
import { Icon, type IconName } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";

type Step = { icon: IconName; title: string; description: string };

const TRACKS: Record<"ready" | "custom", Step[]> = {
  ready: [
    { icon: "search", title: "Загвараа сонгох", description: "Ангилал, үнээр шүүж, дэлгэрэнгүй хуудаснаас юу багтсаныг харна." },
    { icon: "credit-card", title: "Төлбөрөө төлөх", description: "Имэйлээ оруулаад QPay, SocialPay эсвэл дансаар төлнө. Үнэгүй загварт төлбөр шаардлагагүй." },
    { icon: "download", title: "Загвараа авах", description: "Төлбөр баталгаажсаны дараа татах холбоос эсвэл Notion, Canva холбоос имэйлээр очно." },
  ],
  custom: [
    { icon: "adjustments", title: "Вебээ загварчлах", description: "Бизнесийн төрөл, хэв маяг, өнгөө сонгоод жишээ веб шууд хэрхэн өөрчлөгдөхийг хараарай." },
    { icon: "file-text", title: "Анкет бөглөх", description: "Анкет бөглөхөд 10 орчим минут. Хариултаа шалгаад илгээх хүртэл алхам хооронд хадгална." },
    { icon: "send", title: "Үнийн санал авах", description: "Анкетаа илгээсний дараа ажлын хүрээ, үнийн саналыг тусад нь бэлтгэж илгээнэ." },
  ],
};

const OPTIONS = [
  { value: "custom", label: "Захиалгат веб" },
  { value: "ready", label: "Бэлэн загвар" },
] as const;

export function Process() {
  const [track, setTrack] = useState<keyof typeof TRACKS>("custom");
  return (
    <section aria-labelledby="how-title" className="border-y border-line bg-surface">
      <div className="ax-container ax-section">
        <div className="ax-reveal flex flex-wrap items-end justify-between gap-5">
          <div className="flex max-w-[640px] flex-col gap-3">
            <h2 id="how-title" className="ax-h2">
              Хэрхэн <span className="serif">ажилладаг вэ?</span>
            </h2>
            <p className="ax-lead">Бэлэн загвар ч, захиалгат веб ч гурван алхамтай.</p>
          </div>
          <Segmented label="Үйлчилгээний төрөл" options={OPTIONS} value={track} onChange={setTrack} />
        </div>

        <ol key={track} className="ax-in-sm relative m-0 mt-12 grid list-none gap-8 p-0 min-[860px]:grid-cols-3 min-[860px]:gap-10">
          <span aria-hidden="true" className="absolute top-[27px] right-[16%] left-[8%] hidden h-px bg-line-mid min-[860px]:block" />
          {TRACKS[track].map((step, index) => (
            <li key={step.title} className="relative flex gap-4 min-[860px]:flex-col">
              <span aria-hidden="true" className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line-mid bg-surface text-brand">
                <Icon name={step.icon} size={22} />
                <span className="absolute -top-1 -right-1 inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-lime text-[11px] font-extrabold text-on-lime">{index + 1}</span>
              </span>
              <span className="flex min-w-0 flex-col gap-1.5">
                <strong className="text-[19px] font-extrabold tracking-[-0.012em]">
                  <span className="sr-only">Алхам {index + 1}: </span>
                  {step.title}
                </strong>
                <span className="text-[15px] leading-relaxed text-muted">{step.description}</span>
              </span>
            </li>
          ))}
        </ol>

        {track === "ready" && (
          <p className="mt-10 flex items-start gap-2 rounded-control bg-warn-bg px-3.5 py-3 text-sm leading-normal text-warn-ink">
            <Info size={16} strokeWidth={2.2} className="mt-0.5 shrink-0" />
            <span>Онлайн төлбөр болон автомат татах холбоос одоогоор туршилтын шатанд байна. Бодитоор нээгдэх хүртэл захиалгыг бид гараар баталгаажуулна.</span>
          </p>
        )}
      </div>
    </section>
  );
}
