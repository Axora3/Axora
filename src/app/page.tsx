import Link from "next/link";
import { Suspense } from "react";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { PaletteDemo } from "@/components/home/PaletteDemo";
import { ArrowRight } from "@/components/icons";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CardSkeletons, DemoNotice, TemplateCard } from "@/components/templates/TemplateCard";
import { getSiteContent } from "@/lib/content/service";
import { getPublishedTemplates } from "@/lib/templates/service";

const H2 = "text-[clamp(28px,3.4vw,44px)] leading-[1.12] font-extrabold tracking-[-0.025em]";

async function FeaturedTemplates() {
  const res = await getPublishedTemplates();
  if (!res.ok) {
    return (
      <p role="alert" className="mt-7 rounded-xl border border-danger-line bg-danger-bg p-4 text-[15px] font-semibold text-danger-ink">
        Загваруудыг ачаалж чадсангүй. <Link href="/templates">Загварын хуудсыг нээж</Link> дахин оролдоно уу.
      </p>
    );
  }
  const list = res.templates.slice(0, 6);
  return (
    <>
      {list.some((t) => t.isDemo) && <DemoNotice className="mt-5" />}
      {list.length === 0 ? (
        <p className="mt-7 text-muted">Одоогоор нийтлэгдсэн загвар алга.</p>
      ) : (
        <div className="mt-7 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr))]">
          {list.map((t) => (
            <TemplateCard key={t.id} t={t} headingLevel="h3" className="ax-reveal" />
          ))}
        </div>
      )}
    </>
  );
}

