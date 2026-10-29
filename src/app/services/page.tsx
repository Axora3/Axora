import type { Metadata } from "next";
import Link from "next/link";
import { Gear, Globe, Image as ImageIcon, Pages } from "@/components/icons";
import { SiteTypes } from "@/components/services/SiteTypes";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Веб хөгжүүлэлт",
  description: "Бизнесийн танилцуулга, QR меню, онлайн дэлгүүр, portfolio, цаг захиалгын веб — өнгө, хэв маягаа туршаад үнийн санал аваарай.",
};

const H2 = "text-[28px] leading-[1.12] font-extrabold tracking-[-0.025em] min-[900px]:text-[clamp(28px,3.4vw,44px)]";

const FACTORS = [
  { Icon: Pages, t: "Хуудасны тоо", d: "Нэг хуудас уу, олон хэсэгтэй юу." },
  { Icon: Gear, t: "Функц", d: "Онлайн захиалга, цаг авах, төлбөр." },
  { Icon: ImageIcon, t: "Агуулга", d: "Текст, зураг бэлэн эсэх." },
  { Icon: Globe, t: "Домэйн, хостинг", d: "Өөрийн домэйн эсвэл үнэгүй хаяг." },
];

export default function ServicesPage() {
  return (
    <>
      <SiteHeader active="/services" mobileBack={{ href: "/", label: "Нүүр рүү буцах", title: "Веб хөгжүүлэлт" }} />
      <main id="main" className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,40px)] pt-4 min-[900px]:pt-10">
        <section aria-labelledby="sv-h" className="relative overflow-hidden rounded-[26px] bg-band px-5 pt-7 text-on-band min-[900px]:grid min-[900px]:grid-cols-[1.2fr_1fr] min-[900px]:items-end min-[900px]:gap-10 min-[900px]:rounded-[28px] min-[900px]:px-[clamp(36px,5vw,72px)] min-[900px]:pt-16">
          <span aria-hidden="true" className="ax-spin absolute -top-20 -right-20 h-[220px] w-[220px] rounded-full border border-dashed border-band-ring min-[900px]:h-[340px] min-[900px]:w-[340px]" />
          <div className="relative pb-0 min-[900px]:pb-16">
            <span className="ax-in d1 inline-flex text-xs font-extrabold tracking-[0.08em] text-lime uppercase">Захиалгат веб</span>
            <h1 id="sv-h" className="ax-in d2 mt-3 text-[36px] leading-[1.06] font-extrabold tracking-[-0.03em] min-[900px]:text-[clamp(40px,5vw,64px)]">
              Бизнесийнхээ вебийг <span className="serif text-lime">өөрийнхөөрөө</span> бүтээ.
            </h1>
            <p className="ax-in d3 mt-3.5 max-w-[34em] text-base leading-relaxed text-dark-muted min-[900px]:text-lg">
              Өнгө, хэв маягаа урьдчилан туршаад, хэрэгцээгээ анкетаар илгээнэ. Үнэ, хугацааг хамтдаа тохирно.
            </p>
            <div className="ax-in d4 mt-5 flex flex-col gap-2.5 min-[480px]:flex-row min-[480px]:flex-wrap">
              <Link href="/builder" className="ax-btn ax-lime flex min-h-[54px] items-center justify-center rounded-[14px] bg-lime px-6 text-base font-extrabold text-on-lime no-underline">
                Вебээ загварчлах
              </Link>
              <Link href="/order" className="ax-btn flex min-h-[54px] items-center justify-center rounded-[14px] border border-dark-line-2 px-6 text-base font-bold text-on-band no-underline">
                Анкет бөглөх
              </Link>
            </div>
          </div>
          <div aria-hidden="true" className="ax-light ax-in d4 relative mx-auto mt-7 h-[150px] w-[210px] overflow-hidden min-[900px]:mt-0 min-[900px]:h-[300px] min-[900px]:w-[340px]">
            <div className="flex h-[190px] w-[210px] flex-col gap-2 rounded-t-[26px] border-[6px] border-b-0 border-[#2C3F34] bg-[#FBF7EF] px-3 py-3.5 min-[900px]:h-[360px] min-[900px]:w-[340px] min-[900px]:gap-3.5 min-[900px]:rounded-t-[36px] min-[900px]:border-[9px] min-[900px]:px-6 min-[900px]:py-6">
              <span className="h-2 w-[46%] rounded bg-[#3B2A20] opacity-70" />
              <span className="h-4 w-[86%] rounded-[5px] bg-[#2B1A12] min-[900px]:h-6" />
              <span className="h-4 w-[64%] rounded-[5px] bg-[#2B1A12] min-[900px]:h-6" />
              <span className="mt-1 h-[26px] w-[48%] rounded-[7px] bg-[#8A4B2E] min-[900px]:h-10" />
              <span className="mt-1 grid grid-cols-3 gap-[5px] min-[900px]:gap-2">
                <span className="h-[34px] rounded-md bg-[#E9D3B5] min-[900px]:h-16" />
                <span className="h-[34px] rounded-md bg-[#E9D3B5] min-[900px]:h-16" />
                <span className="h-[34px] rounded-md bg-lime min-[900px]:h-16" />
              </span>
            </div>
          </div>
        </section>

        <section aria-labelledby="sv-types" className="pt-12 min-[900px]:pt-24">
          <h2 id="sv-types" className={`ax-reveal ${H2}`}>
            Ямар веб <span className="serif">хийдэг вэ?</span>
          </h2>
          <SiteTypes />
        </section>

        <section aria-labelledby="sv-price" className="pt-12 min-[900px]:pt-24">
          <h2 id="sv-price" className={`ax-reveal ${H2}`}>
            Үнэ юунаас <span className="serif">хамаарах вэ?</span>
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5 min-[900px]:mt-8 min-[900px]:grid-cols-4 min-[900px]:gap-5">
            {FACTORS.map(({ Icon, t, d }) => (
              <div key={t} className="ax-reveal flex flex-col gap-2.5 rounded-[18px] border border-line bg-surface p-4 min-[900px]:p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-soft text-brand">
                  <Icon size={20} />
                </span>
                <strong className="text-[15px] min-[900px]:text-lg">{t}</strong>
                <span className="text-[13px] leading-normal text-muted min-[900px]:text-[15px]">{d}</span>
              </div>
            ))}
          </div>
          <p className="ax-reveal mt-3 rounded-[14px] bg-warn-bg p-3.5 text-sm leading-[1.55] font-semibold text-warn-ink min-[900px]:mt-5 min-[900px]:text-[15px]">
            Тодорхой үнэ, хугацааг анкетаа илгээсний дараа үнийн саналаар тохирно.
          </p>
        </section>

        <section aria-labelledby="sv-prep" className="grid gap-x-16 pt-12 min-[900px]:grid-cols-2 min-[900px]:pt-24">
          <div>
            <h2 id="sv-prep" className={`ax-reveal ${H2}`}>
              Урьдчилан <span className="serif">бэлтгэх</span>
            </h2>
            <p className="mt-2 text-[15px] leading-[1.55] text-muted min-[900px]:mt-4 min-[900px]:text-[17px]">
              Бэлэн байвал ажил хурдан эхэлнэ. Бэлэн биш бол анкетад “Дараа илгээнэ” гэж сонгоно.
            </p>
          </div>
          <ol className="ax-reveal m-0 mt-4 list-none rounded-[18px] border border-line bg-surface px-4 py-1 min-[900px]:mt-0">
            {["Лого, брэндийн өнгө", "Бүтээгдэхүүн, байршлын зураг", "Үнийн жагсаалт эсвэл меню", "Хаяг, утас, ажиллах цаг"].map((x, i, a) => (
              <li key={x} className={`flex min-h-14 items-center gap-3 text-[15px] font-semibold ${i < a.length - 1 ? "border-b border-soft" : ""}`}>
                <span className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-lime text-xs font-extrabold text-on-lime">{i + 1}</span>
                {x}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="sv-cta" className="pt-12 pb-8 min-[900px]:pt-24 min-[900px]:pb-24">
          <div className="ax-reveal flex flex-col gap-3.5 rounded-3xl border border-line bg-surface px-5 py-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:p-12">
            <div className="flex flex-col gap-3.5">
              <h2 id="sv-cta" className="text-[26px] leading-[1.12] font-extrabold tracking-[-0.025em] min-[900px]:text-[36px]">
                Эхлэхэд <span className="serif">бэлэн үү?</span>
              </h2>
              <p className="text-[15px] leading-[1.55] text-muted min-[900px]:text-[17px]">Live demo дээр туршсан тохиргоо тань анкет руу автоматаар дамжина.</p>
            </div>
            <div className="flex flex-col gap-2 min-[900px]:flex-row">
              <Link href="/order" className="ax-btn ax-primary flex min-h-[54px] items-center justify-center rounded-[14px] bg-primary px-6 text-base font-bold text-on-primary no-underline">
                Үнийн санал авах
              </Link>
              <Link href="/contact" className="ax-btn ax-ghost flex min-h-12 items-center justify-center rounded-[14px] px-5 text-[15px] font-bold text-ink no-underline min-[900px]:min-h-[54px] min-[900px]:border min-[900px]:border-line-strong">
                Эхлээд асуулт асуух
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
