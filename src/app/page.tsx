import Link from "next/link";
import { Suspense } from "react";
import { Faq } from "@/components/home/Faq";
import { FeatureBento } from "@/components/home/FeatureBento";
import { HomeHero } from "@/components/home/HomeHero";
import { Process } from "@/components/home/Process";
import { Services } from "@/components/home/Services";
import { Trust } from "@/components/home/Trust";
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
  return (
    <FeaturedShell>
      {list.some((t) => t.isDemo) && <DemoNotice className="mt-5" />}
      <div className="mt-8 grid gap-5 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3">
        {list.map((t, index) => (
          <TemplateCard key={t.id} t={t} headingLevel="h3" feature={index === 0} className={`ax-reveal ${index === 0 ? "min-[640px]:col-span-2" : ""}`} />
        ))}
      </div>
    </FeaturedShell>
  );
}

export default async function HomePage() {
  const content = await getSiteContent();
  return (
    <>
      <SiteHeader tone="band" />
      <main id="main">
        <HomeHero c={content} />

        <Services />

        <Suspense fallback={<FeaturedShell><div className="mt-8"><CardSkeletons count={3} /></div></FeaturedShell>}>
          <FeaturedTemplates />
        </Suspense>

        <Suspense fallback={<FeatureBento />}>
          <Bento />
        </Suspense>

        <Process />

        <div className="pt-[var(--ax-space-section)]">
          <Trust />
        </div>

        <section id="faq" aria-labelledby="faq-title" className="ax-container pb-[var(--ax-space-section)] grid items-start gap-[clamp(28px,5vw,72px)] [grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr))]">
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

        <section aria-labelledby="cta-title" className="px-[clamp(16px,4vw,40px)] pb-[var(--ax-space-section)]">
          <div className="ax-reveal mx-auto grid max-w-[1160px] items-end gap-8 rounded-panel bg-lime p-[clamp(28px,6vw,72px)] text-on-lime [grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr))]">
            <h2 id="cta-title" className="ax-h1">
              Санаагаа бидэнтэй <span className="serif">хуваалц.</span>
            </h2>
            <div className="flex flex-col gap-5">
              <p className="text-[17px] leading-relaxed">Анкет бөглөхөд 10 орчим минут. Хариултаа шалгаад илгээх хүртэл алхам хооронд хадгална.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/order" className="ax-button ax-button-lg ax-btn border-[#17251E] bg-[#17251E] text-[#F7F8F2] hover:bg-[#22352B]">
                  Үнийн санал авах
                  <span className="ax-arrow"><ArrowRight /></span>
                </Link>
                <Link href="/templates" className="ax-button ax-button-lg ax-btn border-[#17251E] bg-transparent text-[#17251E]">
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
