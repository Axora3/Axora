import Link from "next/link";
import { AxoraLiquidLogo } from "./AxoraLiquidLogo";
import { ShaderGradient } from "@/components/shaders/ShaderGradient";

export function BrandIntroduction() {
  return (
    <section
      className="ax-container ax-studio-section"
      aria-labelledby="studio-title"
    >
      <div className="ax-studio-copy">
        <p className="ax-studio-eyebrow">AXORA / Дижитал студи</p>
        <h2 id="studio-title">
          Таны санаа.
          <br />
          <span>Ажиллах шийдэл.</span>
        </h2>
        <p>
          Бэлэн загвараас захиалгат веб хүртэл. Бизнесийн тань өдөр тутмын ажлыг
          хялбарчлах дижитал бүтээгдэхүүн бүтээнэ.
        </p>
        <Link href="/order" className="ax-studio-link">
          Төслөө ярилцъя
        </Link>
      </div>
      <ShaderGradient>
        <AxoraLiquidLogo />
        <span className="ax-material-caption">
          AXORA · Aperture / Материалын судалгаа
        </span>
      </ShaderGradient>
    </section>
  );
}
