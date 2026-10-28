/**
 * The 39-question website order form, split into 7 steps.
 * This file is shared by the browser form and the server endpoint so both
 * apply exactly the same required / conditional rules.
 */

export type AnswerValue = string | string[] | boolean;
export type Answers = Record<string, AnswerValue | undefined>;

export type FieldKind = "input" | "textarea" | "radio" | "multi" | "color" | "file" | "consent" | "toggle" | "note" | "builder";
export type InputType = "text" | "email" | "tel" | "url";

export type Cond = "hasSite" | "booking" | "domain" | "domainHelp" | "contactExtra" | "contactInfo";

export type Field = {
  id: string;
  n?: number | string;
  label: string;
  kind: FieldKind;
  req?: boolean;
  type?: InputType;
  auto?: string;
  mode?: "text" | "tel" | "email" | "url";
  ph?: string;
  hint?: string;
  opts?: string[];
  /** Adds a free-text “Бусад” explanation when that option is chosen. */
  other?: boolean;
  /** Colour field offering “Өнгөө мэдэхгүй”. */
  unknown?: boolean;
  /** Optional social links that sit behind a disclosure button. */
  group?: "links";
  cond?: Cond;
  max?: number;
};

export type Step = { title: string; desc: string; fields: Field[] };

export const OTHER = "Бусад";
export const NONE_FEATURE = "Шаардлагагүй";

