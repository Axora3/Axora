import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";
import { Faq } from "@/components/home/Faq";
import { ArrowRight, Chat, Clock, Mail, PhoneCall } from "@/components/icons";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { getSiteContent } from "@/lib/content/service";
import { isBackendConfigured } from "@/lib/supabase/server";
import { emailHref, httpsHref, isConfigured, phoneHref } from "@/lib/contact-links";

export const metadata: Metadata = {
  title: "Холбоо барих",
  description: "AXORA-тай холбогдох эсвэл богино зурвас үлдээх. Асуулт байвал бид хариулъя.",
  alternates: { canonical: "/contact" },
};

function Hero() {
  return (
    <section aria-labelledby="ct-title" className="relative isolate overflow-hidden bg-band text-on-band">
      <div aria-hidden="true" className="ax-aurora" />
      <div className="ax-container flex flex-col items-start gap-4 py-[clamp(40px,7vw,96px)]">
        <span className="ax-pill-band ax-in">Холбоо барих</span>
        <h1 id="ct-title" className="ax-display ax-in d1 max-w-[11em]">
          Бидэнтэй <span className="serif text-lime">холбогдох</span>
        </h1>
        <p className="ax-in d2 max-w-[34em] text-[clamp(17px,1.5vw,20px)] leading-relaxed text-band-muted">Асуулт, санаагаа бичээд үлдээгээрэй. Вебсайт, загвар, захиалгын талаар хамтдаа ярилцъя.</p>
      </div>
    </section>
  );
}

export default function ContactPage(props: PageProps<"/contact">) {
  return (
    <>
      <SiteHeader active="/contact" />
      <main id="main">
        <Hero />
        <Suspense fallback={<div aria-busy="true" aria-label="Ачаалж байна" className="ax-container py-section"><Skeleton className="h-96 rounded-card" /></div>}>
          <ContactDetails searchParams={props.searchParams} />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
    </>
  );
}

async function ContactDetails({ searchParams }: Pick<PageProps<"/contact">, "searchParams">) {
  const [content, query] = await Promise.all([getSiteContent(), searchParams]);
  const { contact } = content;
  const bundleSlug = typeof query.bundle === "string" ? query.bundle : "";
  const bundle = content.library.find((entry) => entry.kind === "bundle" && entry.slug === bundleSlug && entry.published);
  const initialMessage = bundle ? `Сайн байна уу. Би “${bundle.title}” багцын талаар асуух гэсэн юм.` : "";
  // Only details the owner has filled in: unset placeholders are never shown to visitors.
  const channels = [
    { Icon: Mail, label: "Имэйл", value: contact.email, href: emailHref(contact.email) },
    { Icon: PhoneCall, label: "Утас", value: contact.phone, href: phoneHref(contact.phone) },
    { Icon: Chat, label: "Messenger", value: contact.messenger, href: httpsHref(contact.messenger) },
    { Icon: Clock, label: "Ажиллах цаг", value: contact.hours, href: null },
  ].filter((channel) => isConfigured(channel.value));

  return (
    <>
      <div className="ax-container grid items-start gap-8 py-section nav:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] nav:gap-x-16">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="ax-h3">Шууд холбогдох</h2>
            <p className="text-[15px] leading-relaxed text-muted">Зурвас үлдээвэл таны бичсэн утас эсвэл имэйлээр эргэн холбогдоно.</p>
          </div>

          {channels.length > 0 && (
            <ul aria-label="Холбоо барих сувгууд" className="m-0 list-none rounded-card border border-line bg-surface px-4 py-1">
              {channels.map(({ Icon: ChannelIcon, label, value, href }, i) => (
                <li key={label} className={`flex min-h-16 items-center gap-3.5 ${i < channels.length - 1 ? "border-b border-soft" : ""}`}>
                  <span className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-soft text-brand">
                    <ChannelIcon size={20} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-muted">{label}</span>
                    {href ? <a href={href} className="ax-link text-base font-extrabold [overflow-wrap:anywhere] text-ink no-underline">{value}</a> : <span className="text-base font-extrabold">{value}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {content.social.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-sm font-extrabold">Сошиал хаяг</h3>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {content.social.map((social) => (
                  <li key={social.url}>
                    <a href={social.url} target="_blank" rel="noopener noreferrer" className={buttonStyles("secondary", "ax-btn")}>
                      {social.label}
                      <Icon name="external-link" size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <section aria-labelledby="ct-form-t" className="ax-surface flex flex-col gap-4 p-[clamp(20px,3vw,36px)]">
          <h2 id="ct-form-t" className="ax-h3">Зурвас үлдээх</h2>
          <ContactForm backendEnabled={isBackendConfigured()} initialMessage={initialMessage} />
        </section>
      </div>

      <section aria-labelledby="ct-faq" className="border-y border-line bg-surface">
        <div className="ax-container ax-section grid items-start gap-[clamp(28px,5vw,72px)] [grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr))]">
          <h2 id="ct-faq" className="ax-h2">
            Түгээмэл <span className="serif">асуулт</span>
          </h2>
          <Faq items={content.faq} />
        </div>
      </section>

      <section aria-labelledby="ct-cta" className="ax-container py-section">
        <div className="ax-page-hero flex flex-col gap-5 nav:flex-row nav:items-center nav:justify-between">
          <div className="flex flex-col gap-2">
            <h2 id="ct-cta" className="ax-h2">
              Вебсайтаа <span className="serif">эхлүүлэх үү?</span>
            </h2>
            <p className="ax-lead">Өнгө, хэв маягаа туршаад, хэрэгцээгээ анкетаар илгээгээрэй.</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link href="/builder" className={buttonStyles("primary", "ax-btn", "lg")}>
              Вебсайт бүтээх
              <ArrowRight size={18} />
            </Link>
            <Link href="/order" className={buttonStyles("secondary", "ax-btn", "lg")}>Үнийн санал авах</Link>
          </div>
        </div>
      </section>
    </>
  );
}
