import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { TextReveal } from "@/components/ui/text-reveal";
import type { SiteContent } from "@/lib/content/schema";
import { HeroStage } from "./HeroStage";

const FORMATS: [IconName, string][] = [
  ["table", "Excel"],
  ["file-text", "Notion"],
  ["photo", "Canva"],
  ["monitor", "Захиалгат веб"],
];

function WebsiteMock() {
  return (
    <div className="ax-stage-main ax-in d3 overflow-hidden rounded-card border border-line bg-surface shadow-raised">
      <div className="flex h-10 items-center gap-2 border-b border-line bg-soft-2 px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-[#E1A28F]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E8CF84]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#9CC59B]" />
        <span className="ml-3 flex h-6 max-w-[260px] flex-1 items-center rounded-[7px] border border-line bg-surface px-2.5 text-xs text-muted">uul-coffee.mn</span>
      </div>
      <div className="bg-[#FBF7EF] p-[clamp(16px,2.4vw,28px)]">
        <div className="flex items-center justify-between text-xs text-[#3B2A20]">
          <span className="text-sm font-extrabold tracking-[0.04em]">Уул кофе</span>
          <span className="flex gap-3.5 font-semibold">
            <span>Меню</span>
            <span className="max-[420px]:hidden">Байршил</span>
            <span>Захиалга</span>
          </span>
        </div>
        <div className="mt-[18px] grid grid-cols-[1.15fr_1fr] items-center gap-[18px]">
          <div className="flex flex-col gap-2.5">
            <span className="self-start rounded-md bg-[#F1DFC8] px-2 py-1 text-[10px] font-extrabold tracking-[0.08em] text-[#8A4B2E] uppercase">08:00–22:00</span>
            <span className="text-[clamp(20px,3vw,40px)] leading-[1.06] font-extrabold tracking-[-0.025em] text-[#2B1A12]">Өглөөг амттай эхлүүл.</span>
            <span className="text-xs leading-normal text-[#6B5648]">Шинэхэн шарсан кофе, гар хийцийн нарийн боов.</span>
            <span className="mt-1 self-start rounded-lg bg-[#8A4B2E] px-3.5 py-[9px] text-xs font-bold text-white">Меню үзэх</span>
          </div>
          <div className="relative flex aspect-[1/0.86] items-center justify-center overflow-hidden rounded-2xl bg-[#E9D3B5]">
            <div className="flex aspect-square w-[62%] items-center justify-center rounded-full bg-[#F7EEE2] shadow-[0_14px_30px_-14px_rgba(59,42,32,.5)]">
              <div className="flex aspect-square w-[70%] items-center justify-center rounded-full bg-[#6B3E25]">
                <div className="aspect-square w-[58%] bg-[#C89A6A] opacity-85" style={{ borderRadius: "50% 50% 46% 54%" }} />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-[18px] grid grid-cols-3 gap-2.5">
          {[
            ["Латте", "7,500₮"],
            ["Американо", "6,000₮"],
            ["Круассан", "5,500₮"],
          ].map(([n, p]) => (
            <div key={n} className="flex flex-col gap-0.5 rounded-[10px] border border-[#EADFCF] bg-white p-2.5">
              <span className="truncate text-xs font-bold text-[#2B1A12]">{n}</span>
              <span className="text-[11px] font-bold text-[#8A4B2E]">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExcelMock() {
  return (
    <div className="ax-stage-left ax-in d5 min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-raised">
      <div className="flex items-center gap-2 bg-[#2F7A4D] px-3 py-2.5 text-xs font-bold text-white">
        <Icon name="table" size={15} />
        <span className="truncate">Сарын төсөв.xlsx</span>
      </div>
      <div className="flex flex-col gap-2.5 px-3 pt-2.5 pb-3">
        <div className="grid grid-cols-[1.1fr_1fr] overflow-hidden rounded-md border border-line-soft text-[10.5px]">
          {["Ангилал", "Бодит"].map((h) => (
            <span key={h} className="bg-soft-2 px-1.5 py-[5px] font-extrabold">{h}</span>
          ))}
          {[["Хоол", "362,500"], ["Унаа", "98,000"], ["Түрээс", "650,000"]].map(([a, b]) => (
            <span key={a} className="contents">
              <span className="border-t border-line-soft px-1.5 py-[5px]">{a}</span>
              <span className="border-t border-line-soft px-1.5 py-[5px] font-bold text-brand">{b}</span>
            </span>
          ))}
        </div>
        <div className="flex h-[54px] items-end gap-1.5 border-b border-line px-0.5">
          {[[62, "#BFD7C6", "d4"], [80, "#BFD7C6", "d5"], [48, "#BFD7C6", "d5"], [92, "#245C45", "d6"], [70, "#BFD7C6", "d6"], [56, "#D9F279", "d7"]].map(([h, c, d], i) => (
            <span key={i} className={`ax-bar ${d} flex-1 rounded-t-[3px]`} style={{ height: `${h}%`, background: String(c) }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotionMock() {
  return (
    <div className="ax-stage-right ax-in d6 flex min-w-0 flex-col gap-2.5 rounded-2xl border border-line bg-surface p-3.5 shadow-raised">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-band text-white"><Icon name="file-text" size={15} /></span>
        <span className="truncate text-[13px] font-extrabold">Хичээлийн төлөвлөгөө</span>
      </div>
      <div className="flex flex-col gap-[7px] text-xs">
        {["Математик — бие даалт 3", "Англи хэл — эссе"].map((t) => (
          <div key={t} className="flex items-center gap-2">
            <span className="inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded bg-primary text-on-primary">
              <Check size={11} strokeWidth={3.2} />
            </span>
            <span className="truncate text-muted line-through">{t}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="h-[15px] w-[15px] shrink-0 rounded border-[1.5px] border-line-dashed" />
          <span className="truncate font-semibold">Програмчлал — лаб 5</span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-md bg-soft">
        <div className="ax-fill h-full w-[67%] rounded-md bg-primary" />
      </div>
    </div>
  );
}

/** Full-bleed dark hero. The product stage bleeds into the next section, which leaves room for it with top padding. */
export function HomeHero({ c }: { c: SiteContent }) {
  return (
    <section aria-labelledby="hero-title" className="ax-band-hero">
      <div aria-hidden="true" className="ax-band-hero-bg ax-grid-dark" />
      <div aria-hidden="true" className="ax-aurora" />
      <div className="ax-container flex flex-col items-center pt-[clamp(40px,6vw,88px)] text-center">
        <span className="ax-pill-band ax-in">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-lime" />
          Монгол дижитал бүтээгдэхүүний платформ
        </span>
        <h1 id="hero-title" className="ax-display mt-5 max-w-[14em]">
          <TextReveal text={c.heroTitle} />
          {c.heroAccent && <TextReveal text={c.heroAccent} start={c.heroTitle.split(/\s+/).length} className="serif block text-lime" />}
        </h1>
        <p className="ax-in d3 mt-[clamp(20px,2.4vw,32px)] max-w-[36em] text-[clamp(17px,1.5vw,20px)] leading-relaxed text-band-muted">{c.heroLead}</p>
        <div className="ax-in d4 mt-7 flex flex-wrap justify-center gap-3 max-[480px]:w-full">
          <Link href={c.heroPrimary.href} className={buttonStyles("lime", "ax-btn max-[480px]:w-full", "lg")}>
            {c.heroPrimary.label}
            <span className="ax-arrow"><ArrowRight /></span>
          </Link>
          <Link href={c.heroSecondary.href} className="ax-button ax-button-lg ax-btn border-band-ring bg-transparent text-on-band hover:bg-band-hover max-[480px]:w-full">
            {c.heroSecondary.label}
          </Link>
        </div>
        <ul aria-label="Загварын төрлүүд" className="ax-in d5 m-0 mt-6 flex list-none flex-wrap justify-center gap-x-5 gap-y-2 p-0 text-[13px] font-bold text-band-muted">
          {FORMATS.map(([icon, label]) => (
            <li key={label} className="inline-flex items-center gap-2">
              <Icon name={icon} size={16} className="text-lime" />
              {label}
            </li>
          ))}
        </ul>
        <div className="ax-stage-glow mt-[clamp(36px,5vw,64px)] -mb-[clamp(60px,8vw,120px)] w-full text-left">
          <HeroStage>
            <WebsiteMock />
            <ExcelMock />
            <NotionMock />
          </HeroStage>
        </div>
      </div>
    </section>
  );
}