import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";
import { ArrowRight, Chat, Clock, Mail, PhoneCall } from "@/components/icons";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSiteContent } from "@/lib/content/service";
import { isBackendConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Холбоо барих",
  description: "AXORA-тай утас, имэйл, Messenger-ээр холбогдох эсвэл богино зурвас үлдээх.",
};



export default async function ContactPage() {
  const { contact } = await getSiteContent();
  const CHANNELS = [
    { Icon: PhoneCall, label: "Утас", value: contact.phone },
    { Icon: Mail, label: "Имэйл", value: contact.email },
    { Icon: Chat, label: "Messenger", value: contact.messenger },
    { Icon: Clock, label: "Ажиллах цаг", value: contact.hours },
  ];
  return (
    <>
      <SiteHeader mobileBack={{ href: "/", label: "Нүүр рүү буцах", title: "Холбоо барих" }} />
      <main id="main" className="mx-auto grid max-w-[1240px] gap-[22px] px-5 pt-6 pb-8 min-[900px]:grid-cols-[1fr_1.1fr] min-[900px]:gap-x-16 min-[900px]:px-[clamp(16px,4vw,40px)] min-[900px]:pt-16 min-[900px]:pb-24">
        <div className="flex flex-col gap-[22px]">
          <div className="ax-in d1 flex flex-col gap-2.5">
            <h1 className="text-[34px] leading-[1.06] font-extrabold tracking-[-0.03em] min-[900px]:text-[clamp(36px,4.4vw,56px)]">
              Бидэнтэй <span className="serif">холбогдох</span>
            </h1>
            <p className="text-base leading-relaxed text-muted min-[900px]:text-[17px]">Асуулт байвал доорх сувгаар эсвэл богино зурвас үлдээгээрэй.</p>
          </div>

          <ul aria-label="Холбоо барих сувгууд" className="ax-in d2 m-0 list-none rounded-[20px] border border-line bg-surface px-4 py-1">
            {CHANNELS.map(({ Icon, label, value }, i) => (
              <li key={label} className={`flex min-h-16 items-center gap-3.5 ${i < CHANNELS.length - 1 ? "border-b border-soft" : ""}`}>
                <span className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-soft text-brand">
                  <Icon size={20} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-bold text-muted">{label}</span>
                  <span className="text-base font-extrabold">{value}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="ax-in d3 grid grid-cols-2 gap-2.5">
            <Link href="/order" className="ax-btn flex min-h-[104px] flex-col justify-between rounded-[18px] bg-ink p-3.5 text-bg no-underline">
              <span className="text-[15px] leading-[1.3] font-extrabold">Үнийн санал авах</span>
              <span className="inline-flex h-[34px] w-[34px] items-center justify-center self-end rounded-[10px] bg-lime text-ink">
                <ArrowRight size={16} strokeWidth={2.2} />
              </span>
            </Link>
            <Link href="/#faq" className="ax-btn flex min-h-[104px] flex-col justify-between rounded-[18px] border border-line bg-surface p-3.5 text-ink no-underline">
              <span className="text-[15px] leading-[1.3] font-extrabold">Түгээмэл асуулт</span>
              <span className="inline-flex h-[34px] w-[34px] items-center justify-center self-end rounded-[10px] bg-soft text-brand">
                <ArrowRight size={16} strokeWidth={2.2} />
              </span>
            </Link>
          </div>
        </div>

        <section aria-labelledby="ct-form-t" className="ax-in d4 flex flex-col gap-3.5 self-start rounded-[20px] border border-line bg-surface px-4 py-5 min-[900px]:p-8">
          <h2 id="ct-form-t" className="text-xl font-extrabold">
            Зурвас үлдээх
          </h2>
          <ContactForm backendEnabled={isBackendConfigured()} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
