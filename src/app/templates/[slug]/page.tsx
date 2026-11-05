import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { DetailInfo } from "@/components/templates/DetailInfo";
import { Gallery } from "@/components/templates/Gallery";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateCollectionActions } from "@/components/templates/TemplateCollectionActions";
import { TemplateRequest } from "@/components/templates/TemplateRequest";
import { Icon } from "@/components/ui/icon";
import { LoadError } from "@/components/ui/RetryButton";
import { getSiteContent } from "@/lib/content/service";
import { isBackendConfigured } from "@/lib/supabase/server";
import { getPublishedTemplates, getTemplateBySlug } from "@/lib/templates/service";
import { formatPrice, type Template } from "@/lib/templates/types";

export async function generateMetadata({ params }: PageProps<"/templates/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const res = await getTemplateBySlug(slug);
  if (!res.ok || !res.template) return { title: "Загвар олдсонгүй", robots: { index: false } };
  return { title: res.template.title, description: res.template.shortDescription };
}

/** Same category first, then anything else that is published. Real catalogue data only. */
async function Related({ current }: { current: Template }) {
  const res = await getPublishedTemplates();
  if (!res.ok) return null;
  const others = res.templates.filter((t) => t.id !== current.id);
  const list = [...others.filter((t) => t.category === current.category), ...others.filter((t) => t.category !== current.category)].slice(0, 3);
  if (list.length === 0) return null;
  return (
    <section aria-labelledby="related-title" className="mt-[var(--ax-space-section)] border-t border-line pt-10">
      <h2 id="related-title" className="ax-h3">Бусад загвар</h2>
      <div className="mt-6 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr))]">
        {list.map((t) => <TemplateCard key={t.id} t={t} headingLevel="h3" />)}
      </div>
    </section>
  );
}

async function Detail({ params }: { params: PageProps<"/templates/[slug]">["params"] }) {
  const { slug } = await params;
  const res = await getTemplateBySlug(slug);
  if (!res.ok) return <LoadError title="Загварыг ачаалж чадсангүй" />;
  const t = res.template;
  if (!t) notFound();
  const price = formatPrice(t);
  const { bank } = await getSiteContent();

  return (
    <>
      <nav aria-label="Байршил" className="mb-5 hidden flex-wrap items-center gap-1.5 text-sm font-semibold text-muted min-[900px]:flex">
        <Link href="/templates" className="ax-link inline-flex min-h-11 items-center text-muted no-underline">Загварууд</Link>
        <Icon name="chevron-right" size={16} />
        <Link href={`/templates?cat=${t.category}`} className="ax-link inline-flex min-h-11 items-center text-muted no-underline">{t.category}</Link>
        <Icon name="chevron-right" size={16} />
        <span aria-current="page" className="truncate text-ink">{t.title}</span>
      </nav>
      <div className="grid items-start gap-x-[clamp(24px,4vw,56px)] gap-y-6 min-[1000px]:grid-cols-[minmax(0,1.3fr)_minmax(340px,1fr)]">
        <div className="ax-in-sm flex min-w-0 flex-col gap-8">
          <Gallery category={t.category} style={t.previewStyle} images={t.previewImages} title={t.title} />
          <div className="hidden flex-col gap-6 min-[1000px]:flex">
            <p className="text-[17px] leading-[1.7] text-muted">{t.longDescription}</p>
            <DetailInfo t={t} />
          </div>
        </div>
        <div className="ax-in-sm flex flex-col gap-4 [animation-delay:.06s] min-[1000px]:sticky min-[1000px]:top-[92px]">
          <span className="ax-eyebrow">{t.category} загвар</span>
          <h1 className="ax-h2">{t.title}</h1>
          <p className="text-[15px] leading-relaxed text-muted">{t.shortDescription}</p>
          <div className="ax-surface flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-baseline gap-2.5">
              {t.isFree ? <span className="ax-badge ax-badge-lime px-3 py-1.5 text-base">{price}</span> : <span className="text-[32px] leading-none font-extrabold tracking-[-0.02em] tabular-nums max-[899px]:text-2xl">{price}</span>}
              {t.isDemo && <span className="ax-badge ax-badge-warn">Жишээ үнэ</span>}
            </div>
            <TemplateRequest slug={t.slug} title={t.title} category={t.category} priceLabel={price} tint={t.previewStyle.tint} isDemo={t.isDemo} backendEnabled={isBackendConfigured()} isFree={t.isFree} bank={bank} />
            <TemplateCollectionActions template={{ id: t.id, title: t.title }} />
          </div>
          <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-control border border-line bg-line">
            <div className="bg-surface px-3.5 py-3">
              <dt className="text-xs font-extrabold text-muted">Шаардлагатай</dt>
              <dd className="m-0 mt-1 text-[14.5px] leading-snug font-semibold">{t.requirements}</dd>
            </div>
            <div className="bg-surface px-3.5 py-3">
              <dt className="text-xs font-extrabold text-muted">Формат</dt>
              <dd className="m-0 mt-1 text-[14.5px] leading-snug font-semibold">{t.format}</dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-col gap-5 min-[1000px]:hidden">
          <p className="text-base leading-[1.65] text-muted">{t.longDescription}</p>
          <DetailInfo t={t} />
        </div>
      </div>
      <Suspense fallback={null}>
        <Related current={t} />
      </Suspense>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Ачаалж байна" className="grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(min(400px,100%),1fr))]">
      <div className="ax-sk aspect-[4/3] rounded-card" />
      <div className="flex flex-col gap-4">
        <div className="ax-sk h-3.5 w-1/4 rounded-md" />
        <div className="ax-sk h-9 w-4/5 rounded-md" />
        <div className="ax-sk h-7 w-1/3 rounded-md" />
        <div className="ax-sk h-24 w-full rounded-md" />
      </div>
    </div>
  );
}

export default function TemplateDetailPage({ params }: PageProps<"/templates/[slug]">) {
  return (
    <>
      <SiteHeader active="/templates" mobileBack={{ href: "/templates", label: "Загварууд руу буцах", title: "Загварын дэлгэрэнгүй" }} />
      <main id="main" className="ax-container pt-[clamp(16px,3vw,32px)] pb-[calc(120px+env(safe-area-inset-bottom))] min-[900px]:pb-[var(--ax-space-section)]">
        <Suspense fallback={<DetailSkeleton />}>
          <Detail params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
