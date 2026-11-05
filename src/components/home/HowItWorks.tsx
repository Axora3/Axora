import { Icon, type IconName } from "@/components/ui/icon";
import { Info } from "@/components/icons";

type Step = { icon: IconName; title: string; description: string };

const READY: Step[] = [
  { icon: "search", title: "Загвараа сонгох", description: "Ангилал, үнээр шүүж, дэлгэрэнгүй хуудаснаас юу багтсаныг харна." },
  { icon: "credit-card", title: "Төлбөрөө төлөх", description: "Имэйлээ оруулаад QPay, SocialPay эсвэл дансаар төлнө. Үнэгүй загварт төлбөр шаардлагагүй." },
  { icon: "download", title: "Загвараа авах", description: "Төлбөр баталгаажсаны дараа татах холбоос эсвэл Notion, Canva холбоос имэйлээр очно." },
];

const CUSTOM: Step[] = [
  { icon: "adjustments", title: "Вебээ загварчлах", description: "Бизнесийн төрөл, хэв маяг, өнгөө сонгоод жишээ веб шууд хэрхэн өөрчлөгдөхийг хараарай." },
  { icon: "file-text", title: "Анкет бөглөх", description: "Анкет бөглөхөд 10 орчим минут. Хариултаа шалгаад илгээх хүртэл алхам хооронд хадгална." },
  { icon: "send", title: "Үнийн санал авах", description: "Анкетаа илгээсний дараа ажлын хүрээ, үнийн саналыг тусад нь бэлтгэж илгээнэ." },
];

function Track({ label, steps, id }: { label: string; steps: Step[]; id: string }) {
  return (
    <div className="ax-reveal ax-surface flex min-w-0 flex-col gap-1 p-[clamp(20px,3vw,32px)]">
      <h3 id={id} className="ax-eyebrow mb-3">
        {label}
      </h3>
      <ol aria-labelledby={id} className="m-0 flex list-none flex-col p-0">
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {index < steps.length - 1 && <span aria-hidden="true" className="absolute top-12 bottom-1 left-[21px] w-px bg-line" />}
            <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-soft text-brand">
              <Icon name={step.icon} size={20} />
            </span>
            <span className="flex min-w-0 flex-col gap-1 pt-0.5">
              <strong className="text-[17px] font-extrabold tracking-[-0.01em]">
                <span className="sr-only">Алхам {index + 1}: </span>
                {step.title}
              </strong>
              <span className="text-[15px] leading-relaxed text-muted">{step.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="ax-container ax-section">
      <div className="ax-reveal flex max-w-[640px] flex-col gap-3">
        <h2 id="how-title" className="ax-h2">
          Хэрхэн <span className="serif">ажилладаг вэ?</span>
        </h2>
        <p className="ax-lead">Бэлэн загвар ч, захиалгат веб ч гурван алхамтай.</p>
      </div>

      <div className="mt-10 grid gap-5 min-[860px]:grid-cols-2">
        <Track id="how-ready" label="Бэлэн загвар" steps={READY} />
        <Track id="how-custom" label="Захиалгат веб" steps={CUSTOM} />
      </div>

      <p className="ax-reveal mt-4 flex items-start gap-2 rounded-control bg-warn-bg px-3.5 py-3 text-sm leading-normal text-warn-ink">
        <Info size={16} strokeWidth={2.2} className="mt-0.5 shrink-0" />
        <span>Онлайн төлбөр болон автомат татах холбоос одоогоор туршилтын шатанд байна. Бодитоор нээгдэх хүртэл захиалгыг бид гараар баталгаажуулна.</span>
      </p>
    </section>
  );
}
