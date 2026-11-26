import Link from "next/link";
import {
  ArrowUpRight,
  Columns2,
  FileText,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import type { TemplateCategory } from "@/lib/templates/types";
import { PaletteDemo } from "./PaletteDemo";
import { ChecklistPreview, SpreadsheetPreview } from "./ProductPreviews";

function CanvaVisual() {
  return (
    <div className="fg-canva-preview" aria-hidden="true">
      <div>
        <span>Нарс / Студи</span>
        <strong>
          Санааг
          <br />
          дүрстэй
          <br />
          болгоё.
        </strong>
        <span>Брэнд & дизайн →</span>
      </div>
      <div>
        <span>
          Өөрийн
          <br />
          өнгийг ол.
        </span>
        <i />
        <span>Таны дараагийн санаанд</span>
      </div>
    </div>
  );
}

export function FeatureBento({
  counts,
}: {
  counts?: Record<TemplateCategory, number>;
}) {
  return (
    <section
      aria-labelledby="cat-title"
      className="ax-container ax-section fg-showcase"
    >
      <div className="fg-showcase-heading">
        <div>
          <span className="fg-section-index">AXORA / Дижитал хэрэгслүүд</span>
          <h2 id="cat-title">
            Бүтээх бүх зүйл
            <br />
            <span>нэг дор.</span>
          </h2>
        </div>
        <p>
          Загвараа сонго. Өнгөө турш.
          <br />
          Өөрийн ажлыг өөрийнхөөрөө бүтээ.
        </p>
      </div>
      <div className="fg-showcase-grid">
        <PaletteDemo />
        <Link
          href="/templates?cat=Excel"
          className="fg-product fg-product-excel"
        >
          <div className="fg-product-top">
            <span>02 / Хүснэгт</span>
            {!!counts?.Excel && <span>{counts.Excel} загвар</span>}
          </div>
          <div className="fg-product-visual">
            <SpreadsheetPreview compact />
          </div>
          <div className="fg-product-copy">
            <h3>
              Тоо бүрийн цаана
              <br />
              тодорхой төлөвлөгөө.
            </h3>
            <p>
              Төсөв, борлуулалт, бүртгэлийн автомат тооцоотой Excel загварууд.
            </p>
            <span className="fg-product-link">
              Excel загварууд <ArrowUpRight size={16} />
            </span>
          </div>
        </Link>
        <Link
          href="/templates?cat=Notion"
          className="fg-product fg-product-notion"
        >
          <div className="fg-product-top">
            <span>03 / Төлөвлөлт</span>
            {!!counts?.Notion && <span>{counts.Notion} загвар</span>}
          </div>
          <div className="fg-product-visual">
            <ChecklistPreview compact />
          </div>
          <div className="fg-product-copy">
            <h3>
              Ажлаа нэг дор.
              <br />
              Бодлоо цэгцтэй.
            </h3>
            <p>
              Хичээл, контент, ажлаа нэг самбараас төлөвлөх Notion загварууд.
            </p>
            <span className="fg-product-link">
              Notion загварууд <ArrowUpRight size={16} />
            </span>
          </div>
        </Link>
        <Link
          href="/templates?cat=Canva"
          className="fg-product fg-product-canva"
        >
          <div className="fg-product-top">
            <span>04 / Дизайн</span>
            {!!counts?.Canva && <span>{counts.Canva} загвар</span>}
          </div>
          <CanvaVisual />
          <div className="fg-product-copy">
            <h3>
              Таны өнгө.
              <br />
              Таны дараагийн пост.
            </h3>
            <p>
              Өнгө, текстээ солиход бэлэн сошиал пост, танилцуулгын Canva
              загварууд.
            </p>
            <span className="fg-product-link">
              Canva загварууд <ArrowUpRight size={16} />
            </span>
          </div>
        </Link>
        <Link href="/builder" className="fg-builder-link">
          <span className="fg-section-index">05 / Website Builder</span>
          <div className="fg-builder-devices" aria-hidden="true">
            <Monitor />
            <Tablet />
            <Smartphone />
          </div>
          <h3>
            Дэлгэц бүрд
            <br />
            таны веб.
          </h3>
          <p>
            Desktop, tablet, гар утсан дээр хэрхэн харагдахыг шууд шалгаарай.
          </p>
          <span className="fg-product-link">
            Вебээ бүтээх <ArrowUpRight size={16} />
          </span>
        </Link>
      </div>
      <div className="fg-utility-links">
        <Link href="/compare">
          <Columns2 size={20} />
          <span>
            <strong>Хадгалаад, харьцуулаад шийд</strong>
            <span>
              Таалагдсан загвараа хадгалж, 3 хүртэлхийг зэрэгцүүлэн харьцуулна.
            </span>
          </span>
          <ArrowUpRight size={18} />
        </Link>
        <Link href="/order">
          <FileText size={20} />
          <span>
            <strong>Хэрэгцээгээ бидэнд илгээ</strong>
            <span>Анкетаа бөглөж, илгээхээсээ өмнө хариултаа шалгаарай.</span>
          </span>
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}
