import Link from "next/link";
import { SearchEmpty } from "@/components/icons";

export default function TemplateNotFound() {
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-[18px] border border-dashed border-line-mid bg-surface px-6 py-[clamp(32px,6vw,72px)] text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-soft text-brand">
        <SearchEmpty size={24} />
      </span>
      <h1 className="text-[26px] font-extrabold">Загвар олдсонгүй</h1>
      <p className="max-w-[28em] text-base leading-relaxed text-muted">Энэ холбоосоор загвар байхгүй, эсвэл одоогоор нийтлэгдээгүй байна.</p>
      <Link href="/templates" className="ax-btn ax-primary inline-flex min-h-12 items-center rounded-xl bg-primary px-5 text-[15px] font-bold text-on-primary no-underline">
        Бүх загвар үзэх
      </Link>
    </div>
  );
}
