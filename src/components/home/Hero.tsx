import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto grid max-w-[1240px] items-center gap-[clamp(40px,5vw,72px)] px-[clamp(16px,4vw,40px)] pt-[clamp(32px,7vw,96px)] pb-[clamp(56px,8vw,112px)] [grid-template-columns:repeat(auto-fit,minmax(min(440px,100%),1fr))]"
    >
      <div className="flex flex-col gap-7">
        <div className="ax-in d1 inline-flex items-center gap-2.5 self-start rounded-full border border-line bg-surface py-2 pr-3.5 pl-2.5 text-sm font-bold text-brand">
          <span className="ax-live h-2 w-2 rounded-full bg-brand" />
          Бэлэн загвар • Захиалгат веб
        </div>
        <h1
          id="hero-title"
          className="ax-in d2 text-[clamp(42px,6.4vw,88px)] leading-[1.02] font-extrabold tracking-[-0.035em] [word-break:keep-all]"
        >
          Санаагаа дараагийн <span className="serif ax-mark px-[0.06em]">түвшинд.</span>
        </h1>
        <p className="ax-in d3 max-w-[30em] text-[clamp(17px,1.5vw,20px)] leading-relaxed text-muted">
          Ажлыг хөнгөвчлөх бэлэн загварууд, бизнесийг тань илэрхийлэх веб сайт — нэг дор.
        </p>
        <div className="ax-in d4 flex flex-wrap gap-3">
          <Link href="/templates" className="ax-btn ax-primary inline-flex min-h-[54px] items-center gap-2.5 rounded-xl bg-brand px-6 text-base font-bold text-white no-underline max-[480px]:w-full max-[480px]:justify-center">
            Загварууд үзэх
            <span className="ax-arrow">
              <ArrowRight />
            </span>
          </Link>
          <Link href="/builder" className="ax-btn ax-ghost inline-flex min-h-[54px] items-center gap-2.5 rounded-xl border border-line-strong bg-surface px-6 text-base font-bold text-ink no-underline max-[480px]:w-full max-[480px]:justify-center">
            Вебээ загварчлах
          </Link>
        </div>
        <div className="ax-in d5 flex flex-wrap gap-x-5 gap-y-2 pt-2 text-sm font-semibold text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-ink text-[11px] font-extrabold text-white">N</span>Notion
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-[18px] w-[18px] rounded-full bg-[#2B8C8C]" />Canva
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-[#2F7A4D] text-[11px] font-extrabold text-white">X</span>Excel
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-[18px] w-[18px] rounded-[5px] border-2 border-brand" />Захиалгат веб
          </span>
        </div>
      </div>

      <div className="ax-comp relative h-[580px]" role="img" aria-label="Бүтээгдэхүүний жишээ: кофе шопын веб, Notion самбар, Excel төсөв">
        {/* Coffee-shop website mock */}
        <div className="ax-in d3 absolute top-14 left-[4%] w-[90%] overflow-hidden rounded-[22px] border border-line bg-surface shadow-[0_40px_80px_-48px_rgba(23,37,30,.45)]">
          <div className="flex h-10 items-center gap-2 border-b border-line bg-[#F2F4EC] px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E1A28F]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E8CF84]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#9CC59B]" />
            <span className="ml-3 flex h-6 max-w-[260px] flex-1 items-center rounded-[7px] border border-line bg-surface px-2.5 text-xs text-muted">uul-coffee.mn</span>
          </div>
          <div className="bg-[#FBF7EF] px-[22px] pt-[18px] pb-[22px]">
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
                <span className="text-[clamp(20px,2.4vw,26px)] leading-[1.08] font-extrabold tracking-[-0.02em] text-[#2B1A12]">Өглөөг амттай эхлүүл.</span>
                <span className="text-xs leading-normal text-[#6B5648]">Шинэхэн шарсан кофе, гар хийцийн нарийн боов.</span>
                <span className="mt-1 self-start rounded-lg bg-[#8A4B2E] px-3.5 py-[9px] text-xs font-bold text-white">Меню үзэх</span>
              </div>
              <div className="relative flex aspect-[1/0.86] items-center justify-center overflow-hidden rounded-2xl bg-[#E9D3B5]">
                <div className="ax-spin flex aspect-square w-[62%] items-center justify-center rounded-full bg-[#F7EEE2] shadow-[0_14px_30px_-14px_rgba(59,42,32,.5)]">
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
                <div key={n} className="flex flex-col gap-0.5 rounded-[10px] border border-[#EADFCF] bg-surface p-2.5">
                  <span className="truncate text-xs font-bold text-[#2B1A12]">{n}</span>
                  <span className="text-[11px] font-bold text-[#8A4B2E]">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Excel budget card */}
        <div className="ax-in d5 absolute top-0 -right-1.5 w-[248px]">
          <div className="ax-floatB overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_26px_50px_-30px_rgba(23,37,30,.5)]">
            <div className="flex items-center gap-2 bg-[#2F7A4D] px-3 py-2.5 text-xs font-bold text-white">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-white text-[10px] font-extrabold text-[#2F7A4D]">X</span>
              Сарын төсөв.xlsx
            </div>
            <div className="flex flex-col gap-2.5 px-3 pt-2.5 pb-3">
              <div className="grid grid-cols-[1.1fr_1fr_1fr] overflow-hidden rounded-md border border-[#E3E8DF] text-[10.5px]">
                {["Ангилал", "Төлөв.", "Бодит"].map((h) => (
                  <span key={h} className="bg-[#EEF3EC] px-1.5 py-[5px] font-extrabold">
                    {h}
                  </span>
                ))}
                {[
                  ["Хоол", "400,000", "362,500", true],
                  ["Унаа", "120,000", "98,000", true],
                  ["Түрээс", "650,000", "650,000", false],
                ].map(([a, b, c, g]) => (
                  <span key={String(a)} className="contents">
                    <span className="border-t border-[#E3E8DF] px-1.5 py-[5px]">{a}</span>
                    <span className="border-t border-[#E3E8DF] px-1.5 py-[5px] text-muted">{b}</span>
                    <span className={`border-t border-[#E3E8DF] px-1.5 py-[5px] font-bold ${g ? "text-brand" : ""}`}>{c}</span>
                  </span>
                ))}
              </div>
              <div className="flex h-[54px] items-end gap-1.5 border-b border-line px-0.5">
                {[
                  [62, "#BFD7C6", "d4"],
                  [80, "#BFD7C6", "d5"],
                  [48, "#BFD7C6", "d5"],
                  [92, "#245C45", "d6"],
                  [70, "#BFD7C6", "d6"],
                  [56, "#D9F279", "d7"],
                ].map(([h, c, d], i) => (
                  <span key={i} className={`ax-bar ${d} flex-1 rounded-t-[3px]`} style={{ height: `${h}%`, background: String(c) }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notion study plan card */}
        <div className="ax-in d6 absolute bottom-1.5 -left-3.5 w-[262px]">
          <div className="ax-floatA flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-3.5 shadow-[0_26px_50px_-30px_rgba(23,37,30,.5)]">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-md bg-ink text-xs font-extrabold text-white">N</span>
              <span className="text-[13px] font-extrabold">Хичээлийн төлөвлөгөө</span>
            </div>
            <div className="flex gap-1.5 text-[10.5px] font-bold">
              <span className="rounded-[5px] bg-soft px-[7px] py-[3px] text-brand">Энэ долоо хоног</span>
              <span className="rounded-[5px] bg-[#F4F1E6] px-[7px] py-[3px] text-warn">3 даалгавар</span>
            </div>
            <div className="flex flex-col gap-[7px] text-xs">
              {["Математик — бие даалт 3", "Англи хэл — эссе"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <span className="inline-flex h-[15px] w-[15px] items-center justify-center rounded bg-brand text-white">
                    <Check size={11} strokeWidth={3.2} />
                  </span>
                  <span className="text-muted line-through">{t}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="h-[15px] w-[15px] rounded border-[1.5px] border-[#9AA89F]" />
                <span className="font-semibold">Програмчлал — лаб 5</span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-md bg-soft">
              <div className="ax-fill h-full w-[67%] rounded-md bg-brand" />
            </div>
          </div>
        </div>

        <div className="ax-in d7 absolute right-[22px] bottom-[54px] flex items-center gap-2.5 self-start rounded-xl bg-ink px-3.5 py-2.5 text-xs font-bold text-white shadow-[0_18px_36px_-20px_rgba(23,37,30,.6)] max-[900px]:w-max">
          <span className="flex">
            <span className="h-4 w-4 rounded-full border-2 border-ink bg-lime" />
            <span className="-ml-[5px] h-4 w-4 rounded-full border-2 border-ink bg-[#8A4B2E]" />
            <span className="-ml-[5px] h-4 w-4 rounded-full border-2 border-ink bg-[#1F5F8B]" />
          </span>
          Өнгөө өөрөө сонго
        </div>
      </div>
    </section>
  );
}