export const STEPS: Step[] = [
  {
    title: "Үндсэн мэдээлэл",
    desc: "Бид тантай холбогдож, бизнесийг тань ойлгоход хэрэгтэй.",
    fields: [
      { id: "q1", n: 1, label: "Нэр, овог", req: true, kind: "input", type: "text", auto: "name", max: 120 },
      { id: "q2", n: 2, label: "Бизнес, байгууллагын нэр", req: true, kind: "input", type: "text", auto: "organization", max: 160 },
      { id: "q3", n: 3, label: "Үйл ажиллагааны чиглэл", req: true, kind: "input", type: "text", ph: "Жишээ: кофе шоп, гоо сайхны салон", max: 200 },
      { id: "q4", n: 4, label: "Холбоо барих утас", req: true, kind: "input", type: "tel", auto: "tel", mode: "tel", ph: "8800 0000", max: 40 },
      { id: "q5", n: 5, label: "Имэйл", req: true, kind: "input", type: "email", auto: "email", mode: "email", ph: "ner@mail.mn", max: 200 },
      { id: "tLinks", kind: "toggle", label: "Нэмэлт холбоос оруулах (Facebook, Instagram, TikTok)" },
      { id: "q6", n: 6, label: "Facebook хуудасны холбоос", kind: "input", type: "url", mode: "url", group: "links", ph: "facebook.com/tanai-huudas", max: 500 },
      { id: "q7", n: 7, label: "Instagram хаяг", kind: "input", type: "text", group: "links", ph: "@tanai_hayg", max: 120 },
      { id: "q8", n: 8, label: "TikTok хаяг", kind: "input", type: "text", group: "links", ph: "@tanai_hayg", max: 120 },
      { id: "q9", n: 9, label: "Хаяг, байршил", kind: "input", type: "text", auto: "street-address", max: 300 },
      { id: "q10", n: 10, label: "Google Maps холбоос", kind: "input", type: "url", mode: "url", ph: "maps.app.goo.gl/…", max: 500 },
      { id: "q11", n: 11, label: "Ажиллах өдөр, цаг", kind: "input", type: "text", ph: "Жишээ: Да–Ба 09:00–18:00", max: 200 },
    ],
  },
  {
    title: "Вебийн зорилго",
    desc: "Ямар веб хэрэгтэй, юунд ашиглах вэ?",
    fields: [
      { id: "q12", n: 12, label: "Вебийн төрөл", req: true, kind: "radio", other: true, opts: ["Бизнесийн танилцуулга", "Онлайн дэлгүүр", "Кафе / QR меню", "Portfolio", "Цаг захиалга", OTHER] },
      {
        id: "q13",
        n: 13,
        label: "Гол зорилго",
        req: true,
        kind: "multi",
        other: true,
        hint: "Олон сонголт хийж болно.",
        opts: ["Бизнесээ танилцуулах", "Бүтээгдэхүүн, үйлчилгээ харуулах", "Шинэ үйлчлүүлэгч татах", "Онлайн захиалга авах", "Цаг захиалга авах", "Холбоо барих мэдээлэл өгөх", OTHER],
      },
      { id: "q14", n: 14, label: "Одоо веб сайттай юу?", kind: "radio", opts: ["Тийм", "Үгүй"] },
      { id: "q15", n: 15, label: "Одоогийн вебийн холбоос", req: true, kind: "input", type: "url", mode: "url", ph: "tanai-veb.mn", cond: "hasSite", max: 500 },
      { id: "q16", n: 16, label: "Үндсэн хэрэглэгчид хэн бэ?", kind: "textarea", ph: "Жишээ: 20–35 насны оффисын ажилчид", max: 2000 },
    ],
  },
  {
    title: "Дизайн, өнгө",
    desc: "Live demo дээр хийсэн тохиргоо энд дамжина.",
    fields: [
      { id: "bld", kind: "builder", label: "" },
      { id: "q17", n: 17, label: "Үндсэн өнгө", req: true, kind: "color", unknown: true },
      { id: "q18", n: 18, label: "Нэмэлт өнгө", kind: "color" },
      { id: "q19", n: 19, label: "Дизайны хэв маяг", req: true, kind: "radio", opts: ["Minimal", "Modern", "Luxury", "Colorful", "Dark", "Дизайнерт даатгах"] },
      { id: "q20", n: 20, label: "Таалагддаг вебүүдийн холбоос", kind: "textarea", ph: "Нэг мөрөнд нэг холбоос", max: 2000 },
      { id: "q21", n: 21, label: "Лого байгаа эсэх", req: true, kind: "radio", opts: ["Бэлэн байгаа", "Шинэчлэх хэрэгтэй", "Байхгүй"] },
      { id: "q22", n: 22, label: "Лого, брэндийн материал хавсаргах", kind: "file" },
    ],
  },
  {
    title: "Бүтэц, агуулга",
    desc: "Вебэд ямар хэсэг, ямар мэдээлэл орох вэ?",
    fields: [
      {
        id: "q23",
        n: 23,
        label: "Шаардлагатай хэсгүүд",
        req: true,
        kind: "multi",
        other: true,
        hint: "Олон сонголт хийж болно.",
        opts: ["Нүүр", "Бидний тухай", "Бүтээгдэхүүн / Меню", "Үйлчилгээ", "Үнэ", "Gallery", "Reviews", "Contact", "Maps", "FAQ", OTHER],
      },
      { id: "q24", n: 24, label: "Нүүр хуудасны гол гарчиг, уриа", kind: "input", type: "text", max: 200 },
      { id: "q25", n: 25, label: "Байгууллагын товч танилцуулга", req: true, kind: "textarea", max: 3000 },
      { id: "q26", n: 26, label: "Бүтээгдэхүүн, үйлчилгээний нэр, үнэ, тайлбар, ангилал", kind: "textarea", hint: "Жагсаалт байвал файлаар эсвэл Drive холбоосоор илгээж болно.", max: 5000 },
      { id: "q27", n: 27, label: "Бүтээгдэхүүн, байгууллагын зураг хавсаргах", kind: "file" },
      { id: "q28", n: 28, label: "Хэл", req: true, kind: "multi", other: true, opts: ["Монгол", "Англи", OTHER] },
    ],
  },
  {
    title: "Нэмэлт функц",
    desc: "Вебэд ямар боломж хэрэгтэй вэ?",
    fields: [
      {
        id: "q29",
        n: 29,
        label: "Нэмэлт боломжууд",
        kind: "multi",
        other: true,
        hint: "“Шаардлагагүй”-г бусад функцтэй зэрэг сонгох боломжгүй.",
        opts: ["Messenger холбоос", "Instagram холбоос", "Шууд залгах товч", "Google Maps", "QR код", "Хайлт / ангилал", "Онлайн захиалга", "Цаг захиалга", "Онлайн төлбөр", "Админ удирдлага", OTHER, NONE_FEATURE],
      },
      { id: "q30", n: 30, label: "Үйлчлүүлэгчид тантай ямар сувгаар холбогдох вэ?", req: true, kind: "multi", opts: ["Утас", "Messenger", "Instagram Direct", "Имэйл", "Веб форм"] },
      { id: "q31", n: 31, label: "Захиалга эсвэл цаг бүртгэх үйл явцын тайлбар", kind: "textarea", cond: "booking", ph: "Жишээ: үйлчилгээ сонгоод, цагаа сонгож, утсаар баталгаажуулна.", max: 3000 },
    ],
  },
  {
    title: "Домэйн, төсөв, хугацаа",
    desc: "Сонгосон хугацаа, төсөв нь таны хүсэлт бөгөөд бид үнийн саналдаа тусгана.",
    fields: [
      { id: "q32", n: 32, label: "Домэйнтэй эсэх", req: true, kind: "radio", hint: "Домэйн гэдэг нь таны вебийн интернэт хаяг. Жишээ: tanai-ner.mn", opts: ["Байгаа", "Шинээр авна", "Үнэгүй веб хаяг хүснэ", "Зөвлөгөө авна"] },
      { id: "tDomain", kind: "toggle", label: "Өөрийн домэйн ба үнэгүй веб хаягийн ялгаа" },
      {
        id: "nDomain",
        kind: "note",
        cond: "domainHelp",
        label:
          "Өөрийн домэйн (tanai-ner.mn) нь таны нэр дээр бүртгэгдэж, жил бүр сунгагддаг. Үнэгүй веб хаяг нь үйлчилгээний нэртэй (жишээ: tanai-ner.vercel.app) байх ба нэмэлт зардалгүй. Домэйн сул эсэхийг бид тусад нь шалгана.",
      },
      { id: "q33", n: 33, label: "Хүсэж буй эсвэл одоо байгаа домэйн", kind: "input", type: "text", ph: "tanai-ner.mn", cond: "domain", max: 200 },
      { id: "q34", n: 34, label: "Хүсэж буй хугацаа", req: true, kind: "radio", hint: "Энэ нь таны хүсэлт — AXORA-ийн баталгаат хугацаа биш.", opts: ["Аль болох хурдан", "1 долоо хоног", "2 долоо хоног", "1 сар", "Тодорхойгүй"] },
      { id: "q35", n: 35, label: "Төсөв", kind: "radio", opts: ["100,000₮ хүртэл", "100,000–200,000₮", "200,000–350,000₮", "350,000₮-өөс дээш", "Шийдээгүй"] },
      { id: "q36", n: 36, label: "Дараа шинэчлэлт хийх давтамж", kind: "radio", opts: ["Тогтмол", "Заримдаа", "Нэг удаа", "Мэдэхгүй"] },
    ],
  },
  {
    title: "Нэмэлт хүсэлт, зөвшөөрөл",
    desc: "Сүүлийн алхам. Дараа нь бүх хариултаа шалгана.",
    fields: [
      { id: "q37", n: 37, label: "Нэмэлт хүсэлт", kind: "textarea", max: 5000 },
      { id: "q38", n: 38, label: "Эргэн холбогдох суваг", req: true, kind: "radio", opts: ["Утас", "Messenger", "Instagram", "Имэйл"] },
      { id: "q38x", n: "38а", label: "", req: true, kind: "input", type: "text", cond: "contactExtra", max: 200 },
      { id: "nContact", kind: "note", label: "", cond: "contactInfo" },
      { id: "q39", n: 39, label: "Зөвшөөрөл", req: true, kind: "consent" },
    ],
  },
];

