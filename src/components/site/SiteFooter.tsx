import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { emailHref, phoneHref } from "@/lib/contact-links";
import { getSiteContent } from "@/lib/content/service";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  { title: "Загварууд", links: [["/templates", "Бэлэн загварууд"], ["/bundles", "Багцууд"], ["/favorites", "Хадгалсан"], ["/compare", "Харьцуулах"]] },
  { title: "Веб", links: [["/services", "Үйлчилгээ"], ["/builder", "Website Builder"], ["/order", "Анкет"], ["/portfolio", "Портфолио"]] },
  { title: "Мэдлэг", links: [["/learn", "Сургалт"], ["/blog", "Нийтлэл"], ["/#faq", "Түгээмэл асуулт"], ["/privacy", "Нууцлал"]] },
];

const heading = "mb-1.5 text-xs font-extrabold text-band-faint";
const link = "inline-flex min-h-10 items-center text-[15px] font-semibold text-on-band no-underline transition-colors hover:text-lime";

export async function SiteFooter() {
  const c = await getSiteContent();
  return (
    <footer className="ax-site-footer overflow-hidden bg-band text-on-band">
      <div className="ax-container grid gap-x-8 gap-y-10 pt-16 pb-12 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-[1.4fr_2.4fr_1fr]">
        <div className="flex max-w-[320px] flex-col gap-3">
          <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-[0.08em] text-on-band no-underline">
            <LogoMark />
            AXORA
          </Link>
          <span className="text-sm leading-relaxed text-band-muted">{c.footerText}</span>
        </div>
        <nav aria-label="Доод холбоосууд" className="grid grid-cols-2 gap-x-6 gap-y-8 min-[520px]:grid-cols-3 min-[700px]:col-span-2 min-[700px]:row-start-2 min-[1100px]:col-span-1 min-[1100px]:row-start-auto">
          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col">
              <h2 className={heading}>{column.title}</h2>
              {column.links.map(([href, label]) => (
                <Link key={href} href={href} className={link}>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="flex min-w-0 flex-col gap-1.5 text-sm break-words text-band-muted">
          <h2 className={heading}>Холбоо барих</h2>
          <Link href="/contact" className={link}>Бидэнтэй холбогдох</Link>
          {phoneHref(c.contact.phone) ? <a href={phoneHref(c.contact.phone)!} className="text-band-muted no-underline hover:text-lime">{c.contact.phone}</a> : <span>{c.contact.phone}</span>}
          {emailHref(c.contact.email) ? <a href={emailHref(c.contact.email)!} className="text-band-muted no-underline hover:text-lime">{c.contact.email}</a> : <span>{c.contact.email}</span>}
          {c.social.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center text-band-muted no-underline hover:text-lime">
              {s.label}
            </a>
          ))}
        </div>
      </div>
      <div className="ax-container flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-band-line pt-5 pb-6">
        <p className="text-xs text-band-faint">AXORA · Бүтээх ажлыг хялбарчилъя.</p>
        <Link href="/privacy" className="inline-flex min-h-11 items-center text-xs font-semibold text-band-faint no-underline transition-colors hover:text-lime">Нууцлалын бодлого</Link>
      </div>
      <div aria-hidden="true" className="ax-container -mb-[0.1em] pt-4">
        <span className="ax-wordmark">AXORA</span>
      </div>
    </footer>
  );
}
