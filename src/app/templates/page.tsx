import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Catalog } from "@/components/templates/Catalog";
import { CardSkeletons, DemoNotice } from "@/components/templates/TemplateCard";
import { buttonStyles } from "@/components/ui/button";
import { LoadError } from "@/components/ui/RetryButton";
import { getPublishedTemplates } from "@/lib/templates/service";

export const metadata: Metadata = {
  title: "Бэлэн загварууд",
  description: "Notion, Canva, Excel бэлэн загваруудаас хайж, шүүж, өөрт тохирохыг нь сонгоорой.",
  alternates: { canonical: "/templates" },
};

function Loading() {
  return (
    <div className="mt-8 grid items-start gap-8 min-[1024px]:grid-cols-[236px_minmax(0,1fr)]">
      <div aria-hidden="true" className="flex flex-col gap-2 max-[1023px]:hidden">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="ax-sk h-10 rounded-control" />)}
      </div>
      <div>
        <p aria-live="polite" className="mb-5 text-[15px] font-bold">Загваруудыг ачаалж байна…</p>
        <CardSkeletons count={6} />
      </div>
    </div>
  );
}

async function CatalogData() {
  const res = await getPublishedTemplates();
  if (!res.ok) return <LoadError />;
  return (
    <>
      {res.templates.some((t) => t.isDemo) && <DemoNotice className="mt-5" />}
      <Catalog templates={res.templates} />
    </>
  );
}

export default function TemplatesPage() {
  return (
    <>
      <SiteHeader active="/templates" />
      <main id="main" className="ax-container pt-[clamp(16px,3vw,32px)] pb-section">
        <div className="ax-page-hero ax-in-sm flex flex-col gap-2 py-[clamp(20px,3vw,36px)]">
          <span className="ax-eyebrow">Marketplace</span>
          <h1 className="ax-h1">
            Бэлэн <span className="serif">загварууд</span>
          </h1>
          <p className="ax-lead max-w-[32em]">Notion, Canva, Excel загваруудаас хайж, шүүж, өөрт тохирохыг нь сонго.</p>
        </div>

        <Suspense fallback={<Loading />}>
          <CatalogData />
        </Suspense>

        <section aria-labelledby="custom-title" className="mt-[72px] flex flex-wrap items-center justify-between gap-5 rounded-panel bg-band p-[clamp(24px,4vw,48px)] text-on-band">
          <div className="flex max-w-[560px] flex-col gap-2">
            <h2 id="custom-title" className="text-[clamp(22px,2.4vw,30px)] font-extrabold tracking-[-0.02em]">
              Загвар биш, <span className="serif text-lime">бүтэн веб</span> хэрэгтэй юу?
            </h2>
            <p className="text-base leading-relaxed text-dark-muted">Өнгө, хэв маягаа туршаад үнийн санал аваарай.</p>
          </div>
          <Link href="/builder" className={buttonStyles("lime", "ax-btn", "lg")}>
            Вебсайт бүтээх
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
