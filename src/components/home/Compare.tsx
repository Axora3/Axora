import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";

const READY = ["Шууд ашиглах боломжтой", "Өөрөө засаж, өөрчилнө", "Хэрхэн ашиглах заавартай", "Үнэгүй загвар бас бий"];
const CUSTOM = ["Брэнд, өнгөнд тань тааруулна", "Хуудас, функцээ сонгоно", "Домэйн, хостингийн зөвлөгөө", "Хүлээлгэн өгөхдөө заавар өгнө"];

function Meta({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-xl px-3.5 py-3 ${dark ? "bg-band-hover" : "bg-sunken"}`}>
      <dt className={`text-[12.5px] font-bold ${dark ? "text-dark-muted" : "text-muted"}`}>{label}</dt>
      <dd className="mt-0.5 text-base font-extrabold">{value}</dd>
    </div>
  );
}

function Feature({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className={`inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] ${dark ? "bg-lime text-on-lime" : "bg-soft text-brand"}`}
      >
        <Check size={13} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

export function Compare() {
  return (
    <section
      id="services"
      aria-labelledby="cmp-title"
      className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,40px)] pt-16 pb-14 min-[900px]:pb-[104px]"
    >
      <h2 id="cmp-title" className="ax-reveal max-w-[16em] text-[clamp(28px,3.4vw,44px)] leading-[1.12] font-extrabold tracking-[-0.025em]">
        Танд <span className="serif">аль нь</span> тохирох вэ?
      </h2>

      <div className="mt-10 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr))]">
        <article className="ax-reveal ax-card flex flex-col gap-[22px] rounded-[22px] border border-line bg-surface p-[clamp(24px,3vw,40px)]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] font-extrabold tracking-[0.08em] text-brand uppercase">01</span>
            <span className="text-[13px] font-bold text-muted">Excel · Notion · Canva</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[clamp(24px,2.4vw,32px)] leading-[1.18] font-extrabold tracking-[-0.02em]">Бэлэн загвар авах</h3>
            <p className="text-base leading-relaxed text-muted">
              Хичээл, төсөв, контент, сошиал пост — өөрийн бүртгэл рүү хуулаад өнөөдрөөс ашиглана.
            </p>
          </div>
          <dl className="m-0 grid grid-cols-2 gap-2.5">
            <Meta label="Хугацаа" value="Төлбөрийн дараа" />
            <Meta label="Үнэ" value="Загвар бүрт тогтмол" />
          </dl>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15.5px]">
            {READY.map((f) => (
              <Feature key={f}>{f}</Feature>
            ))}
          </ul>
          <Link
            href="/templates"
            className="ax-btn ax-primary mt-auto inline-flex min-h-[52px] items-center gap-2.5 self-start rounded-xl bg-primary px-[22px] text-[15px] font-bold text-on-primary no-underline"
          >
            Загварууд үзэх
            <span className="ax-arrow">
              <ArrowRight size={18} />
            </span>
          </Link>
        </article>

        <article className="ax-reveal ax-card flex flex-col gap-[22px] rounded-[22px] border border-band bg-band p-[clamp(24px,3vw,40px)] text-on-band">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] font-extrabold tracking-[0.08em] text-lime uppercase">02</span>
            <span className="text-[13px] font-bold text-dark-muted">Жижиг бизнест</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[clamp(24px,2.4vw,32px)] leading-[1.18] font-extrabold tracking-[-0.02em]">
              Захиалгат веб сайт <span className="serif text-lime">хийлгэх</span>
            </h3>
            <p className="text-base leading-relaxed text-dark-muted">
              Танилцуулга, меню, онлайн дэлгүүр, цаг захиалга — бизнесийнхээ хэрэгцээнд тааруулж хийлгэнэ.
            </p>
          </div>
          <dl className="m-0 grid grid-cols-2 gap-2.5">
            <Meta label="Хугацаа" value="Ажлын хүрээгээр" dark />
            <Meta label="Үнэ" value="Үнийн саналаар" dark />
          </dl>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15.5px]">
            {CUSTOM.map((f) => (
              <Feature key={f} dark>
                {f}
              </Feature>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap gap-2.5">
            <Link
              href="/order"
              className="ax-btn ax-lime inline-flex min-h-[52px] items-center gap-2.5 rounded-xl bg-lime px-[22px] text-[15px] font-extrabold text-on-lime no-underline"
            >
              Веб сайт захиалах
              <span className="ax-arrow">
                <ArrowRight size={18} />
              </span>
            </Link>
            <Link
              href="/builder"
              className="ax-btn inline-flex min-h-[52px] items-center rounded-xl border border-dark-line-2 px-[18px] text-[15px] font-bold text-on-band no-underline"
            >
              Эхлээд загварчлах
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
