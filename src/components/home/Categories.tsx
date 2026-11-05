import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { ArrowRight } from "@/components/icons";
import type { TemplateCategory } from "@/lib/templates/types";

const CATEGORIES: {
  category: TemplateCategory;
  icon: IconName;
  color: string;
  title: string;
  description: string;
}[] = [
  {
    category: "Excel",
    icon: "table",
    color: "#2F7A4D",
    title: "Excel загвар",
    description: "Төсөв, борлуулалт, бүртгэлийн автомат тооцоотой хүснэгтүүд.",
  },
  {
    category: "Notion",
    icon: "file-text",
    color: "#17251E",
    title: "Notion загвар",
    description: "Хичээл, контент, ажлаа нэг самбараас төлөвлөх загварууд.",
  },
  {
    category: "Canva",
    icon: "photo",
    color: "#2B8C8C",
    title: "Canva загвар",
    description: "Сошиал пост, танилцуулга — өнгө, текстээ солиход бэлэн.",
  },
];

export function Categories({ counts }: { counts?: Record<TemplateCategory, number> }) {
  return (
    <section
      aria-labelledby="cat-title"
      className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,40px)] pt-2 pb-14 min-[900px]:pb-24"
    >
      <div className="ax-reveal flex flex-wrap items-end justify-between gap-4">
        <h2 id="cat-title" className="text-[clamp(28px,3.4vw,44px)] leading-[1.12] font-extrabold tracking-[-0.025em]">
          Ангиллаар <span className="serif">хайх</span>
        </h2>
        <p className="max-w-[26em] text-base leading-relaxed text-muted">
          Ямар программ ашигладаг вэ? Тэр ангиллаасаа эхлээрэй.
        </p>
      </div>

      <div className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
        {CATEGORIES.map((c) => (
          <Link
            key={c.category}
            href={`/templates?cat=${c.category}`}
            className="ax-card ax-reveal flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-6 text-ink no-underline"
          >
            <span className="flex items-center justify-between">
              <span
                aria-hidden="true"
                className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-[15px] text-xl font-extrabold text-white"
                style={{ background: c.color }}
              >
                <Icon name={c.icon} size={24} />
              </span>
              {counts && <span className="text-[13px] font-bold text-muted">{counts[c.category]} загвар</span>}
            </span>
            <span className="flex flex-col gap-1.5">
              <strong className="text-[21px] tracking-[-0.01em]">{c.title}</strong>
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
      </div>
    </section>
  );
}
