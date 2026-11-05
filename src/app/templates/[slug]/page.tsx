import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "@/components/icons";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { DetailInfo } from "@/components/templates/DetailInfo";
import { Gallery } from "@/components/templates/Gallery";
import { TemplateCollectionActions } from "@/components/templates/TemplateCollectionActions";
import { TemplateRequest } from "@/components/templates/TemplateRequest";
import { LoadError } from "@/components/ui/RetryButton";
import { isBackendConfigured } from "@/lib/supabase/server";
import { getTemplateBySlug } from "@/lib/templates/service";
import { formatPrice } from "@/lib/templates/types";

export async function generateMetadata({ params }: PageProps<"/templates/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const res = await getTemplateBySlug(slug);
  if (!res.ok || !res.template) return { title: "Загвар олдсонгүй", robots: { index: false } };
  return { title: res.template.title, description: res.template.shortDescription };
}

async function Detail({ params }: { params: PageProps<"/templates/[slug]">["params"] }) {
  const { slug } = await params;
  const res = await getTemplateBySlug(slug);
  if (!res.ok) return <LoadError title="Загварыг ачаалж чадсангүй" />;
  const t = res.template;
  if (!t) notFound();
  const price = formatPrice(t);

  return (
    <div className="grid gap-[clamp(20px,3vw,40px)] [grid-template-columns:repeat(auto-fit,minmax(min(400px,100%),1fr))]">
      <div className="ax-in-sm min-[900px]:sticky min-[900px]:top-[96px] min-[900px]:self-start">
        <Gallery category={t.category} style={t.previewStyle} images={t.previewImages} title={t.title} />
      </div>
      <div className="ax-in-sm flex flex-col gap-[18px] [animation-delay:.06s]">
        <span className="ax-eyebrow">{t.category} загвар</span>
        <h1 className="ax-h2">{t.title}</h1>
        <p className="text-base leading-[1.65] text-muted">{t.longDescription}</p>
        <div className="ax-surface flex flex-col gap-3.5 p-[18px]">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="text-[30px] leading-none font-extrabold tracking-[-0.02em] tabular-nums max-[899px]:text-2xl">{price}</span>
            {t.isDemo && <span className="ax-badge ax-badge-warn">Жишээ үнэ</span>}
          </div>
          <TemplateCollectionActions template={{ id: t.id, title: t.title }} />
        </div>
        <dl className="m-0 grid grid-cols-2 gap-2.5 min-[900px]:gap-3">
          <div className="rounded-control border border-line bg-surface px-3.5 py-3">
            <dt className="text-xs font-extrabold text-muted">Шаардлагатай</dt>
            <dd className="m-0 mt-1.5 text-[15px] leading-snug font-semibold">{t.requirements}</dd>
          </div>
          <div className="rounded-control border border-line bg-surface px-3.5 py-3">
            <dt className="text-xs font-extrabold text-muted">Формат</dt>
            <dd className="m-0 mt-1.5 text-[15px] leading-snug font-semibold">{t.format}</dd>
          </div>
        </dl>
        <DetailInfo t={t} />
        <TemplateRequest
          slug={t.slug}
          title={t.title}
          category={t.category}
          priceLabel={price}
          tint={t.previewStyle.tint}
          isDemo={t.isDemo}
          backendEnabled={isBackendConfigured()}
        />
      </div>
    </div>
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
      <main id="main" className="ax-container pt-[clamp(16px,4vw,48px)] pb-[calc(120px+env(safe-area-inset-bottom))] min-[900px]:pb-[104px]">
        <Link href="/templates" className="ax-link mb-4 hidden min-h-11 items-center gap-1.5 text-sm font-bold text-muted no-underline min-[900px]:inline-flex">
          <ArrowLeft size={16} />
          Бүх загвар
        </Link>
        <Suspense fallback={<DetailSkeleton />}>
          <Detail params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
