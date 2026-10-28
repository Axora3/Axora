/**
 * Live builder: the single typed state that drives the settings panel,
 * the scoped demo preview, and the pre-filled order form.
 */

export const BUSINESS_TYPES = ["cafe", "beauty", "shop", "portfolio"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const STYLE_IDS = ["minimal", "modern", "luxury", "colorful", "dark", "designer"] as const;
export type StyleId = (typeof STYLE_IDS)[number];

export const PALETTE_IDS = ["forest", "ocean", "terracotta", "lavender", "midnight", "mono"] as const;
export type PaletteId = (typeof PALETTE_IDS)[number] | "custom";

export type BuilderColors = { primary: string; secondary: string; bg: string };

export type BuilderConfig = {
  v: 1;
  type: BusinessType;
  style: StyleId;
  palette: PaletteId;
  colors: BuilderColors;
  name: string;
  headline: string;
  desc: string;
  cta: string;
  /** Which text fields the visitor typed; switching type keeps those. */
  edited: Partial<Record<"name" | "headline" | "desc" | "cta", true>>;
  /** True once the visitor changed anything; only then is it sent to /order. */
  touched: boolean;
};

export type Palette = { id: Exclude<PaletteId, "custom">; label: string } & BuilderColors;

export const PALETTES: Palette[] = [
  { id: "forest", label: "Forest", primary: "#2F5D46", secondary: "#E9E2CF", bg: "#FBF8F0" },
  { id: "ocean", label: "Ocean", primary: "#1F5F8B", secondary: "#DCE6EE", bg: "#F5F8FA" },
  { id: "terracotta", label: "Terracotta", primary: "#A9472E", secondary: "#EED9C2", bg: "#FBF4EB" },
  { id: "lavender", label: "Lavender", primary: "#6A4C9C", secondary: "#E7DFF4", bg: "#FAF8FD" },
  { id: "midnight", label: "Midnight", primary: "#D4AF4A", secondary: "#24314F", bg: "#121A2E" },
  { id: "mono", label: "Mono", primary: "#111111", secondary: "#EBEBEB", bg: "#FFFFFF" },
];

export type MenuItem = { n: string; d: string; p: string };

export type BusinessTypeDef = {
  label: string;
  sub: string;
  name: string;
  headline: string;
  desc: string;
  cta: string;
  cta2: string;
  badge: string;
  nav1: string;
  nav2: string;
  slug: string;
  /** Matching answer for order question 12 (вебийн төрөл). */
  orderType: string;
  menu: MenuItem[];
};

export const TYPES: Record<BusinessType, BusinessTypeDef> = {
  cafe: {
    label: "Кофе шоп / Ресторан",
    sub: "Меню, цаг, байршил",
    name: "Уул кофе",
    headline: "Өглөөг амттай эхлүүл.",
    desc: "Шинэхэн шарсан кофе, гар хийцийн нарийн боов.",
    cta: "Меню үзэх",
    cta2: "Байршил",
    badge: "Өнөөдөр нээлттэй",
    nav1: "Меню",
    nav2: "Байршил",
    slug: "uul-coffee",
    orderType: "Кафе / QR меню",
    menu: [
      { n: "Латте", d: "сүүтэй", p: "7,500₮" },
      { n: "Капучино", d: "хөөстэй", p: "7,000₮" },
      { n: "Американо", d: "хар", p: "6,000₮" },
      { n: "Круассан", d: "цөцгийн тос", p: "5,500₮" },
      { n: "Чизкейк", d: "зүсэм", p: "8,500₮" },
    ],
  },
  beauty: {
    label: "Гоо сайхан / Үйлчилгээ",
    sub: "Үйлчилгээ, цаг авах",
    name: "Gloss студи",
    headline: "Таны цаг, таны гоо сайхан.",
    desc: "Үс засалт, маникюр, арьс арчилгаа — урьдчилан цаг аваарай.",
    cta: "Цаг авах",
    cta2: "Үйлчилгээ",
    badge: "Онлайн цаг захиалга",
    nav1: "Үйлчилгээ",
    nav2: "Үнэ",
    slug: "gloss-studio",
    orderType: "Цаг захиалга",
    menu: [
      { n: "Үс засалт", d: "45 мин", p: "35,000₮" },
      { n: "Маникюр", d: "60 мин", p: "40,000₮" },
      { n: "Арьс арчилгаа", d: "75 мин", p: "60,000₮" },
      { n: "Хөмсөг засалт", d: "30 мин", p: "20,000₮" },
    ],
  },
  shop: {
    label: "Бүтээгдэхүүний дэлгүүр",
    sub: "Ангилал, бараа",
    name: "Ноос дэлгүүр",
    headline: "Монгол ноолуур, өдөр тутмын хэв маягаар.",
    desc: "Ноолууран цамц, ороолт, малгай — хүргэлттэй.",
    cta: "Дэлгүүр үзэх",
    cta2: "Шинэ бараа",
    badge: "Шинэ цуглуулга",
    nav1: "Дэлгүүр",
    nav2: "Хүргэлт",
    slug: "noos-shop",
    orderType: "Онлайн дэлгүүр",
    menu: [
      { n: "Ноолууран цамц", d: "", p: "189,000₮" },
      { n: "Ороолт", d: "", p: "79,000₮" },
      { n: "Малгай", d: "", p: "49,000₮" },
      { n: "Бээлий", d: "", p: "39,000₮" },
    ],
  },
  portfolio: {
    label: "Portfolio",
    sub: "Ажлууд, танилцуулга",
    name: "Таны Нэр",
    headline: "Брэнд ба веб дизайнер.",
    desc: "Жижиг бизнесүүдэд ойлгомжтой, дурсамжтай брэнд бүтээдэг.",
    cta: "Ажлуудыг үзэх",
    cta2: "Холбогдох",
    badge: "Шинэ төсөлд нээлттэй",
    nav1: "Ажлууд",
    nav2: "Танилцуулга",
    slug: "tanai-ner",
    orderType: "Portfolio",
    menu: [
      { n: "Кофе шопын брэнд", d: "Лого, сав баглаа боодол", p: "" },
      { n: "Гоо сайхны салоны веб", d: "Веб дизайн", p: "" },
      { n: "Дэлгүүрийн каталог", d: "Хэвлэл", p: "" },
    ],
  },
};

export type StyleDef = {
  label: string;
  /** Matching answer for order question 19 (дизайны хэв маяг). */
  orderStyle: string;
  fh: string;
  hw: number;
  hst: "normal" | "italic";
  hs: string;
  ht: string;
  r: string;
  br: string;
  brs: string;
  bw: string;
  bw2: string;
  px: string;
  py: string;
  shadow: string;
};

export const STYLES: Record<StyleId, StyleDef> = {
  minimal: { label: "Minimal", orderStyle: "Minimal", fh: "var(--font-manrope), system-ui, sans-serif", hw: 600, hst: "normal", hs: "56px", ht: "-0.035em", r: "4px", br: "4px", brs: "4px", bw: "1px", bw2: "1px", px: "44px", py: "80px", shadow: "none" },
  modern: { label: "Modern", orderStyle: "Modern", fh: "var(--font-onest), var(--font-manrope), system-ui, sans-serif", hw: 800, hst: "normal", hs: "58px", ht: "-0.04em", r: "20px", br: "999px", brs: "10px", bw: "0px", bw2: "1px", px: "36px", py: "64px", shadow: "0 14px 30px -20px rgba(0,0,0,.35)" },
  luxury: { label: "Luxury", orderStyle: "Luxury", fh: "var(--font-cormorant), var(--font-lora), Georgia, serif", hw: 500, hst: "normal", hs: "68px", ht: "0", r: "0px", br: "0px", brs: "0px", bw: "1px", bw2: "1px", px: "56px", py: "88px", shadow: "none" },
  colorful: { label: "Colorful", orderStyle: "Colorful", fh: "var(--font-rubik), var(--font-manrope), system-ui, sans-serif", hw: 700, hst: "normal", hs: "56px", ht: "-0.02em", r: "22px", br: "14px", brs: "10px", bw: "2px", bw2: "2px", px: "32px", py: "56px", shadow: "none" },
  dark: { label: "Dark", orderStyle: "Dark", fh: "var(--font-manrope), system-ui, sans-serif", hw: 800, hst: "normal", hs: "58px", ht: "-0.035em", r: "14px", br: "10px", brs: "8px", bw: "1px", bw2: "1px", px: "40px", py: "72px", shadow: "none" },
  designer: { label: "Дизайнерт даатгах", orderStyle: "Дизайнерт даатгах", fh: "var(--font-lora), Georgia, serif", hw: 500, hst: "italic", hs: "60px", ht: "-0.02em", r: "16px", br: "10px", brs: "8px", bw: "1px", bw2: "1px", px: "40px", py: "72px", shadow: "0 10px 24px -18px rgba(0,0,0,.3)" },
};

export function defaultBuilderConfig(type: BusinessType = "cafe"): BuilderConfig {
  const t = TYPES[type];
  const p = PALETTES[0];
  return {
    v: 1,
    type,
    style: "modern",
    palette: p.id,
    colors: { primary: p.primary, secondary: p.secondary, bg: p.bg },
    name: t.name,
    headline: t.headline,
    desc: t.desc,
    cta: t.cta,
    edited: {},
    touched: false,
  };
}

export function paletteLabel(cfg: Pick<BuilderConfig, "palette">): string {
  if (cfg.palette === "custom") return "Өөрийн өнгө";
  return PALETTES.find((p) => p.id === cfg.palette)?.label ?? "Өөрийн өнгө";
}

/** Light runtime check for a config read back from sessionStorage. */
export function parseBuilderConfig(raw: unknown): BuilderConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  if (!BUSINESS_TYPES.includes(o.type as BusinessType)) return null;
  if (!STYLE_IDS.includes(o.style as StyleId)) return null;
  const c = o.colors as Record<string, unknown> | undefined;
  if (!c || !normalizeHex(String(c.primary)) || !normalizeHex(String(c.secondary)) || !normalizeHex(String(c.bg))) return null;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const pal = o.palette as PaletteId;
  return {
    v: 1,
    type: o.type as BusinessType,
    style: o.style as StyleId,
    palette: pal === "custom" || PALETTE_IDS.includes(pal as (typeof PALETTE_IDS)[number]) ? pal : "custom",
    colors: { primary: normalizeHex(String(c.primary))!, secondary: normalizeHex(String(c.secondary))!, bg: normalizeHex(String(c.bg))! },
    name: str(o.name, 40),
    headline: str(o.headline, 70),
    desc: str(o.desc, 160),
    cta: str(o.cta, 24),
    edited: typeof o.edited === "object" && o.edited ? (o.edited as BuilderConfig["edited"]) : {},
    touched: o.touched === true,
  };
}

