import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Icon } from "@/components/ui/icon";
import { formatPrice, type Template } from "@/lib/templates/types";
import { TemplatePreview } from "./TemplatePreview";

const iconButton = "ax-btn inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface/95 text-brand shadow-sm backdrop-blur disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Catalogue card. The whole card is clickable through one real link.
 * `feature` lays it out horizontally for the wide cell on the home page.
 */
export function TemplateCard({
  t,
  headingLevel = "h2",
  className = "",
  style,
  feature = false,
  favorite = false,
  comparing = false,
  comparisonFull = false,
  onFavorite,
  onCompare,
}: {
  t: Template;
  headingLevel?: "h2" | "h3";
  className?: string;
  style?: React.CSSProperties;
  feature?: boolean;
  favorite?: boolean;
  comparing?: boolean;
  comparisonFull?: boolean;
  onFavorite?: () => void;
  onCompare?: () => void;
}) {
  const H = headingLevel;
  const img = t.previewImages[0];
  const compareLabel = comparing ? `${t.title} загварыг харьцуулалтаас хасах` : `${t.title} загварыг харьцуулахад нэмэх`;
  return (
    <article className={`ax-card relative isolate flex flex-col overflow-hidden rounded-card border border-line bg-surface ${feature ? "min-[640px]:flex-row" : ""} ${className}`} style={style}>
      <div className={`ax-light relative overflow-hidden ${feature ? "aspect-[4/3] min-[640px]:aspect-auto min-[640px]:min-h-[340px] min-[640px]:flex-[1.35]" : "aspect-[4/3]"}`} style={{ background: t.previewStyle.tint }}>
        {img ? (
          <Image src={img.url} alt={img.alt} fill sizes={feature ? "(max-width: 640px) 100vw, 560px" : "(max-width: 700px) 100vw, 400px"} className="ax-prev object-cover" />
        ) : (
          <div className="ax-prev flex h-full items-center justify-center p-[22px]" aria-hidden="true">
            <TemplatePreview category={t.category} s={t.previewStyle} size={feature ? "lg" : undefined} />
          </div>
        )}
        <span className="ax-badge ax-badge-solid absolute top-3 left-3 z-[1]">{t.category}</span>
        <div className="absolute top-2 right-2 z-[1] flex gap-1.5">
          {onCompare && (
            <button
              type="button"
              aria-pressed={comparing}
              disabled={!comparing && comparisonFull}
              aria-label={compareLabel}
              onClick={onCompare}
              title={!comparing && comparisonFull ? "Нэг удаад 3 хүртэл загвар сонгоно" : comparing ? "Харьцуулалтаас хасах" : "Харьцуулах"}
              className={`${iconButton} ${comparing ? "!border-primary !bg-primary !text-on-primary" : ""}`}
            >
              <Icon name={comparing ? "check" : "swap"} size={18} />
            </button>
          )}
          {onFavorite && (
            <button
              type="button"
              aria-pressed={favorite}
              aria-label={favorite ? `${t.title} хадгалсан загвараас хасах` : `${t.title} хадгалсан загварт нэмэх`}
              title={favorite ? "Хадгалсан" : "Хадгалах"}
              onClick={onFavorite}
              className={iconButton}
            >
              <Icon name={favorite ? "heart-filled" : "heart"} size={18} />
            </button>
          )}
        </div>
      </div>
      <div className={`flex flex-1 flex-col gap-2 p-5 ${feature ? "min-[640px]:justify-end min-[640px]:p-7" : ""}`}>
        <H className={`leading-[1.25] font-extrabold tracking-[-0.012em] ${feature ? "text-[clamp(22px,2.2vw,30px)]" : "text-[18px]"}`}>{t.title}</H>
        <p className={`text-[15px] leading-[1.5] text-muted ${feature ? "" : "line-clamp-2"}`}>{t.shortDescription}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          {t.isFree ? <span className="ax-badge ax-badge-lime text-[13px]">{formatPrice(t)}</span> : <span className="text-[17px] font-extrabold tabular-nums">{formatPrice(t)}</span>}
          <Link href={`/templates/${t.slug}`} className="ax-stretch inline-flex min-h-11 items-center gap-1.5 px-0.5 text-sm font-bold text-brand no-underline" aria-label={`${t.title} — дэлгэрэнгүй`}>
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
  return <p className={`ax-badge ax-badge-warn rounded-inner py-1.5 text-[13px] ${className}`}>Үзүүлэн бүтээгдэхүүн — нэр, үнэ нь жишээ</p>;
}

export function CardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Ачаалж байна" className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr))]">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="ax-sk aspect-[4/3]" />
          <div className="flex flex-col gap-2.5 p-5">
            <div className="ax-sk h-[18px] w-[78%] rounded-md" />
            <div className="ax-sk h-3 w-[92%] rounded-md" />
            <div className="ax-sk h-3 w-[30%] rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
