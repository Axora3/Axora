"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Monitor, Smartphone, Tablet } from "lucide-react";
import { useBuilder } from "@/components/builder/BuilderProvider";
import { PALETTES, luminance, mix } from "@/lib/builder/config";
import { BrowserChrome } from "./ProductPreviews";

/** Palette choices stay in the shared builder state; device sizing is local to this preview. */
export function PaletteDemo() {
  const { config, setPalette } = useBuilder();
  const [device, setDevice] = useState("desktop");
  const cur = PALETTES.find((p) => p.id === config.palette);
  const { primary, bg, secondary } = config.colors;
  const dark = luminance(bg) < 0.2;
  const text = dark ? "#EEF0F6" : mix(primary, "#111614", 0.82);
  const vars = {
    "--d-bg": bg,
    "--d-text": text,
    "--d-muted": mix(text, bg, 0.24),
    "--d-p": primary,
    "--d-on": luminance(primary) > 0.35 ? "#17251E" : "#FFFFFF",
    "--d-s": secondary,
    "--d-line": mix(text, bg, 0.84),
  } as React.CSSProperties;
  return (
    <div aria-labelledby="demo-title" role="group" className="fg-live-demo">
      <div className="fg-demo-heading">
        <div>
          <span className="fg-section-index">01 / Интерактив веб</span>
          <h3 id="demo-title">
            Өнгө өөрчлөгдөнө.
            <br />
            <span>Таны хэв маяг үлдэнэ.</span>
          </h3>
        </div>
        <span className="fg-demo-indicator">Шууд турших</span>
      </div>
      <div
        role="group"
        aria-label="Өнгөний palette"
        className="fg-palette-controls"
      >
        {PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={config.palette === p.id}
            onClick={() => setPalette(p.id)}
          >
            <span
              className="fg-palette-swatch"
              aria-hidden="true"
              style={{ background: p.primary }}
            >
              <i style={{ background: p.secondary }} />
            </span>
            <span>{p.label}</span>
            {config.palette === p.id && <Check size={12} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="fg-demo-canvas" data-device={device}>
        <div className="fg-demo-window ax-light" style={vars}>
          <BrowserChrome
            address={`nars.studio / ${cur?.label ?? "Өөрийн өнгө"}`}
          />
          <div
            className="fg-demo-site"
            aria-label={`${cur?.label ?? "Өөрийн өнгө"} өнгийн веб жишээ`}
          >
            <div className="fg-demo-site-nav">
              <span>
                <i />
                Нарс студи
              </span>
              <span>Дизайн & веб</span>
            </div>
            <div className="fg-demo-site-main">
              <div>
                <span className="fg-demo-site-kicker">
                  Таны санаанаас эхэлнэ
                </span>
                <h4>
                  Таны бизнес,
                  <br />
                  таны өнгө.
                </h4>
                <p>
                  Үйлчилгээгээ танилцуулж,
                  <br />
                  захиалгаа онлайнаар аваарай.
                </p>
                <span className="fg-demo-site-actions">
                  <span>
                    Цаг авах <ArrowUpRight size={12} />
                  </span>
                  <span>Үйлчилгээ үзэх</span>
                </span>
              </div>
              <div className="fg-demo-art" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>Н / С</span>
              </div>
            </div>
            <div className="fg-demo-services">
              {["Брэнд дизайн", "Вебсайт", "Контент"].map((label, i) => (
                <div key={label}>
                  <span>0{i + 1}</span>
                  <span>{label}</span>
                  <ArrowUpRight size={12} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="fg-demo-footer">
        <div
          className="fg-device-controls"
          role="group"
          aria-label="Дэлгэцийн хэмжээ"
        >
          {[
            { id: "desktop", label: "Desktop", Icon: Monitor },
            { id: "tablet", label: "Tablet", Icon: Tablet },
            { id: "mobile", label: "Mobile", Icon: Smartphone },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={device === id}
              onClick={() => setDevice(id)}
              title={label}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
        <Link href="/builder">
          Бүрэн турших <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}
