import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Icon, type IconName } from "@/components/ui/icon";
import { SpotlightGroup } from "@/components/ui/spotlight";
import type { TemplateCategory } from "@/lib/templates/types";

const CATEGORIES: { category: TemplateCategory; icon: IconName; color: string; title: string; description: string }[] = [
  { category: "Excel", icon: "table", color: "#2F7A4D", title: "Excel загвар", description: "Төсөв, борлуулалт, бүртгэлийн автомат тооцоотой хүснэгтүүд." },
  { category: "Notion", icon: "file-text", color: "#17251E", title: "Notion загвар", description: "Хичээл, контент, ажлаа нэг самбараас төлөвлөх загварууд." },
  { category: "Canva", icon: "photo", color: "#2B8C8C", title: "Canva загвар", description: "Сошиал пост, танилцуулга — өнгө, текстээ солиход бэлэн." },
];

export function Categories({ counts }: { counts?: Record<TemplateCategory, number> }) {
  return (
    <section aria-labelledby="cat-title" className="ax-container pt-2 pb-[var(--ax-space-section)]">
      <div className="ax-reveal flex flex-wrap items-end justify-between gap-4">
        <h2 id="cat-title" className="ax-h2">
          Ангиллаар <span className="serif">хайх</span>
        </h2>
        <p className="max-w-[26em] text-base leading-relaxed text-muted">Ямар программ ашигладаг вэ? Тэр ангиллаасаа эхлээрэй.</p>
      </div>

      <SpotlightGroup className="mt-8 grid gap-4 min-[700px]:grid-cols-2 min-[1024px]:grid-cols-[1.25fr_1fr_1fr] min-[1024px]:grid-rows-2">
        <Link
          href="/services"
          className="ax-card ax-reveal relative flex min-h-[260px] flex-col justify-between gap-6 overflow-hidden rounded-card border border-band bg-band p-[clamp(22px,2.6vw,32px)] text-on-band no-underline min-[700px]:col-span-2 min-[1024px]:col-span-1 min-[1024px]:row-span-2"
        >
          <span aria-hidden="true" className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--ax-lime)_30%,transparent),transparent_68%)]" />
          <span aria-hidden="true" className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-control bg-lime text-on-lime">
            <Icon name="monitor" size={24} />
          </span>
          <span className="relative flex flex-col gap-2.5">
            <strong className="text-[clamp(24px,2.4vw,32px)] leading-[1.15] font-extrabold tracking-[-0.02em]">
              Захиалгат веб <span className="serif text-lime">сайт</span>
            </strong>
            <span className="max-w-[30em] text-[15px] leading-relaxed text-dark-muted">Танилцуулга, меню, онлайн дэлгүүр, цаг захиалга — бизнесийнхээ хэрэгцээнд тааруулж хийлгэнэ.</span>
            <span className="mt-2 inline-flex items-center gap-2 text-[15px] font-bold text-lime">
              Веб хөгжүүлэлт
              <span className="ax-arrow">
                <ArrowRight size={16} />
              </span>
            </span>
          </span>
        </Link>

        {CATEGORIES.map((c, index) => (
          <Link
            key={c.category}
            href={`/templates?cat=${c.category}`}
            className={`ax-card ax-spot ax-reveal flex flex-col gap-4 rounded-card border border-line bg-surface p-6 text-ink no-underline ${index === 2 ? "min-[700px]:col-span-2" : ""}`}
          >
            <span className="flex items-center justify-between">
              <span
                aria-hidden="true"
                className="inline-flex h-11 w-11 items-center justify-center rounded-control text-white shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.1)]"
                style={{ background: c.color }}
              >
                <Icon name={c.icon} size={22} />
              </span>
              {!!counts?.[c.category] && <span className="ax-badge">{counts[c.category]} загвар</span>}
            </span>
            <span className="flex flex-col gap-1.5">
              <strong className="text-[19px] tracking-[-0.01em]">{c.title}</strong>
              <span className="text-[15px] leading-[1.55] text-muted">{c.description}</span>
            </span>
            <span className="mt-auto inline-flex items-center gap-2 text-[15px] font-bold text-brand">
              {c.title} үзэх
              <span className="ax-arrow">
                <ArrowRight size={16} />
              </span>
            </span>
          </Link>
        ))}
      </SpotlightGroup>
    </section>
  );
}
