import Link from "next/link";
import { Suspense } from "react";
import { Categories } from "@/components/home/Categories";
import { Compare } from "@/components/home/Compare";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PaletteDemo } from "@/components/home/PaletteDemo";
import { Trust } from "@/components/home/Trust";
import { ArrowRight } from "@/components/icons";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CardSkeletons, DemoNotice, TemplateCard } from "@/components/templates/TemplateCard";
import { getSiteContent } from "@/lib/content/service";
import { getPublishedTemplates } from "@/lib/templates/service";
import type { TemplateCategory } from "@/lib/templates/types";

const H2 = "text-[clamp(28px,3.4vw,44px)] leading-[1.12] font-extrabold tracking-[-0.025em]";

async function CategoryCounts() {
  const res = await getPublishedTemplates();
  if (!res.ok) return <Categories />;
  const counts: Record<TemplateCategory, number> = { Notion: 0, Canva: 0, Excel: 0 };
  if (res.ok) for (const t of res.templates) counts[t.category] += 1;
  return <Categories counts={counts} />;
}

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

        <Suspense fallback={<Categories />}>
          <CategoryCounts />
        </Suspense>

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

        <HowItWorks />

        <Compare />

        <PaletteDemo />

        <Trust />

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
          <div className="ax-reveal relative mx-auto grid max-w-[1240px] items-end gap-8 overflow-hidden rounded-[28px] bg-band p-[clamp(28px,6vw,80px)] text-on-band [grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr))]">
            <div aria-hidden="true" className="ax-spin absolute -top-[120px] -right-[120px] h-[340px] w-[340px] rounded-full border border-dashed border-band-ring" />
            <div aria-hidden="true" className="absolute -top-10 -right-10 h-[180px] w-[180px] rounded-full border border-band-ring" />
            <h2 id="cta-title" className="relative text-[clamp(32px,4.4vw,60px)] leading-[1.05] font-extrabold tracking-[-0.03em]">
              Санаагаа бидэнтэй <span className="serif text-lime">хуваалц.</span>
            </h2>
            <div className="relative flex flex-col gap-5">
              <p className="text-[17px] leading-relaxed text-dark-muted">Анкет бөглөхөд 10 орчим минут. Хариултаа шалгаад илгээх хүртэл алхам хооронд хадгална.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/order" className="ax-btn ax-lime inline-flex min-h-[54px] items-center gap-2.5 rounded-xl bg-lime px-6 text-base font-extrabold text-on-lime no-underline">
                  Үнийн санал авах
                  <span className="ax-arrow">
                    <ArrowRight />
                  </span>
                </Link>
                <Link href="/templates" className="ax-btn inline-flex min-h-[54px] items-center rounded-xl border border-dark-line-2 px-[22px] text-base font-bold text-on-band no-underline">
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
