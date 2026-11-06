import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

function Browser({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div aria-hidden="true" className="ax-light overflow-hidden rounded-card border border-line bg-white text-ink shadow-raised">
      <div className="flex h-9 items-center gap-1.5 border-b border-line bg-soft-2 px-3.5">
        <span className="h-2 w-2 rounded-full bg-line-mid" />
        <span className="h-2 w-2 rounded-full bg-line-mid" />
        <span className="h-2 w-2 rounded-full bg-line-mid" />
        <span className="ml-2 truncate text-xs text-muted">{label}</span>
      </div>
      {children}
    </div>
  );
}

const Bar = ({ className }: { className: string }) => <span className={cn("block rounded-sm", className)} />;

function DevelopmentMock() {
  return (
    <div className="relative pb-10">
      <Browser label="таны-веб.mn">
        <div className="flex flex-col gap-3 p-5">
          <Bar className="h-6 w-3/4 bg-ink" />
          <Bar className="h-2.5 w-1/2 bg-line-mid" />
          <span className="h-9 w-28 rounded-inner bg-primary" />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <span className="aspect-[4/3] rounded-inner bg-soft" />
            <span className="aspect-[4/3] rounded-inner bg-lime" />
            <span className="aspect-[4/3] rounded-inner bg-soft" />
          </div>
        </div>
      </Browser>
      <div aria-hidden="true" className="ax-light absolute right-4 bottom-0 flex h-36 w-20 flex-col gap-1.5 rounded-control border-[3px] border-band bg-white p-2 shadow-raised">
        <Bar className="h-2.5 w-full bg-ink" />
        <Bar className="h-1.5 w-2/3 bg-line-mid" />
        <span className="mt-1 h-4 w-10 rounded bg-primary" />
        <span className="mt-auto aspect-square rounded bg-soft" />
      </div>
    </div>
  );
}

function BusinessMock() {
  return (
    <Browser label="компани.mn">
      <div className="flex items-center justify-between border-b border-line-soft px-5 py-3 text-[11px] font-bold">
        <span className="text-[13px] font-extrabold">Компани</span>
        <span className="flex gap-3 text-muted"><span>Бидний тухай</span><span>Үйлчилгээ</span><span>Холбоо барих</span></span>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-2.5">
          <Bar className="h-5 w-[90%] bg-ink" />
          <Bar className="h-2.5 w-3/4 bg-line-mid" />
          <Bar className="h-2.5 w-2/3 bg-line-mid" />
          <span className="mt-1 h-8 w-24 rounded-inner bg-primary" />
        </div>
        <span className="min-h-24 rounded-control bg-soft" />
      </div>
    </Browser>
  );
}

function LandingMock() {
  return (
    <div aria-hidden="true" className="ax-light mx-auto flex max-w-[360px] flex-col gap-3 rounded-card border border-line bg-white p-5 text-center text-ink shadow-raised">
      <span className="mx-auto rounded-full bg-lime px-3 py-1 text-[10px] font-extrabold text-on-lime">Нэг санал</span>
      <Bar className="mx-auto h-6 w-[85%] bg-ink" />
      <Bar className="mx-auto h-2.5 w-2/3 bg-line-mid" />
      <span className="mx-auto mt-1 h-10 w-36 rounded-inner bg-primary" />
      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-line-soft pt-3">
        {[0, 1, 2].map((n) => <span key={n} className="flex flex-col items-center gap-1.5"><span className="h-6 w-6 rounded-full bg-soft" /><Bar className="h-1.5 w-full bg-line" /></span>)}
      </div>
    </div>
  );
}

function CustomMock() {
  const modules = [["credit-card", "Төлбөр"], ["calendar", "Цаг захиалга"], ["table", "Меню, үнэ"], ["inbox", "Захиалга"]] as const;
  return (
    <div aria-hidden="true" className="ax-light grid grid-cols-2 gap-3">
      {modules.map(([icon, label], index) => (
        <span key={label} className={cn("flex min-h-28 flex-col justify-between rounded-card border border-line bg-white p-4 text-ink shadow-card", index % 2 === 1 && "translate-y-4", index === 2 && "bg-lime text-on-lime")}>
          <Icon name={icon} size={22} />
          <span className="text-[13px] font-extrabold">{label}</span>
        </span>
      ))}
    </div>
  );
}