export const FILE_FIELDS = ["q22", "q27"] as const;
export type FileFieldId = (typeof FILE_FIELDS)[number];

export const ALL_FIELDS: Field[] = STEPS.flatMap((s) => s.fields);
export const QUESTION_COUNT = ALL_FIELDS.filter((f) => typeof f.n === "number").length; // 39

/** Every answer key the server accepts. */
export const ANSWER_KEYS: Set<string> = new Set(
  ALL_FIELDS.flatMap((f) => {
    if (["toggle", "note", "builder"].includes(f.kind)) return [];
    const keys = [f.id];
    if (f.other) keys.push(f.id + "o");
    if (f.unknown) keys.push(f.id + "u");
    if (f.kind === "file") keys.push(f.id + "d", f.id + "l");
    return keys;
  }),
);

export type UiFlags = { showLinks?: boolean; domainHelp?: boolean };

const str = (v: AnswerValue | undefined) => (typeof v === "string" ? v.trim() : "");
const arr = (v: AnswerValue | undefined) => (Array.isArray(v) ? v : []);

export function contactExtraLabel(a: Answers): string {
  return a.q38 === "Messenger" ? "Messenger нэр эсвэл холбоос" : "Instagram хаяг";
}

/**
 * Whether a field is shown. Hidden conditional fields are never validated
 * as required and are dropped from the saved answers.
 */
