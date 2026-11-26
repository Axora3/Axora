import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import {
  BrowserChrome,
  SpreadsheetPreview,
  ChecklistPreview,
} from "./ProductPreviews";
import "./foreground.css";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { TextReveal } from "@/components/ui/text-reveal";
import type { SiteContent } from "@/lib/content/schema";
import { HeroStage } from "./HeroStage";
import { AxoraGlass } from "@/components/glass/AxoraGlass";

const FORMATS: [IconName, string][] = [
  ["table", "Excel"],
  ["file-text", "Notion"],
  ["photo", "Canva"],
  ["monitor", "Захиалгат веб"],
];

function WebsiteMock() {
  return (
    <div className="ax-stage-main fg-coffee-window">
      <BrowserChrome address="uul-coffee.mn" />
      <div className="fg-coffee-page">
        <div className="fg-coffee-nav">
          <span>
            Уул<span className="fg-coffee-wordmark">кофе</span>
          </span>
          <span>
            Меню <span>Байршил</span>
          </span>
        </div>
        <div className="fg-coffee-content">
          <div className="fg-coffee-copy">
            <span className="fg-coffee-hours">Өдөр бүр · 08:00–22:00</span>
            <h2>
              Өглөөг
              <br />
              амттай эхлүүл.
            </h2>
            <p>
              Шинэхэн шарсан кофе,
              <br />
              гар хийцийн нарийн боов.
            </p>
            <Link href="/builder" className="fg-coffee-cta">
              Меню үзэх <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="fg-coffee-image">
            <Image
              src="/images/home/uul-coffee.webp"
              alt="Сүүн хээтэй латте, шинэхэн круассан"
              loading="eager"
              fill
              sizes="(max-width: 699px) 45vw, 280px"
            />
            <span>Уул кофе / Өглөөний сонголт</span>
          </div>
        </div>
        <div className="fg-coffee-menu">
          {[
            ["01", "Латте", "7,500₮"],
            ["02", "Американо", "6,000₮"],
            ["03", "Круассан", "5,500₮"],
          ].map(([n, title, price]) => (
            <div key={n}>
              <span>{n}</span>
              <span>{title}</span>
              <span>{price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExcelMock() {
  return (
    <div className="ax-stage-left fg-floating-sheet">
      <SpreadsheetPreview />
    </div>
  );
}
function NotionMock() {
  return (
    <div className="ax-stage-right fg-floating-checklist">
      <ChecklistPreview />
    </div>
  );
}

/** Full-bleed dark hero. The product stage bleeds into the next section, which leaves room for it with top padding. */
export function HomeHero({ c }: { c: SiteContent }) {
  return (
    <section aria-labelledby="hero-title" className="ax-band-hero ax-home-hero">
      <div aria-hidden="true" className="ax-band-hero-bg ax-grid-dark" />
      <div aria-hidden="true" className="ax-aurora" />
      <div
        className="ax-container flex flex-col items-center pt-[clamp(40px,6vw,88px)] text-center"
        style={{ position: "relative", zIndex: 1 }}
      >
        <span className="ax-pill-band ax-in fg-hero-kicker">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-lime"
          />
          Монгол дижитал бүтээгдэхүүний платформ
        </span>
        <h1 id="hero-title" className="ax-display mt-5 max-w-[14em]">
          <TextReveal text={c.heroTitle} />
          {c.heroAccent && (
            <TextReveal
              text={c.heroAccent}
              start={c.heroTitle.split(/\s+/).length}
              className="serif block text-lime"
            />
          )}
        </h1>
        <p className="ax-in d3 mt-[clamp(20px,2.4vw,32px)] max-w-[36em] text-[clamp(17px,1.5vw,20px)] leading-relaxed text-band-muted">
          {c.heroLead}
        </p>
        <div className="ax-in d4 mt-7 flex flex-wrap justify-center gap-3 max-[480px]:w-full">
          <Link
            href={c.heroPrimary.href}
            className={buttonStyles("lime", "ax-btn ax-optical-host ax-hero-optical-cta relative max-[480px]:w-full", "lg")}
          >
            <AxoraGlass preset="control" />
            {c.heroPrimary.label}
            <span className="ax-arrow">
              <ArrowRight />
            </span>
          </Link>
          <Link
            href={c.heroSecondary.href}
            className="ax-button ax-button-lg ax-btn border-band-ring bg-transparent text-on-band hover:bg-band-hover max-[480px]:w-full"
          >
            {c.heroSecondary.label}
          </Link>
        </div>
        <ul
          aria-label="Загварын төрлүүд"
          className="ax-in d5 m-0 mt-6 flex list-none flex-wrap justify-center gap-x-5 gap-y-2 p-0 text-[13px] font-bold text-band-muted"
        >
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
