import Link from "next/link";
import { CONTACT } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-start justify-between gap-7 px-[clamp(16px,4vw,40px)] py-10">
        <div className="flex max-w-[320px] flex-col gap-2.5">
          <span className="text-lg font-extrabold tracking-[0.08em]">AXORA</span>
          <span className="text-sm leading-relaxed text-muted">Бэлэн дижитал загвар ба захиалгат веб сайт.</span>
        </div>
        <nav aria-label="Доод холбоосууд" className="flex flex-wrap gap-x-7 gap-y-2 text-[15px] font-semibold">
          {[
            ["/templates", "Загварууд"],
            ["/services", "Веб хөгжүүлэлт"],
            ["/builder", "Live demo"],
            ["/order", "Анкет"],
            ["/#faq", "Түгээмэл асуулт"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="ax-link inline-flex min-h-11 items-center text-ink no-underline">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1.5 text-sm text-muted">
          <Link href="/contact" className="ax-link font-extrabold text-ink no-underline">
            Холбоо барих
          </Link>
          <span>{CONTACT.phone}</span>
          <span>{CONTACT.email}</span>
          <span>{CONTACT.social}</span>
        </div>
      </div>
    </footer>
  );
}
