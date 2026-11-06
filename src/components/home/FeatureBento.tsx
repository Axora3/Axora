import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import { Icon, type IconName } from "@/components/ui/icon";
import { SpotlightGroup } from "@/components/ui/spotlight";
import type { TemplateCategory } from "@/lib/templates/types";
import { PaletteDemo } from "./PaletteDemo";

function ExcelVisual() {
  return (
    <div aria-hidden="true" className="ax-light overflow-hidden rounded-control border border-line bg-white text-[10.5px] text-ink">
      <div className="grid grid-cols-[1.4fr_1fr]">
        <span className="bg-[#2F7A4D] px-2 py-1 font-extrabold text-white">Ангилал</span>
        <span className="bg-[#2F7A4D] px-2 py-1 font-extrabold text-white">Дүн</span>
        {["Орлого", "Зарлага", "Үлдэгдэл"].map((row) => (
          <span key={row} className="contents">
            <span className="border-t border-line-soft px-2 py-1">{row}</span>
            <span className="border-t border-line-soft bg-soft-2 px-2 py-1"><span className="block h-2 w-3/4 rounded-sm bg-line-mid" /></span>
          </span>
        ))}
      </div>
    </div>
  );
}

function NotionVisual() {
  return (
    <div aria-hidden="true" className="ax-light flex flex-col gap-2 rounded-control border border-line bg-white p-3 text-ink">
      {[true, true, false].map((done, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded ${done ? "bg-primary text-on-primary" : "border-[1.5px] border-line-dashed"}`}>{done && <Check size={11} strokeWidth={3.2} />}</span>
          <span className="h-2 rounded-sm bg-line" style={{ width: `${82 - i * 16}%` }} />
        </span>
      ))}
    </div>
  );
}

function CanvaVisual() {
  return (
    <div aria-hidden="true" className="ax-light grid grid-cols-3 gap-2">
      <span className="aspect-[4/5] rounded-inner bg-[#2B8C8C]" />
      <span className="aspect-[4/5] translate-y-1.5 rounded-inner bg-[#E9D3B5]" />
      <span className="aspect-[4/5] rounded-inner bg-lime" />
    </div>
  );
}

const CATEGORIES: { category: TemplateCategory; icon: IconName; title: string; description: string; visual: ReactNode }[] = [
  { category: "Excel", icon: "table", title: "Excel загвар", description: "Төсөв, борлуулалт, бүртгэлийн автомат тооцоотой хүснэгтүүд.", visual: <ExcelVisual /> },
  { category: "Notion", icon: "file-text", title: "Notion загвар", description: "Хичээл, контент, ажлаа нэг самбараас төлөвлөнө.", visual: <NotionVisual /> },
  { category: "Canva", icon: "photo", title: "Canva загвар", description: "Сошиал пост, танилцуулга — өнгө, текстээ солиход бэлэн.", visual: <CanvaVisual /> },
];

/** Four columns: the live palette demo anchors the grid, and each other cell shows its own small product visual. */
export function FeatureBento({ counts }: { counts?: Record<TemplateCategory, number> }) {
  return (
    <section aria-labelledby="cat-title" className="ax-container ax-section">
      <div className="ax-reveal flex flex-wrap items-end justify-between gap-4">
        <h2 id="cat-title" className="ax-h2 max-w-[14em]">
          Бүтээх бүх зүйл <span className="serif">нэг дор</span>
        </h2>
        <p className="max-w-[26em] text-base leading-relaxed text-muted">Загвараа сонгох, вебээ турших, хэрэгцээгээ илгээх ажил нэг газраас.</p>
      </div>

      <SpotlightGroup className="mt-8 grid gap-4 sm:grid-cols-2 desk:grid-cols-4">
        <div className="ax-reveal sm:col-span-2 desk:row-span-2">
          <PaletteDemo />
        </div>

        {CATEGORIES.map((c) => (
          <Link key={c.category} href={`/templates?cat=${c.category}`} className="ax-card ax-spot ax-reveal flex min-h-[260px] flex-col gap-4 rounded-card border border-line bg-surface p-5 text-ink no-underline">
            <span className="flex items-center justify-between gap-2">
              <Icon name={c.icon} size={22} className="text-brand" />
              {!!counts?.[c.category] && <span className="ax-badge">{counts[c.category]} загвар</span>}
            </span>
            {c.visual}
            <span className="mt-auto flex flex-col gap-1.5">
              <strong className="text-[18px] tracking-[-0.01em]">{c.title}</strong>
              <span className="text-[14px] leading-[1.5] text-muted">{c.description}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-brand">
              Үзэх
              <span className="ax-arrow"><ArrowRight size={16} /></span>
            </span>
          </Link>
        ))}

        <Link href="/builder" className="ax-card ax-reveal flex min-h-[260px] flex-col justify-between gap-4 overflow-hidden rounded-card border border-band bg-band p-5 text-on-band no-underline">
          <span aria-hidden="true" className="flex items-end gap-2.5 text-lime">
            <Icon name="monitor" size={38} />
            <Icon name="tablet" size={30} />
            <Icon name="smartphone" size={24} />
          </span>
          <span className="flex flex-col gap-1.5">
            <strong className="text-[18px] tracking-[-0.01em]">Website Builder</strong>
            <span className="text-[14px] leading-[1.5] text-band-muted">Desktop, tablet, гар утсан дээр хэрхэн харагдахыг шууд шалгана.</span>
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-lime">
            Туршиж үзэх
            <span className="ax-arrow"><ArrowRight size={16} /></span>
          </span>
        </Link>

        <Link href="/compare" className="ax-card ax-spot ax-reveal flex flex-col justify-between gap-5 rounded-card border border-line bg-surface p-5 text-ink no-underline sm:col-span-2 sm:flex-row sm:items-center">
          <span className="flex flex-col gap-1.5">
            <strong className="text-[18px] tracking-[-0.01em]">Хадгалаад, харьцуулаад шийд</strong>
            <span className="max-w-[30em] text-[14px] leading-[1.5] text-muted">Таалагдсан загвараа хадгалж, 3 хүртэлхийг нь зэрэгцүүлэн харьцуулна.</span>
          </span>
          <span aria-hidden="true" className="flex shrink-0 gap-2 text-brand">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-soft"><Icon name="heart" size={20} /></span>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-lime text-on-lime"><Icon name="swap" size={20} /></span>
          </span>
        </Link>

        <Link href="/order" className="ax-card ax-spot ax-reveal flex flex-col justify-between gap-5 rounded-card border border-line bg-surface p-5 text-ink no-underline sm:col-span-2 sm:flex-row sm:items-center">
          <span className="flex flex-col gap-1.5">
            <strong className="text-[18px] tracking-[-0.01em]">Анкетаар хэрэгцээгээ илгээ</strong>
            <span className="max-w-[30em] text-[14px] leading-[1.5] text-muted">Бөглөхөд 10 орчим минут. Хариултаа илгээхээс өмнө шалгана.</span>
          </span>
          <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-soft text-brand"><Icon name="list-check" size={20} /></span>
        </Link>
      </SpotlightGroup>
    </section>
  );
}