export function isVisible(f: Field, a: Answers, ui: UiFlags = {}): boolean {
  if (f.group === "links") return !!ui.showLinks || !!(str(a.q6) || str(a.q7) || str(a.q8));
  switch (f.cond) {
    case "hasSite":
      return a.q14 === "Тийм";
    case "booking": {
      const x = arr(a.q29);
      return x.includes("Онлайн захиалга") || x.includes("Цаг захиалга");
    }
    case "domain":
      return a.q32 === "Байгаа" || a.q32 === "Шинээр авна";
    case "domainHelp":
      return !!ui.domainHelp;
    case "contactExtra":
      return a.q38 === "Messenger" || (a.q38 === "Instagram" && !str(a.q7));
    case "contactInfo":
      return a.q38 === "Утас" || a.q38 === "Имэйл";
    default:
      return true;
  }
}

export function normalizeHexAnswer(v: string): string | null {
  let h = v.trim();
  if (!h) return null;
  if (h[0] !== "#") h = "#" + h;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(h)) return null;
  if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  return h.toUpperCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i;

/** Returns a Mongolian error message, or "" when the field is valid. */
export function checkField(f: Field, a: Answers): string {
  const v = a[f.id];
  const s = str(v);
  if (f.id === "q38x") return s ? "" : "Энэ талбарыг бөглөнө үү.";
  switch (f.kind) {
    case "input":
    case "textarea":
      if (f.req && !s) return "Энэ талбарыг бөглөнө үү.";
      if (s && f.max && s.length > f.max) return `Хамгийн ихдээ ${f.max} тэмдэгт оруулна уу.`;
      if (s && f.type === "email" && !EMAIL_RE.test(s)) return "Имэйл хаяг буруу байна. Жишээ: ner@mail.mn";
      if (s && f.type === "tel" && s.replace(/\D/g, "").length < 8) return "Утасны дугаар дор хаяж 8 оронтой байна.";
      if (s && f.type === "url" && !URL_RE.test(s)) return "Холбоос буруу байна. Жишээ: facebook.com/tanai-huudas";
      return "";
    case "radio":
      if (f.req && !s) return "Нэг сонголт хийнэ үү.";
      if (s && f.opts && !f.opts.includes(s)) return "Сонголт буруу байна.";
      if (s === OTHER && f.other && !str(a[f.id + "o"])) return "“Бусад” сонголтоо тодруулна уу.";
      return "";
    case "multi": {
      const list = arr(v);
      if (f.req && !list.length) return "Дор хаяж нэгийг сонгоно уу.";
      if (f.opts && list.some((x) => !f.opts!.includes(x))) return "Сонголт буруу байна.";
      if (list.includes(NONE_FEATURE) && list.length > 1) return "“Шаардлагагүй”-г бусад функцтэй зэрэг сонгох боломжгүй.";
      if (list.includes(OTHER) && f.other && !str(a[f.id + "o"])) return "“Бусад” сонголтоо тодруулна уу.";
      return "";
    }
    case "color":
      if (f.unknown && a[f.id + "u"] === true) return "";
      if (!s) return f.req ? "Өнгө сонгох эсвэл “Өнгөө мэдэхгүй” гэж тэмдэглэнэ үү." : "";
      if (!normalizeHexAnswer(s)) return "HEX өнгө буруу байна. Жишээ: #245C45";
      return "";
    case "file": {
      const d = str(a[f.id + "d"]);
      if (d && !URL_RE.test(d)) return "Drive холбоос буруу байна.";
      return "";
    }
    case "consent":
      return a.q39 === true ? "" : "Үргэлжлүүлэхийн тулд зөвшөөрлөө баталгаажуулна уу.";
    default:
      return "";
  }
}

