import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { emailHref, phoneHref } from "@/lib/contact-links";
import { getSiteContent } from "@/lib/content/service";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  { title: "Загварууд", links: [["/templates", "Бэлэн загварууд"], ["/bundles", "Багцууд"], ["/favorites", "Хадгалсан"], ["/compare", "Харьцуулах"]] },
  { title: "Веб", links: [["/services", "Веб хөгжүүлэлт"], ["/builder", "Вебээ загварчлах"], ["/order", "Анкет"], ["/portfolio", "Портфолио"]] },
  { title: "Мэдлэг", links: [["/learn", "Сургалт"], ["/blog", "Нийтлэл"], ["/#faq", "Түгээмэл асуулт"], ["/privacy", "Нууцлал"]] },
];

const heading = "mb-1 text-xs font-extrabold tracking-[0.08em] text-muted uppercase";

export async function SiteFooter() {
  const c = await getSiteContent();
  return (
    <footer className="ax-site-footer border-t border-line bg-surface/60">
      <div className="ax-container grid gap-x-8 gap-y-10 py-14 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-[1.4fr_2.4fr_1fr]">
        <div className="flex max-w-[320px] flex-col gap-3">
          <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-[0.08em] text-ink no-underline">
            <LogoMark />
            AXORA
          </Link>
          <span className="text-sm leading-relaxed text-muted">{c.footerText}</span>
        </div>
        <nav aria-label="Доод холбоосууд" className="grid grid-cols-2 gap-x-6 gap-y-8 min-[520px]:grid-cols-3 min-[700px]:col-span-2 min-[700px]:row-start-2 min-[1100px]:col-span-1 min-[1100px]:row-start-auto">
          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col">
              <h2 className={heading}>{column.title}</h2>
              {column.links.map(([href, label]) => (
                <Link key={href} href={href} className="ax-link inline-flex min-h-10 items-center text-[15px] font-semibold text-ink no-underline">
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="flex min-w-0 flex-col gap-1.5 text-sm break-words text-muted">
          <h2 className={heading}>Холбоо барих</h2>
          <Link href="/contact" className="ax-link inline-flex min-h-10 items-center text-[15px] font-semibold text-ink no-underline">
            Тусламж
          </Link>
          {phoneHref(c.contact.phone) ? <a href={phoneHref(c.contact.phone)!} className="ax-link text-muted no-underline">{c.contact.phone}</a> : <span>{c.contact.phone}</span>}
          {emailHref(c.contact.email) ? <a href={emailHref(c.contact.email)!} className="ax-link text-muted no-underline">{c.contact.email}</a> : <span>{c.contact.email}</span>}
          {c.social.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="ax-link inline-flex min-h-10 items-center text-muted no-underline">
              {s.label}
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-line-soft">
        <p className="ax-container py-5 text-xs text-muted">AXORA · Бүтээх ажлыг хялбарчилъя.</p>
      </div>
    </footer>
  );
}