/* ---------- Colour helpers ---------- */

export function normalizeHex(v: string | null | undefined): string | null {
  let h = (v ?? "").trim();
  if (!h) return null;
  if (h[0] !== "#") h = "#" + h;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(h)) return null;
  if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  return h.toUpperCase();
}

function rgb(h: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16)) as [number, number, number];
}

export function luminance(h: string): number {
  const c = rgb(h).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrast(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function mix(a: string, b: string, t: number): string {
  const A = rgb(a);
  const B = rgb(b);
  return (
    "#" +
    A.map((v, i) => {
      const n = Math.round(v + (B[i] - v) * t);
      return ("0" + n.toString(16)).slice(-2);
    })
      .join("")
      .toUpperCase()
  );
}

/** Readable foreground (white or near-black) for a background colour. */
export function readableOn(bg: string): string {
  return contrast(bg, "#FFFFFF") >= contrast(bg, "#141414") ? "#FFFFFF" : "#141414";
}

export type DemoTheme = {
  vars: Record<string, string>;
  warnings: string[];
};

/**
 * Turns the visitor's three colours + style into the full set of scoped
 * CSS variables used inside the preview. Keeps text and buttons readable
 * even when the chosen colours clash.
 */
export function buildDemoTheme(cfg: BuilderConfig): DemoTheme {
  const st = STYLES[cfg.style];
  const { primary, secondary } = cfg.colors;
  let bg = cfg.colors.bg;
  if (cfg.style === "dark" && luminance(bg) > 0.2) bg = mix(primary, "#0B0F0D", 0.86);
  const darkBg = luminance(bg) < 0.2;
  const text = darkBg ? "#EEF0EC" : mix(primary, "#111614", 0.82);
  const muted = mix(text, bg, 0.32);
  const line = mix(text, bg, 0.84);
  let primaryEff = primary;
  if (contrast(primary, bg) < 2.2) primaryEff = darkBg ? mix(primary, "#FFFFFF", 0.5) : mix(primary, "#000000", 0.45);
  let sec = secondary;
  if (darkBg && luminance(sec) > 0.5) sec = mix(secondary, bg, 0.78);
  const alt = cfg.style === "colorful" ? sec : mix(sec, bg, 0.55);
  const card = darkBg ? mix(bg, "#FFFFFF", 0.05) : cfg.style === "modern" || cfg.style === "designer" ? "#FFFFFF" : bg;
  const onP = readableOn(primaryEff);
  const sOn = readableOn(sec);

  const warnings: string[] = [];
  const cpb = contrast(primary, bg);
  if (cpb < 3)
    warnings.push(
      `Үндсэн өнгө суурь дээр сул ялгарч байна (${cpb.toFixed(1)}:1). Preview дээр автоматаар тодруулсан — илүү бараан эсвэл цайвар өнгө сонговол зүгээр.`,
    );
  const cto = contrast(primaryEff, onP);
  if (cto < 4.5) warnings.push(`Товчны текст уншигдахад хүнд байна (${cto.toFixed(1)}:1).`);

  return {
    warnings,
    vars: {
      "--bg": bg,
      "--text": text,
      "--muted": muted,
      "--line": cfg.style === "colorful" ? text : line,
      "--p": primaryEff,
      "--on": onP,
      "--s": sec,
      "--sOn": sOn,
      "--alt": alt,
      "--card": card,
      "--fb": "var(--font-manrope), system-ui, sans-serif",
      "--fh": st.fh,
      "--hw": String(st.hw),
      "--hst": st.hst,
      "--hs": st.hs,
      "--ht": st.ht,
      "--r": st.r,
      "--br": st.br,
      "--br-s": st.brs,
      "--bw": st.bw,
      "--bw2": st.bw2,
      "--px": st.px,
      "--py": st.py,
      "--shadow": st.shadow,
    },
  };
}
