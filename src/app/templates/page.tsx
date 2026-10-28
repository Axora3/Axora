import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "@/components/icons";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Catalog } from "@/components/templates/Catalog";
import { CardSkeletons, DemoNotice } from "@/components/templates/TemplateCard";
import { LoadError } from "@/components/ui/RetryButton";
import { getPublishedTemplates } from "@/lib/templates/service";

export const metadata: Metadata = {
  title: "Бэлэн загварууд",
  description: "Notion, Canva, Excel бэлэн загваруудаас хайж, шүүж, өөрт тохирохыг нь сонгоорой.",
};

function Loading() {
  return (
    <>
      <div className="mt-8 h-[136px] rounded-[18px] border border-line bg-surface" aria-hidden="true" />
      <p aria-live="polite" className="mt-6 text-[15px] font-bold">
        Загваруудыг ачаалж байна…
      </p>
      <div className="mt-5">
        <CardSkeletons count={6} />
      </div>
    </>
  );
}

async function CatalogData() {
  const res = await getPublishedTemplates();
  if (!res.ok) return <LoadError />;
  return (
    <>
      {res.templates.some((t) => t.isDemo) && (
        <div className="mt-4">
          <DemoNotice />
        </div>
      )}
      <Catalog templates={res.templates} />
    </>
  );
}

export default function TemplatesPage() {
  return (
    <>
      <SiteHeader active="/templates" />
      <main id="main" className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,40px)] pt-[clamp(24px,5vw,64px)] pb-[104px]">
        <Link href="/" className="ax-link inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-muted no-underline">
          <ArrowLeft size={16} />
          Нүүр
        </Link>
        <div className="ax-in-sm mt-2 flex max-w-[640px] flex-col gap-3">
          <h1 className="text-[clamp(34px,4.6vw,60px)] leading-[1.04] font-extrabold tracking-[-0.03em]">
            Бэлэн <span className="serif">загварууд</span>
          </h1>
          <p className="text-[17px] leading-relaxed text-muted">Notion, Canva, Excel загваруудаас хайж, шүүж, өөрт тохирохыг нь сонго.</p>
        </div>

        <Suspense fallback={<Loading />}>
          <CatalogData />
        </Suspense>

        <section
          aria-labelledby="custom-title"
          className="mt-[72px] flex flex-wrap items-center justify-between gap-5 rounded-[22px] bg-ink p-[clamp(24px,4vw,48px)] text-bg"
        >
          <div className="flex max-w-[560px] flex-col gap-2">
            <h2 id="custom-title" className="text-[clamp(22px,2.4vw,30px)] font-extrabold tracking-[-0.02em]">
              Загвар биш, <span className="serif text-lime">бүтэн веб</span> хэрэгтэй юу?
            </h2>
            <p className="text-base leading-relaxed text-dark-muted">Өнгө, хэв маягаа туршаад үнийн санал аваарай.</p>
          </div>
          <Link href="/builder" className="ax-btn ax-lime inline-flex min-h-[50px] items-center rounded-xl bg-lime px-[22px] text-[15px] font-extrabold text-ink no-underline">
            Вебээ загварчлах
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