export default async function HomePage() {
  const content = await getSiteContent();
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero c={content} />

        <section id="services" aria-labelledby="offer-title" className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,40px)] pt-6 pb-14 min-[900px]:pb-[104px]">
          <h2 id="offer-title" className={`ax-reveal max-w-[16em] ${H2}`}>
            Хоёр зам, <span className="serif">нэг</span> студи.
          </h2>
          <div className="mt-10 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr))]">
            <article className="ax-reveal ax-card flex flex-col gap-6 rounded-[20px] border border-line bg-surface p-[clamp(24px,3vw,40px)]">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <span className="text-[13px] font-extrabold tracking-[0.08em] text-brand uppercase">01 — Бэлэн загвар</span>
                <span className="text-[13px] font-bold text-muted">Notion · Canva · Excel</span>
              </div>
              <h3 className="text-[clamp(24px,2.4vw,32px)] leading-[1.18] font-extrabold tracking-[-0.02em]">Бэлэн загвараар ажлаа хялбарчил.</h3>
              <p className="text-[17px] leading-relaxed text-muted">Хичээл, контент, төсөв, сошиал пост — өөрийн бүртгэл рүү хуулаад шууд ашиглах загварууд.</p>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="flex flex-col gap-2 rounded-xl border border-line bg-bg px-3 py-3.5">
                  <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-ink text-[13px] font-extrabold text-white">N</span>
                  <span className="text-sm font-bold">Notion</span>
                </div>
                <div className="flex flex-col gap-2 rounded-xl border border-line bg-bg px-3 py-3.5">
                  <span className="h-[26px] w-[26px] rounded-full bg-[#2B8C8C]" />
                  <span className="text-sm font-bold">Canva</span>
                </div>
                <div className="flex flex-col gap-2 rounded-xl border border-line bg-bg px-3 py-3.5">
                  <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-[#2F7A4D] text-[13px] font-extrabold text-white">X</span>
                  <span className="text-sm font-bold">Excel</span>
                </div>
              </div>
              <Link href="/templates" className="ax-btn ax-primary mt-auto inline-flex min-h-12 items-center gap-2.5 self-start rounded-xl bg-brand px-5 text-[15px] font-bold text-white no-underline">
                Загварууд үзэх
                <span className="ax-arrow">
                  <ArrowRight />
                </span>
              </Link>
            </article>

            <article className="ax-reveal ax-card relative flex flex-col gap-6 overflow-hidden rounded-[20px] border border-ink bg-ink p-[clamp(24px,3vw,40px)] text-bg">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <span className="text-[13px] font-extrabold tracking-[0.08em] text-lime uppercase">02 — Захиалгат веб</span>
                <span className="text-[13px] font-bold text-dark-muted">Жижиг бизнест</span>
              </div>
              <h3 className="text-[clamp(24px,2.4vw,32px)] leading-[1.18] font-extrabold tracking-[-0.02em]">
                Бизнесийнхээ вебийг <span className="serif text-lime">өөрийнхөөрөө</span> бүтээ.
              </h3>
              <p className="text-[17px] leading-relaxed text-dark-muted">Өнгө, хэв маягаа урьдчилан туршаад, хэрэгцээгээ анкетаар илгээнэ. Үнэ, хугацааг хамтдаа тохирно.</p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {["Бизнесийн танилцуулга", "Кофе шоп, QR меню", "Онлайн дэлгүүр", "Portfolio", "Цаг захиалга"].map((x) => (
                  <li key={x} className="rounded-[10px] border border-dark-line px-3 py-2 text-sm font-semibold">
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap gap-2.5">
                <Link href="/builder" className="ax-btn ax-lime inline-flex min-h-12 items-center gap-2.5 rounded-xl bg-lime px-5 text-[15px] font-extrabold text-ink no-underline">
                  Вебээ загварчлах
                  <span className="ax-arrow">
                    <ArrowRight />
                  </span>
                </Link>
                <Link href="/services" className="ax-btn inline-flex min-h-12 items-center rounded-xl border border-dark-line-2 px-[18px] text-[15px] font-bold text-bg no-underline">
                  Дэлгэрэнгүй
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section aria-labelledby="feat-title" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,40px)] py-14 min-[900px]:py-[104px]">
            <div className="ax-reveal flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="flex max-w-[640px] flex-col gap-3">
                <h2 id="feat-title" className={H2}>
                  Онцлох <span className="serif">загварууд</span>
                </h2>
                <p className="text-[17px] leading-relaxed text-muted">Хичээл, бизнес, контентод зориулсан, шууд ашиглахад бэлэн.</p>
              </div>
              <Link href="/templates" className="ax-link inline-flex min-h-11 items-center gap-2 font-bold text-ink no-underline">
                Бүгдийг үзэх
                <span className="ax-arrow">
                  <ArrowRight />
                </span>
              </Link>
            </div>
            <Suspense fallback={<div className="mt-7"><CardSkeletons count={3} /></div>}>
              <FeaturedTemplates />
            </Suspense>
          </div>
        </section>

        <PaletteDemo />

        <section aria-labelledby="proc-title" className="border-y border-line bg-soft">
          <div className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,40px)] py-14 min-[900px]:py-[104px]">
            <h2 id="proc-title" className={`ax-reveal ${H2}`}>
              Ажиллах <span className="serif">үйл явц</span>
            </h2>
            <ol className="relative m-0 mt-12 grid list-none gap-5 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))]">
              <li className="ax-steps-line absolute top-[27px] right-6 left-6 h-px bg-line-mid" aria-hidden="true" />
              {[
                ["Загвар эсвэл үйлчилгээ сонгоно", "Бэлэн загварын дэлгүүр эсвэл захиалгат вебийн demo-оос эхэлнэ.", "bg-brand text-white"],
                ["Хэрэгцээгээ тодорхойлно", "Авах хүсэлт эсвэл 7 алхамтай анкетаар шаардлагаа илгээнэ.", "border border-line-mid bg-surface text-brand"],
                ["Ажлын хүрээ, үнэ, хугацааг тохирно", "Таны сонгосон сувгаар холбогдож, үнийн санал илгээнэ.", "border border-line-mid bg-surface text-brand"],
                ["Бэлэн шийдлээ хүлээн авна", "Загвар эсвэл веб сайтаа хэрхэн ашиглах заавартай нь авна.", "bg-lime text-ink"],
              ].map(([t, d, c], i) => (
                <li key={t} className="ax-reveal relative flex flex-col gap-3.5">
                  <span className={`serif inline-flex h-14 w-14 items-center justify-center rounded-2xl text-[26px] ${c}`}>{i + 1}</span>
                  <h3 className="text-[19px] leading-[1.3] font-extrabold">{t}</h3>
                  <p className="text-[15px] leading-relaxed text-muted">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="faq"
          aria-labelledby="faq-title"
          className="mx-auto grid max-w-[1240px] items-start gap-[clamp(28px,5vw,72px)] px-[clamp(16px,4vw,40px)] py-14 [grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr))] min-[900px]:py-28"
        >
          <div className="ax-reveal flex flex-col gap-4">
            <h2 id="faq-title" className={H2}>
              Түгээмэл <span className="serif">асуулт</span>
            </h2>
            <p className="text-[17px] leading-relaxed text-muted">
              Хариулт олдохгүй бол <Link href="/contact">бидэнтэй шууд холбогдоорой</Link>.
            </p>
          </div>
          <Faq items={content.faq} />
        </section>

        <section aria-labelledby="cta-title" className="px-[clamp(16px,4vw,40px)] pb-[clamp(56px,7vw,96px)]">
          <div className="ax-reveal relative mx-auto grid max-w-[1240px] items-end gap-8 overflow-hidden rounded-[28px] bg-ink p-[clamp(28px,6vw,80px)] text-bg [grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr))]">
            <div aria-hidden="true" className="ax-spin absolute -top-[120px] -right-[120px] h-[340px] w-[340px] rounded-full border border-dashed border-[#3C5446]" />
            <div aria-hidden="true" className="absolute -top-10 -right-10 h-[180px] w-[180px] rounded-full border border-[#3C5446]" />
            <h2 id="cta-title" className="relative text-[clamp(32px,4.4vw,60px)] leading-[1.05] font-extrabold tracking-[-0.03em]">
              Санаагаа бидэнтэй <span className="serif text-lime">хуваалц.</span>
            </h2>
            <div className="relative flex flex-col gap-5">
              <p className="text-[17px] leading-relaxed text-dark-muted">Анкет бөглөхөд 10 орчим минут. Хариултаа шалгаад илгээх хүртэл алхам хооронд хадгална.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/order" className="ax-btn ax-lime inline-flex min-h-[54px] items-center gap-2.5 rounded-xl bg-lime px-6 text-base font-extrabold text-ink no-underline">
                  Үнийн санал авах
                  <span className="ax-arrow">
                    <ArrowRight />
                  </span>
                </Link>
                <Link href="/templates" className="ax-btn inline-flex min-h-[54px] items-center rounded-xl border border-dark-line-2 px-[22px] text-base font-bold text-bg no-underline">
                  Загварууд үзэх
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
