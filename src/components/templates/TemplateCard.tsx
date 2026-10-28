import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { formatPrice, type Template } from "@/lib/templates/types";
import { TemplatePreview } from "./TemplatePreview";

/** Catalogue card. The whole card is clickable through one real link. */
export function TemplateCard({ t, headingLevel = "h2", className = "", style }: { t: Template; headingLevel?: "h2" | "h3"; className?: string; style?: React.CSSProperties }) {
  const H = headingLevel;
  const img = t.previewImages[0];
  return (
    <article className={`ax-card flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface ${className}`} style={style}>
      <div className="relative h-[200px] overflow-hidden" style={{ background: t.previewStyle.tint }}>
        {img ? (
          <Image src={img.url} alt={img.alt} fill sizes="(max-width: 700px) 100vw, 400px" className="ax-prev object-cover" />
        ) : (
          <div className="ax-prev flex h-full items-center justify-center p-[22px]" aria-hidden="true">
            <TemplatePreview category={t.category} s={t.previewStyle} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-[22px] pt-5 pb-[22px]">
        <span className="text-xs font-extrabold tracking-[0.06em] text-brand uppercase">{t.category}</span>
        <H className="text-[19px] leading-[1.3] font-extrabold tracking-[-0.01em]">{t.title}</H>
        <p className="text-[15px] leading-[1.55] text-muted">{t.shortDescription}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="text-base font-extrabold">{formatPrice(t)}</span>
          <Link
            href={`/templates/${t.slug}`}
            className="ax-stretch inline-flex min-h-11 items-center gap-1.5 px-0.5 text-sm font-bold text-brand no-underline"
            aria-label={`${t.title} — дэлгэрэнгүй`}
          >
            Дэлгэрэнгүй
            <span className="ax-arrow">
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function DemoNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`inline-flex items-center gap-2 rounded-lg bg-warn-bg px-2.5 py-1.5 text-[13px] font-bold text-warn ${className}`}>
      Үзүүлэн бүтээгдэхүүн — нэр, үнэ нь жишээ
    </p>
  );
}

export function CardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Ачаалж байна" className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr))]">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-[18px] border border-line bg-surface">
          <div className="ax-sk h-[200px]" />
          <div className="flex flex-col gap-2.5 p-5">
            <div className="ax-sk h-3 w-[30%] rounded-md" />
            <div className="ax-sk h-[18px] w-[78%] rounded-md" />
            <div className="ax-sk h-3 w-[92%] rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
