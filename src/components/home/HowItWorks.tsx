import { Icon } from "@/components/ui/icon";
import { Download, Info, Search } from "@/components/icons";

const STEPS = [
  {
    icon: <Search size={22} />,
    title: "Загвараа сонгох",
    description: "Ангилал, үнээр шүүж, дэлгэрэнгүй хуудаснаас юу багтсаныг харна.",
    lime: false,
  },
  {
    icon: (
      <Icon name="credit-card" size={22} />
    ),
    title: "Төлбөрөө төлөх",
    description: "Имэйлээ оруулаад QPay, SocialPay эсвэл дансаар төлнө. Үнэгүй загварт төлбөр шаардлагагүй.",
    lime: false,
  },
  {
    icon: <Download size={22} />,
    title: "Загвараа авах",
    description: "Төлбөр баталгаажсаны дараа татах холбоос эсвэл Notion, Canva холбоос имэйлээр очно.",
    lime: true,
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-title"
      className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,40px)] pt-14 pb-10 min-[900px]:pt-[104px]"
    >
      <div className="ax-reveal flex max-w-[640px] flex-col gap-3">
        <h2 id="how-title" className="text-[clamp(28px,3.4vw,44px)] leading-[1.12] font-extrabold tracking-[-0.025em]">
          Хэрхэн <span className="serif">ажилладаг вэ?</span>
        </h2>
        <p className="text-[17px] leading-relaxed text-muted">Бэлэн загвар авах гурван алхам.</p>
      </div>

      <ol className="relative m-0 mt-10 grid list-none gap-4 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr))]">
        {STEPS.map((s, i) => (
          <li key={s.title} className="ax-reveal relative flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-6">
            <span className="flex items-center justify-between">
              <span
                aria-hidden="true"
                className={`inline-flex h-12 w-12 items-center justify-center rounded-[14px] ${s.lime ? "bg-lime text-on-lime" : "bg-soft text-brand"}`}
              >
                {s.icon}
              </span>
              <span className="serif text-[40px] leading-none text-line-mid" aria-hidden="true">
                {i + 1}
              </span>
            </span>
            <h3 className="text-xl font-extrabold tracking-[-0.01em]">
              <span className="sr-only">Алхам {i + 1}: </span>
              {s.title}
            </h3>
            <p className="text-[15px] leading-relaxed text-muted">{s.description}</p>
          </li>
        ))}
      </ol>

      <p className="ax-reveal mt-4 flex items-start gap-2 rounded-xl bg-warn-bg px-3.5 py-3 text-sm leading-normal text-warn-ink">
        <Info size={16} strokeWidth={2.2} className="mt-0.5 shrink-0" />
        <span>
          Онлайн төлбөр болон автомат татах холбоос одоогоор туршилтын шатанд байна. Бодитоор нээгдэх хүртэл захиалгыг бид гараар
          баталгаажуулна.
        </span>
      </p>
    </section>
  );
}