const SERVICES: { id: string; eyebrow: string; title: string; text: string; deliverables: string[]; cta: { href: string; label: string }; mock: ReactNode }[] = [
  {
    id: "development",
    eyebrow: "Вебсайт хөгжүүлэлт",
    title: "Санаанаас нийтлэх хүртэл нэг дор",
    text: "Хэрэгцээг тань ойлгоод, брэндэд тань тааруулж вебийг бүтээж, ажиллуулахад бэлэн болгож хүлээлгэн өгнө.",
    deliverables: ["Брэнд, өнгөнд тань тааруулсан дизайн", "Утас, таблет, компьютерт тохирсон хувилбар", "Домэйн, хостингийн зөвлөгөө", "Хүлээлгэн өгөхдөө хэрэглэх заавар"],
    cta: { href: "/builder", label: "Вебсайт бүтээх" },
    mock: <DevelopmentMock />,
  },
  {
    id: "business",
    eyebrow: "Бизнесийн вебсайт",
    title: "Бизнесээ итгэл төрүүлэхээр танилцуул",
    text: "Байгууллага, үйлчилгээ, холбоо барих мэдээллээ нэг дор цэгцтэй харуулж, сонирхогчоо хэрэглэгч болгоно.",
    deliverables: ["Нүүр, бидний тухай, үйлчилгээний хуудас", "Меню эсвэл үнийн жагсаалт", "Хаяг, утас, ажиллах цаг", "Холбоо барих хэсэг"],
    cta: { href: "/order", label: "Анкет бөглөх" },
    mock: <BusinessMock />,
  },
  {
    id: "landing",
    eyebrow: "Landing page",
    title: "Нэг санал, нэг хуудас, нэг зорилго",
    text: "Шинэ бүтээгдэхүүн, арга хэмжээ, сурталчилгаанд зориулсан, үйлдэл рүү шууд хөтлөх нэг хуудас.",
    deliverables: ["Нэг хуудсанд багтсан ойлгомжтой бүтэц", "Анхаарал татах гарчиг, үйлдлийн товч", "Хүсэлт эсвэл холбоо авах хэсэг", "Гар утсанд тохирсон хувилбар"],
    cta: { href: "/order", label: "Анкет бөглөх" },
    mock: <LandingMock />,
  },
  {
    id: "custom",
    eyebrow: "Захиалгат шийдэл",
    title: "Стандарт веб хүрэлцэхгүй үед",
    text: "Онлайн дэлгүүр, цаг захиалга, QR меню гэх мэт бизнесийн тань ажиллагаанд тулгуурласан шийдэл.",
    deliverables: ["Хэрэгцээнд тань суурилсан ажлын хүрээ", "Шаардлагатай функцийн жагсаалт", "Тодорхой үнийн санал", "Ажлын үе шатны тохиролцоо"],
    cta: { href: "/contact", label: "Бидэнтэй ярилцах" },
    mock: <CustomMock />,
  },
];

/** Alternating editorial rows, so each service reads as its own chapter rather than one more card. */
export function ServiceChapters() {
  return (
    <div className="flex flex-col gap-[clamp(56px,8vw,112px)]">
      {SERVICES.map((service, index) => (
        <section key={service.id} id={service.id} aria-labelledby={`${service.id}-title`} className="ax-reveal grid scroll-mt-24 items-center gap-8 nav:grid-cols-2 nav:gap-[clamp(40px,6vw,88px)]">
          <div className={cn("flex flex-col items-start gap-4", index % 2 === 1 && "nav:order-2")}>
            <span className="ax-eyebrow">{service.eyebrow}</span>
            <h2 id={`${service.id}-title`} className="ax-h2">{service.title}</h2>
            <p className="ax-lead">{service.text}</p>
            <h3 className="mt-2 text-sm font-extrabold">Юу хүлээн авах вэ</h3>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15px]">
              {service.deliverables.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check size={18} strokeWidth={2.4} className="mt-0.5 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href={service.cta.href} className={buttonStyles(index === 0 ? "primary" : "secondary", "ax-btn mt-3")}>
              {service.cta.label}
              <span className="ax-arrow"><ArrowRight size={16} /></span>
            </Link>
          </div>
          <div className={cn("min-w-0", index % 2 === 1 && "nav:order-1")}>{service.mock}</div>
        </section>
      ))}
    </div>
  );
}

const PROCESS = [
  { title: "Загварчлах", text: "Website Builder дээр төрөл, хэв маяг, өнгөө туршина.", href: "/builder" },
  { title: "Анкет бөглөх", text: "Хэрэгцээгээ 10 орчим минутад илгээнэ. Туршсан тохиргоо тань анкет руу дамжина.", href: "/order" },
  { title: "Үнийн санал", text: "Ажлын хүрээ, үнэ, боломжит хугацааг бэлтгэж, хамтдаа тохирно." },
  { title: "Бүтээх", text: "Тохирсон хүрээний дагуу вебийг бүтээж, явцад нь санал авна." },
  { title: "Хүлээлгэн өгөх", text: "Вебээ ажиллуулахад бэлэн болгож, ашиглах зааврыг өгнө." },
];

export function ServiceProcess() {
  return (
    <ol className="m-0 grid list-none gap-px overflow-hidden rounded-card border border-band-line bg-band-line p-0 sm:grid-cols-2 desk:grid-cols-5">
      {PROCESS.map((step, index) => (
        <li key={step.title} className="flex flex-col gap-3 bg-band p-5">
          <span aria-hidden="true" className="serif text-[32px] leading-none text-lime">{index + 1}</span>
          <h3 className="text-[17px] font-extrabold tracking-[-0.01em]">
            <span className="sr-only">Алхам {index + 1}: </span>
            {step.href ? <Link href={step.href} className="text-on-band no-underline transition-colors hover:text-lime">{step.title}</Link> : step.title}
          </h3>
          <p className="text-sm leading-relaxed text-band-muted">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
