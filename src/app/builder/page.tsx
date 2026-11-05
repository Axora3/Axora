import { SiteFooter } from "@/components/site/SiteFooter";
import type { Metadata } from "next";
import { Builder } from "@/components/builder/Builder";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Вебээ загварчлах — Live demo",
  description: "Бизнесийн төрөл, хэв маяг, өнгөө сонгоод жишээ веб шууд хэрхэн өөрчлөгдөхийг хараарай.",
};

export default function BuilderPage() {
  return (
    <>
      <SiteHeader wide />
      <main id="main" className="mx-auto max-w-[1400px] px-[clamp(16px,3vw,32px)] pt-[clamp(20px,3vw,36px)] pb-[72px]">
        <div className="ax-in-sm flex flex-col gap-2">
          <h1 className="ax-h1">
            Вебээ <span className="serif">загварчлах</span>
          </h1>
          <p className="max-w-[46em] text-base leading-relaxed text-muted">Энэ нь дизайны урьдчилсан үзүүлэн. Эцсийн бүтэц, функц, үнийг хамтран тохирно.</p>
        </div>
        <Builder />
      </main><SiteFooter />
    </>
  );
}
