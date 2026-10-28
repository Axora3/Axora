import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-[720px] flex-col items-start gap-4 px-[clamp(16px,4vw,40px)] py-24">
        <span className="text-[13px] font-extrabold tracking-[0.08em] text-brand uppercase">404</span>
        <h1 className="text-[clamp(32px,4vw,48px)] leading-[1.08] font-extrabold tracking-[-0.03em]">
          Хуудас <span className="serif">олдсонгүй</span>
        </h1>
        <p className="text-[17px] leading-relaxed text-muted">Хаяг буруу эсвэл хуудас устсан байж болзошгүй.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="ax-btn ax-primary inline-flex min-h-12 items-center rounded-xl bg-brand px-5 font-bold text-white no-underline">
            Нүүр хуудас
          </Link>
          <Link href="/templates" className="ax-btn ax-ghost inline-flex min-h-12 items-center rounded-xl border border-line-strong bg-surface px-5 font-bold text-ink no-underline">
            Загварууд
          </Link>
        </div>
      </main>
    </>
  );
}
