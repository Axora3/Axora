"use client";

import { MenuShort } from "@/components/icons";
import { TYPES, buildDemoTheme, type BuilderConfig } from "@/lib/builder/config";
import "./demo.css";

/**
 * The sample website. Colours, fonts, radii and spacing come only from the
 * CSS variables set on .dm — scoped to this element.
 */
export function DemoPreview({ config, logo, animKey }: { config: BuilderConfig; logo: { url: string; name: string } | null; animKey: number }) {
  const t = TYPES[config.type];
  const { vars } = buildDemoTheme(config);
  const name = config.name.trim() || t.name;
  const cta = config.cta.trim() || "Дэлгэрэнгүй";

  return (
    <div className={`dm dm-s-${config.style}`} style={vars as React.CSSProperties}>
      <nav className="dm-nav" aria-label="Жишээ вебийн цэс">
        <span className="dm-brand">
          <span className="dm-logo">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimisable asset
              <img src={logo.url} alt="Лого" />
            ) : (
              (name[0] || "A").toUpperCase()
            )}
          </span>
          <span className="dm-brand-name">{name}</span>
        </span>
        <span className="dm-links">
          <span className="on">Нүүр</span>
          <span>{t.nav1}</span>
          <span>{t.nav2}</span>
          <span>Холбоо барих</span>
        </span>
        <span className="dm-menu" aria-hidden="true">
          <MenuShort size={18} />
        </span>
      </nav>

      <div key={animKey} className="dm-anim">
        <div className="dm-hero">
          <div className="dm-copy">
            <span className="dm-badge">{t.badge}</span>
            <span className="dm-h1">{config.headline || " "}</span>
            <span className="dm-lead">{config.desc}</span>
            <span className="dm-ctas">
              <span className="dm-btn">{cta}</span>
              <span className="dm-btn2">{t.cta2}</span>
            </span>
          </div>
          <div className="dm-media" aria-hidden="true">
            <span className="dm-shape2" />
            <span className="dm-shape1" />
            <span className="dm-shape3" />
          </div>
        </div>

        {config.type === "cafe" && (
          <div className="dm-sec alt">
            <span className="dm-h2">Меню</span>
            <div className="dm-split">
              <div>
                {t.menu.map((it) => (
                  <div key={it.n} className="dm-row">
                    <span>
                      <strong>{it.n}</strong> <span className="dm-muted">· {it.d}</span>
                    </span>
                    <span className="dm-price">{it.p}</span>
                  </div>
                ))}
              </div>
              <div className="dm-panel">
                <strong style={{ fontSize: 15 }}>Ажиллах цаг</strong>
                <span style={{ fontSize: 14 }}>Даваа–Баасан · 08:00–22:00</span>
                <span style={{ fontSize: 14 }}>Бямба–Ням · 09:00–21:00</span>
                <span style={{ fontSize: 13, opacity: 0.85 }}>[Хаяг, байршил]</span>
              </div>
            </div>
          </div>
        )}

        {config.type === "beauty" && (
          <div className="dm-sec alt">
            <span className="dm-h2">Үйлчилгээ</span>
            <div className="dm-split">
              <div>
                {t.menu.map((it) => (
                  <div key={it.n} className="dm-row">
                    <span>
                      <strong>{it.n}</strong> <span className="dm-muted">· {it.d}</span>
                    </span>
                    <span className="dm-price">{it.p}</span>
                  </div>
                ))}
              </div>
              <div className="dm-card">
                <strong style={{ fontSize: 15 }}>Цаг авах</strong>
                <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span className="dm-chip">Мя 14</span>
                  <span className="dm-chip on">Лх 15</span>
                  <span className="dm-chip">Пү 16</span>
                </span>
                <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span className="dm-chip">10:00</span>
                  <span className="dm-chip">13:30</span>
                  <span className="dm-chip on">16:00</span>
                </span>
                <span className="dm-btn" style={{ justifyContent: "center" }}>
                  {cta}
                </span>
              </div>
            </div>
          </div>
        )}

        {config.type === "shop" && (
          <div className="dm-sec">
            <span className="dm-h2">Бүтээгдэхүүн</span>
            <span style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span className="dm-chip on">Бүгд</span>
              <span className="dm-chip">Цамц</span>
              <span className="dm-chip">Ороолт</span>
              <span className="dm-chip">Малгай</span>
            </span>
            <div className="dm-grid4">
              {t.menu.map((it) => (
                <div key={it.n} className="dm-card">
                  <span className="dm-thumb" />
                  <strong style={{ fontSize: 14 }}>{it.n}</strong>
                  <span className="dm-price">{it.p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {config.type === "portfolio" && (
          <>
            <div className="dm-sec">
              <span className="dm-h2">Ажлууд</span>
              <div className="dm-grid">
                {t.menu.map((it) => (
                  <div key={it.n} className="dm-card">
                    <span className="dm-thumb" />
                    <strong style={{ fontSize: 15 }}>{it.n}</strong>
                    <span className="dm-muted">{it.d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="dm-sec alt">
              <span className="dm-h2">Танилцуулга</span>
              <span className="dm-lead" style={{ maxWidth: "40em" }}>
                Жижиг бизнес, хувь хүмүүст ойлгомжтой, тогтвортой брэнд бүтээдэг. Төсөл бүрийг судалгаанаас эхэлнэ.
              </span>
              <span style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span className="dm-chip">Брэнд</span>
                <span className="dm-chip">Веб дизайн</span>
                <span className="dm-chip">Хэвлэл</span>
              </span>
            </div>
          </>
        )}

        <div className="dm-foot">
          <span>© {name}</span>
          <span>[Утас] · [Имэйл]</span>
        </div>
      </div>
    </div>
  );
}
