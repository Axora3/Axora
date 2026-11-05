import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Icon, type IconName } from "@/components/ui/icon";
import { SpotlightGroup } from "@/components/ui/spotlight";
import type { TemplateCategory } from "@/lib/templates/types";
import { PaletteDemo } from "./PaletteDemo";

const CATEGORIES: { category: TemplateCategory; icon: IconName; color: string; title: string; description: string }[] = [
  { category: "Excel", icon: "table", color: "#2F7A4D", title: "Excel загвар", description: "Төсөв, борлуулалт, бүртгэлийн автомат тооцоотой хүснэгтүүд." },
  { category: "Notion", icon: "file-text", color: "#17251E", title: "Notion загвар", description: "Хичээл, контент, ажлаа нэг самбараас төлөвлөх загварууд." },
  { category: "Canva", icon: "photo", color: "#2B8C8C", title: "Canva загвар", description: "Сошиал пост, танилцуулга — өнгө, текстээ солиход бэлэн." },
];

/** Four columns: the live palette demo is the large cell, categories and devices surround it. */
export function FeatureBento({ counts }: { counts?: Record<TemplateCategory, number> }) {
  return (
    <section aria-labelledby="cat-title" className="ax-container ax-section">
      <div className="ax-reveal flex flex-wrap items-end justify-between gap-4">
        <h2 id="cat-title" className="ax-h2 max-w-[14em]">
          Ангиллаар <span className="serif">хайх</span>
        </h2>
        <p className="max-w-[26em] text-base leading-relaxed text-muted">Ямар программ ашигладаг вэ? Тэр ангиллаасаа эхлээрэй.</p>
      </div>

      <SpotlightGroup className="mt-8 grid gap-4 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-4">
        <div className="ax-reveal min-[640px]:col-span-2 min-[1100px]:row-span-2">
          <PaletteDemo />
        </div>

        {CATEGORIES.map((c) => (
          <Link key={c.category} href={`/templates?cat=${c.category}`} className="ax-card ax-spot ax-reveal flex min-h-[220px] flex-col gap-4 rounded-card border border-line bg-surface p-5 text-ink no-underline">
            <span className="flex items-center justify-between">
              <span aria-hidden="true" className="inline-flex h-11 w-11 items-center justify-center rounded-control text-white shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.1)]" style={{ background: c.color }}>
                <Icon name={c.icon} size={22} />
              </span>
              {!!counts?.[c.category] && <span className="ax-badge">{counts[c.category]} загвар</span>}
            </span>
            <span className="flex flex-col gap-1.5">
              <strong className="text-[18px] tracking-[-0.01em]">{c.title}</strong>
              <span className="text-[14.5px] leading-[1.5] text-muted">{c.description}</span>
            </span>
            <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-brand">
              {c.title} үзэх
              <span className="ax-arrow"><ArrowRight size={16} /></span>
            </span>
          </Link>
        ))}

        <Link href="/builder" className="ax-card ax-reveal flex min-h-[220px] flex-col justify-between gap-4 overflow-hidden rounded-card border border-band bg-band p-5 text-on-band no-underline">
          <span aria-hidden="true" className="flex items-end gap-2.5 text-lime">
            <Icon name="monitor" size={34} />
            <Icon name="tablet" size={28} />
            <Icon name="smartphone" size={22} />
          </span>
          <span className="flex flex-col gap-1.5">
            <strong className="text-[18px] tracking-[-0.01em]">Вебээ загварчлах</strong>
            <span className="text-[14.5px] leading-[1.5] text-band-muted">Desktop, tablet, гар утсан дээр хэрхэн харагдахыг шууд шалгана.</span>
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-lime">
            Туршиж үзэх
            <span className="ax-arrow"><ArrowRight size={16} /></span>
          </span>
        </Link>
      </SpotlightGroup>
    </section>
  );
}
