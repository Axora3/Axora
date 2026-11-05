import Link from "next/link";
import { Chat } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";

/** Reviews and delivered work appear only once they are real and approved, so this stays a plain statement. */
export function Trust() {
  return (
    <section aria-labelledby="trust-title" className="ax-container pb-[var(--ax-space-section)]">
      <div className="ax-reveal ax-surface flex flex-wrap items-center justify-between gap-5 p-[clamp(20px,3vw,32px)]">
        <div className="flex max-w-[720px] items-start gap-4">
          <span aria-hidden="true" className="ax-stat-icon h-11 w-11 rounded-control">
            <Chat size={22} />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 id="trust-title" className="ax-h3">
              Хэрэглэгчид ба <span className="serif">хийсэн ажил</span>
            </h2>
            <p className="text-[15px] leading-relaxed text-muted">Зөвхөн бодит хэрэглэгчийн зөвшөөрөлтэй сэтгэгдэл, хүлээлгэн өгсөн төслийг энд нийтэлнэ.</p>
          </div>
        </div>
        <Link href="/portfolio" className={buttonStyles("secondary")}>
          Портфолио үзэх
        </Link>
      </div>
    </section>
  );
}
