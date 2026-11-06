import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gear, Globe, Image as ImageIcon, Pages } from "@/components/icons";
import { ServiceChapters, ServiceProcess } from "@/components/services/ServiceChapters";
import { SiteTypes } from "@/components/services/SiteTypes";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Үйлчилгээ",
  description: "Вебсайт хөгжүүлэлт, бизнесийн вебсайт, landing page, захиалгат шийдэл — өнгө, хэв маягаа туршаад үнийн санал аваарай.",
  alternates: { canonical: "/services" },
};

const FACTORS = [
  { Icon: Pages, t: "Хуудасны тоо", d: "Нэг хуудас уу, олон хэсэгтэй юу." },
  { Icon: Gear, t: "Функц", d: "Онлайн захиалга, цаг авах, төлбөр." },
  { Icon: ImageIcon, t: "Агуулга", d: "Текст, зураг бэлэн эсэх." },
  { Icon: Globe, t: "Домэйн, хостинг", d: "Өөрийн домэйн эсвэл үнэгүй хаяг." },
];

const JUMPS = [
  ["#development", "Вебсайт хөгжүүлэлт"],
  ["#business", "Бизнесийн вебсайт"],
  ["#landing", "Landing page"],
  ["#custom", "Захиалгат шийдэл"],
];

export default function ServicesPage() {
  return (
    <>
      <SiteHeader active="/services" />
      <main id="main">
        <section aria-labelledby="sv-h" className="relative isolate overflow-hidden bg-band text-on-band">
          <div aria-hidden="true" className="ax-aurora" />
          <div className="ax-container flex flex-col items-start gap-5 py-[clamp(48px,8vw,112px)]">
            <span className="ax-pill-band ax-in">Үйлчилгээ</span>
            <h1 id="sv-h" className="ax-display ax-in d1 max-w-[12em]">
              Бизнесийнхээ вебийг <span className="serif text-lime">өөрийнхөөрөө</span> бүтээ.
            </h1>
            <p className="ax-in d2 max-w-[36em] text-[clamp(17px,1.5vw,20px)] leading-relaxed text-band-muted">
              Өнгө, хэв маягаа урьдчилан туршаад, хэрэгцээгээ анкетаар илгээнэ. Үнэ, хугацааг хамтдаа тохирно.
            </p>
            <div className="ax-in d3 mt-2 flex flex-wrap gap-3 max-[480px]:w-full">
              <Link href="/builder" className={buttonStyles("lime", "ax-btn max-[480px]:w-full", "lg")}>
                Вебсайт бүтээх
                <span className="ax-arrow"><ArrowRight /></span>
              </Link>
              <Link href="/order" className="ax-button ax-button-lg ax-btn border-band-ring bg-transparent text-on-band hover:bg-band-hover max-[480px]:w-full">
                Анкет бөглөх
              </Link>
            </div>
            <nav aria-label="Үйлчилгээний төрлүүд" className="ax-in d4 mt-6 flex flex-wrap gap-x-5 gap-y-1 border-t border-band-line pt-4">
              {JUMPS.map(([href, label]) => (
                <a key={href} href={href} className="inline-flex min-h-11 items-center text-sm font-bold text-band-muted no-underline transition-colors hover:text-lime">{label}</a>
              ))}
            </nav>
          </div>
        </section>

        <div className="ax-container py-section">
          <ServiceChapters />
        </div>

        <section aria-labelledby="sv-process" className="relative isolate overflow-hidden bg-band text-on-band">
          <div className="ax-container ax-section">
            <h2 id="sv-process" className="ax-h2 ax-reveal">
              Ажлын <span className="serif text-lime">явц</span>
            </h2>
            <p className="ax-reveal mt-3 max-w-[34em] text-[17px] leading-relaxed text-band-muted">Эхний алхмаас хүлээлгэн өгөх хүртэл юу болохыг урьдчилан мэднэ.</p>
            <div className="ax-reveal mt-8"><ServiceProcess /></div>
          </div>
        </section>

        <div className="ax-container">
          <section aria-labelledby="sv-types" className="pt-section">
            <h2 id="sv-types" className="ax-reveal ax-h2">
              Ямар веб <span className="serif">хийдэг вэ?</span>
            </h2>
            <SiteTypes />
          </section>

          <section aria-labelledby="sv-price" className="pt-section">
            <h2 id="sv-price" className="ax-reveal ax-h2">
              Үнэ юунаас <span className="serif">хамаарах вэ?</span>
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5 nav:mt-8 nav:grid-cols-4 nav:gap-5">
              {FACTORS.map(({ Icon, t, d }) => (
                <div key={t} className="ax-reveal flex flex-col gap-2.5 rounded-card border border-line bg-surface p-4 nav:p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-soft text-brand">
                    <Icon size={20} />
                  </span>
                  <strong className="text-[15px] nav:text-lg">{t}</strong>
                  <span className="text-[13px] leading-normal text-muted nav:text-[15px]">{d}</span>
                </div>
              ))}
            </div>
            <p className="ax-reveal mt-3 rounded-control bg-warn-bg p-3.5 text-sm leading-[1.55] font-semibold text-warn-ink nav:mt-5 nav:text-[15px]">
              Тодорхой үнэ, хугацааг анкетаа илгээсний дараа үнийн саналаар тохирно.
            </p>
          </section>

          <section aria-labelledby="sv-prep" className="grid gap-x-16 pt-section nav:grid-cols-2">
            <div>
              <h2 id="sv-prep" className="ax-reveal ax-h2">
                Урьдчилан <span className="serif">бэлтгэх</span>
              </h2>
              <p className="mt-2 text-[15px] leading-[1.55] text-muted nav:mt-4 nav:text-[17px]">
                Бэлэн байвал ажил хурдан эхэлнэ. Бэлэн биш бол анкетад “Дараа илгээнэ” гэж сонгоно.
              </p>
            </div>
            <ol className="ax-reveal m-0 mt-4 list-none rounded-card border border-line bg-surface px-4 py-1 nav:mt-0">
              {["Лого, брэндийн өнгө", "Бүтээгдэхүүн, байршлын зураг", "Үнийн жагсаалт эсвэл меню", "Хаяг, утас, ажиллах цаг"].map((x, i, a) => (
                <li key={x} className={`flex min-h-14 items-center gap-3 text-[15px] font-semibold ${i < a.length - 1 ? "border-b border-soft" : ""}`}>
                  <span className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-lime text-xs font-extrabold text-on-lime">{i + 1}</span>
                  {x}
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="sv-cta" className="py-section">
            <div className="ax-page-hero ax-reveal flex flex-col gap-5 nav:flex-row nav:items-center nav:justify-between">
              <div className="flex flex-col gap-3">
                <h2 id="sv-cta" className="ax-h2">
                  Эхлэхэд <span className="serif">бэлэн үү?</span>
                </h2>
                <p className="ax-lead">Website Builder дээр туршсан тохиргоо тань анкет руу автоматаар дамжина.</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Link href="/builder" className={buttonStyles("primary", "ax-btn", "lg")}>Вебсайт бүтээх</Link>
                <Link href="/contact" className={buttonStyles("secondary", "ax-btn", "lg")}>Эхлээд асуулт асуух</Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
