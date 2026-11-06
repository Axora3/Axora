import Link from "next/link";
import { ArrowRight } from "@/components/icons";

const REASONS = [
  { title: "Бүгд монгол хэлээр", text: "Сайт, анкет, заавар бүгд монгол хэл дээр тул орчуулах, таамаглах шаардлагагүй." },
  { title: "Эхлээд хараад шийднэ", text: "Өнгө, хэв маягаа Website Builder дээр туршаад, вебээ хэрхэн харагдахыг захиалахаасаа өмнө үзнэ." },
  { title: "Үнийг урьдчилан тохирно", text: "Анкетаа илгээсний дараа ажлын хүрээ, үнийн саналыг тусад нь бэлтгэж, хамтдаа тохирно." },
  { title: "Дараа нь өөрөө удирдана", text: "Загвар бүр хэрхэн ашиглах заавартай. Захиалгат вебийг хүлээлгэн өгөхдөө мөн заавар өгнө." },
];

/**
 * Plain statements about how AXORA works. No ratings, counts or testimonials:
 * those appear only when they are real and approved.
 */
export function WhyAxora() {
  return (
    <section aria-labelledby="why-title" className="relative isolate overflow-hidden bg-band text-on-band">
      <div aria-hidden="true" className="ax-aurora opacity-40" />
      <div className="ax-container ax-section grid gap-10 nav:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] nav:gap-16">
        <div className="ax-reveal flex flex-col items-start gap-5 nav:sticky nav:top-24 nav:self-start">
          <span className="text-xs font-extrabold tracking-[0.12em] text-lime uppercase">Яагаад AXORA</span>
          <h2 id="why-title" className="ax-h2">
            Энгийн. Ойлгомжтой. <span className="serif text-lime">Шударга.</span>
          </h2>
          <p className="max-w-[28em] text-[15px] leading-relaxed text-band-muted">Зөвхөн бодит хэрэглэгчийн зөвшөөрөлтэй сэтгэгдэл, хүлээлгэн өгсөн төслийг нийтэлнэ.</p>
          <Link href="/portfolio" className="ax-link inline-flex min-h-11 items-center gap-2 font-bold text-lime no-underline">
            Портфолио үзэх
            <span className="ax-arrow"><ArrowRight size={16} /></span>
          </Link>
        </div>
        <ol className="m-0 list-none p-0">
          {REASONS.map((reason, index) => (
            <li key={reason.title} className="ax-why-row ax-reveal">
              <span aria-hidden="true" className="serif text-[28px] leading-none text-lime">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-2">
                <h3 className="text-[clamp(20px,2vw,26px)] leading-tight font-extrabold tracking-[-0.015em]">{reason.title}</h3>
                <p className="max-w-[36em] text-[15px] leading-relaxed text-band-muted">{reason.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
