import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { SpotlightGroup } from "@/components/ui/spotlight";

const SERVICES = [
  {
    index: "01",
    tag: "Excel · Notion · Canva",
    title: "Бэлэн загвар авах",
    lead: "Хичээл, төсөв, контент, сошиал пост — өөрийн бүртгэл рүү хуулаад өнөөдрөөс ашиглана.",
    meta: [["Хугацаа", "Төлбөрийн дараа"], ["Үнэ", "Загвар бүрт тогтмол"]],
    features: ["Шууд ашиглах боломжтой", "Өөрөө засаж, өөрчилнө", "Хэрхэн ашиглах заавартай", "Үнэгүй загвар бас бий"],
    primary: { href: "/templates", label: "Загварууд үзэх" },
  },
  {
    index: "02",
    tag: "Жижиг бизнест",
    title: "Захиалгат веб сайт хийлгэх",
    lead: "Танилцуулга, меню, онлайн дэлгүүр, цаг захиалга — бизнесийнхээ хэрэгцээнд тааруулж хийлгэнэ.",
    meta: [["Хугацаа", "Ажлын хүрээгээр"], ["Үнэ", "Үнийн саналаар"]],
    features: ["Брэнд, өнгөнд тань тааруулна", "Хуудас, функцээ сонгоно", "Домэйн, хостингийн зөвлөгөө", "Хүлээлгэн өгөхдөө заавар өгнө"],
    primary: { href: "/order", label: "Веб сайт захиалах" },
    secondary: { href: "/builder", label: "Эхлээд загварчлах" },
  },
];

export function Services() {
  return (
    <section id="services" aria-labelledby="cmp-title" className="ax-container pb-section">
      <div className="ax-reveal flex flex-wrap items-end justify-between gap-4">
        <h2 id="cmp-title" className="ax-h2 max-w-[16em]">
          Танд <span className="serif">аль нь</span> тохирох вэ?
        </h2>
        <Link href="/services" className="ax-link inline-flex min-h-11 items-center gap-2 font-bold text-ink no-underline">
          Бүх үйлчилгээ
          <span className="ax-arrow"><ArrowRight /></span>
        </Link>
      </div>
      <SpotlightGroup className="ax-reveal mt-10 grid overflow-hidden rounded-panel border border-line bg-surface min-[900px]:grid-cols-2">
        {SERVICES.map((s, i) => (
          <article key={s.index} className={`ax-spot flex flex-col gap-6 p-[clamp(24px,3.4vw,48px)] ${i ? "border-line max-[899px]:border-t min-[900px]:border-l" : ""}`}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="serif text-[40px] leading-none text-brand">{s.index}</span>
              <span className="text-[13px] font-bold text-muted">{s.tag}</span>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-[clamp(24px,2.4vw,34px)] leading-[1.14] font-extrabold tracking-[-0.022em]">{s.title}</h3>
              <p className="text-base leading-relaxed text-muted">{s.lead}</p>
            </div>
            <dl className="m-0 grid grid-cols-2 border-y border-line-soft">
              {s.meta.map(([label, value], m) => (
                <div key={label} className={`py-3.5 ${m ? "border-l border-line-soft pl-4" : ""}`}>
                  <dt className="text-[12.5px] font-bold text-muted">{label}</dt>
                  <dd className="m-0 mt-0.5 text-[15px] font-extrabold">{value}</dd>
                </div>
              ))}
            </dl>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15px]">
              {s.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check size={18} strokeWidth={2.4} className="mt-0.5 shrink-0 text-brand" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap gap-2.5 pt-2">
              <Link href={s.primary.href} className={buttonStyles("primary", "ax-btn", "lg")}>
                {s.primary.label}
                <span className="ax-arrow"><ArrowRight size={18} /></span>
              </Link>
              {s.secondary && (
                <Link href={s.secondary.href} className={buttonStyles("secondary", "ax-btn", "lg")}>
                  {s.secondary.label}
                </Link>
              )}
            </div>
          </article>
        ))}
      </SpotlightGroup>
    </section>
  );
}