export type FieldError = { field: Field; message: string };

export function stepErrors(stepIndex: number, a: Answers, ui: UiFlags = {}): FieldError[] {
  const out: FieldError[] = [];
  for (const f of STEPS[stepIndex].fields) {
    if (["toggle", "note", "builder"].includes(f.kind)) continue;
    if (!isVisible(f, a, ui)) continue;
    const m = checkField(f, a);
    if (m) out.push({ field: f, message: m });
  }
  return out;
}

export function allErrors(a: Answers): { step: number; errors: FieldError[] }[] {
  return STEPS.map((_, i) => ({ step: i, errors: stepErrors(i, a, { showLinks: true }) })).filter((x) => x.errors.length);
}

/**
 * Keeps only known keys and the answers of visible fields, trims strings,
 * and normalises colours — the canonical form that the server stores.
 */
export function sanitizeAnswers(a: Answers): Answers {
  const out: Answers = {};
  for (const f of ALL_FIELDS) {
    if (["toggle", "note", "builder"].includes(f.kind)) continue;
    if (!isVisible(f, a, { showLinks: true })) continue;
    const v = a[f.id];
    if (f.kind === "multi") {
      const list = Array.from(new Set(arr(v).filter((x) => typeof x === "string")));
      if (list.length) out[f.id] = list;
      if (f.other && list.includes(OTHER) && str(a[f.id + "o"])) out[f.id + "o"] = str(a[f.id + "o"]).slice(0, 300);
    } else if (f.kind === "radio") {
      if (str(v)) out[f.id] = str(v);
      if (f.other && str(v) === OTHER && str(a[f.id + "o"])) out[f.id + "o"] = str(a[f.id + "o"]).slice(0, 300);
    } else if (f.kind === "color") {
      if (f.unknown && a[f.id + "u"] === true) out[f.id + "u"] = true;
      else if (str(v)) out[f.id] = normalizeHexAnswer(str(v)) ?? str(v);
    } else if (f.kind === "consent") {
      out[f.id] = a[f.id] === true;
    } else if (f.kind === "file") {
      if (str(a[f.id + "d"])) out[f.id + "d"] = str(a[f.id + "d"]).slice(0, 500);
      if (a[f.id + "l"] === true) out[f.id + "l"] = true;
    } else if (str(v)) {
      out[f.id] = str(v).slice(0, f.max ?? 3000);
    }
  }
  return out;
}

/** Human-readable value for the review step and exported JSON. */
export function formatAnswer(f: Field, a: Answers): string {
  const v = a[f.id];
  if (f.kind === "multi") return arr(v).map((x) => (x === OTHER && str(a[f.id + "o"]) ? `${OTHER}: ${str(a[f.id + "o"])}` : x)).join(", ");
  if (f.kind === "radio") return v === OTHER && str(a[f.id + "o"]) ? `${OTHER}: ${str(a[f.id + "o"])}` : str(v);
  if (f.kind === "color") return f.unknown && a[f.id + "u"] === true ? "Санал авъя" : str(v);
  if (f.kind === "consent") return a.q39 === true ? "Зөвшөөрсөн" : "Зөвшөөрөөгүй";
  return str(v);
}

/** Server-side contact-channel resolution for the dedicated DB column. */
export function preferredChannel(a: Answers): string {
  const map: Record<string, string> = { Утас: "phone", Messenger: "messenger", Instagram: "instagram", Имэйл: "email" };
  return map[str(a.q38)] ?? "phone";
}
