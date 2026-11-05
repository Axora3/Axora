import type { Metadata } from "next";
import { Builder } from "@/components/builder/Builder";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Вебээ загварчлах — Live demo",
  description: "Бизнесийн төрөл, хэв маяг, өнгөө сонгоод жишээ веб шууд хэрхэн өөрчлөгдөхийг хараарай.",
};

/** The builder is a full-height workspace, so it has no marketing footer. */
export default function BuilderPage() {
  return (
    <>
      <SiteHeader wide variant="compact" label="Вебээ загварчлах" back={{ href: "/services", label: "Веб хөгжүүлэлт" }} />
      <main id="main">
        <h1 className="sr-only">Вебээ загварчлах</h1>
        <Builder />
      </main>
    </>
  );
}
