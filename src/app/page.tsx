import Link from "next/link";
import { Suspense } from "react";
import { Faq } from "@/components/home/Faq";
import { FeatureBento } from "@/components/home/FeatureBento";
import { HomeHero } from "@/components/home/HomeHero";
import { Process } from "@/components/home/Process";
import { Services } from "@/components/home/Services";
import { WhyAxora } from "@/components/home/WhyAxora";
import { ArrowRight } from "@/components/icons";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CardSkeletons, DemoNotice, TemplateCard } from "@/components/templates/TemplateCard";
import { getSiteContent } from "@/lib/content/service";
import { getPublishedTemplates } from "@/lib/templates/service";
import type { TemplateCategory } from "@/lib/templates/types";

async function Bento() {
  const res = await getPublishedTemplates();
  if (!res.ok) return <FeatureBento />;
  const counts: Record<TemplateCategory, number> = { Notion: 0, Canva: 0, Excel: 0 };
  for (const t of res.templates) counts[t.category] += 1;
  return <FeatureBento counts={counts} />;
}

function FeaturedShell({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="feat-title" className="border-y border-line bg-surface">
      <div className="ax-container ax-section">
        <div className="ax-reveal flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex max-w-[640px] flex-col gap-3">
            <h2 id="feat-title" className="ax-h2">
              Онцлох <span className="serif">загварууд</span>
            </h2>
            <p className="ax-lead">Хичээл, бизнес, контентод зориулсан, шууд ашиглахад бэлэн.</p>
          </div>
          <Link href="/templates" className="ax-link inline-flex min-h-11 items-center gap-2 font-bold text-ink no-underline">
            Бүгдийг үзэх
            <span className="ax-arrow">
              <ArrowRight />
            </span>
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}

/** With nothing published there is nothing to feature, so the section steps aside. */
async function FeaturedTemplates() {
  const res = await getPublishedTemplates();
  if (!res.ok) {
    return (
      <FeaturedShell>
        <p role="alert" className="mt-7 rounded-control border border-danger-line bg-danger-bg p-4 text-[15px] font-semibold text-danger-ink">
          Загваруудыг ачаалж чадсангүй. <Link href="/templates">Загварын хуудсыг нээж</Link> дахин оролдоно уу.
        </p>
      </FeaturedShell>
    );
  }
  // Five cards fill the grid exactly once the first spans two columns.
  const list = res.templates.slice(0, 5);
  if (list.length === 0) return null;
  // A lone product takes the whole row instead of leaving a hole beside it.
  const single = list.length === 1;
  return (
    <FeaturedShell>
      {list.some((t) => t.isDemo) && <DemoNotice className="mt-5" />}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t, index) => (
          <TemplateCard key={t.id} t={t} headingLevel="h3" feature={index === 0} className={`ax-reveal ${single ? "sm:col-span-2 lg:col-span-3" : index === 0 ? "sm:col-span-2" : ""}`} />
        ))}
      </div>
    </FeaturedShell>
  );
}

function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="px-gutter py-section">
      <div className="ax-reveal relative isolate mx-auto max-w-[1160px] overflow-hidden rounded-panel bg-lime p-[clamp(32px,7vw,88px)] text-center text-on-lime">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_120%_at_50%_-10%,rgb(255_255_255_/_0.55),transparent_70%),radial-gradient(60%_90%_at_100%_110%,rgb(36_92_69_/_0.28),transparent_70%)]" />
        <h2 id="cta-title" className="ax-h1 mx-auto max-w-[14em]">
          Санаагаа өнөөдөр <span className="serif">вебсайт болго.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-[34em] text-[17px] leading-relaxed">Өнгө, хэв маягаа туршаад, хэрэгцээгээ анкетаар илгээгээрэй. Эсвэл бэлэн загвараас шууд эхэл.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/builder" className="ax-button ax-button-lg ax-btn border-forest-950 bg-forest-950 text-forest-50 hover:border-forest-900 hover:bg-forest-900 hover:text-forest-50 max-[480px]:w-full">
            Вебсайт бүтээх
            <span className="ax-arrow"><ArrowRight /></span>
          </Link>
          <Link href="/templates" className="ax-button ax-button-lg ax-btn border-forest-950 bg-transparent text-forest-950 hover:bg-transparent max-[480px]:w-full">
            Загварууд үзэх
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const content = await getSiteContent();
  return (
    <>
      <SiteHeader tone="band" active="/" />
      <main id="main">
        <HomeHero c={content} />

        {/* The padding leaves room for the hero's product stage, which overlaps this section. */}
        <div className="pt-[clamp(60px,8vw,120px)]">
          <Suspense fallback={<FeatureBento />}>
            <Bento />
          </Suspense>
        </div>

        <Services />

        <Process />

        <Suspense fallback={<FeaturedShell><div className="mt-8"><CardSkeletons count={3} /></div></FeaturedShell>}>
          <FeaturedTemplates />
        </Suspense>

        <WhyAxora />

        <section id="faq" aria-labelledby="faq-title" className="ax-container grid items-start gap-[clamp(28px,5vw,72px)] pt-section [grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr))]">
          <div className="ax-reveal flex flex-col gap-4">
            <h2 id="faq-title" className="ax-h2">
              Түгээмэл <span className="serif">асуулт</span>
            </h2>
            <p className="ax-lead">
              Хариулт олдохгүй бол <Link href="/contact">бидэнтэй шууд холбогдоорой</Link>.
            </p>
          </div>
          <Faq items={content.faq} />
        </section>

        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}