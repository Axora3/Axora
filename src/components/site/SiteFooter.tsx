import Link from "next/link";
import { getSiteContent } from "@/lib/content/service";
import { emailHref, phoneHref } from "@/lib/contact-links";

export async function SiteFooter() {
  const c = await getSiteContent();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1240px] items-start gap-8 px-[clamp(16px,4vw,40px)] py-12 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-[1fr_1.5fr_1fr]">
        <div className="flex max-w-[320px] flex-col gap-2.5">
          <span className="text-lg font-extrabold tracking-[0.08em]">AXORA</span>
          <span className="text-sm leading-relaxed text-muted">{c.footerText}</span>
        </div>
        <nav aria-label="Доод холбоосууд" className="grid grid-cols-2 gap-x-6 gap-y-1 text-[15px] font-semibold">
          {[
            ["/templates", "Загварууд"],
            ["/builder", "Жишээ загвар"],
            ["/order", "Анкет"],
            ["/bundles", "Багцууд"],
            ["/portfolio", "Портфолио"],
            ["/learn", "Сургалт"],
            ["/blog", "Нийтлэл"],
            ["/favorites", "Хадгалсан"],
            ["/#faq", "Түгээмэл асуулт"],
            ["/privacy", "Нууцлал"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="ax-link inline-flex min-h-11 items-center text-ink no-underline">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex min-w-0 flex-col gap-1.5 text-sm break-words text-muted">
          <Link href="/contact" className="ax-link font-extrabold text-ink no-underline">
            Холбоо барих
          </Link>
          {phoneHref(c.contact.phone) ? <a href={phoneHref(c.contact.phone)!} className="ax-link text-muted no-underline">{c.contact.phone}</a> : <span>{c.contact.phone}</span>}
          {emailHref(c.contact.email) ? <a href={emailHref(c.contact.email)!} className="ax-link text-muted no-underline">{c.contact.email}</a> : <span>{c.contact.email}</span>}
          {c.social.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="ax-link inline-flex min-h-11 items-center text-muted no-underline">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
