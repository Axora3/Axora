import { Suspense } from "react";
import Link from "next/link";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { Body, EmptyState, LoadFailed, Notice, PageHeader, Pagination, Panel, PaymentPill, btn, field } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { isMissingMigration, MIGRATION_HINT } from "@/lib/admin/db-errors";
import { fmtDateTime, shortId } from "@/lib/admin/labels";
import { PAGE_SIZE, hrefWith, one, page as pageOf, safeSearch } from "@/lib/admin/query";
import { dateBounds } from "@/lib/admin/dates";
import { formatPrice } from "@/lib/templates/types";

export const metadata = { title: "Төлбөрийн бүртгэл" };
const FILTERS = [["", "Бүгд"], ["pending", "Хүлээгдэж буй"], ["needs_review", "Шалгах"], ["confirmed_manual", "Гараар баталгаажсан"], ["not_required", "Төлбөргүй"]] as const;
type PaymentRow = { id: string; customer_name: string; status: string; created_at: string; payment_status: string; payment_confirmed_at: string | null; payment_confirmed_by: string | null; payment_confirmed_amount: number | null; payment_confirmed_currency: string | null; payment_amount_source: string | null; price_snapshot: number | null; currency_snapshot: string | null; is_free_snapshot: boolean | null; templates: { title: string } | null };

type Search = Record<string, string | string[] | undefined>;
async function PaymentsContent({ searchParams }: { searchParams: Promise<Search> }) {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const sp = await searchParams;
  const q = safeSearch(one(sp,"q"));
  const filter = FILTERS.some(([value]) => value && value === one(sp,"status")) ? one(sp,"status") : "";
  const page = pageOf(sp);
  const cancelled = one(sp,"cancelled") === "yes";
  const dates = dateBounds(one(sp,"from"), one(sp,"to"));
  const { db } = c.ctx;
  const columns = "id, customer_name, status, created_at, payment_status, payment_confirmed_at, payment_confirmed_by, payment_confirmed_amount, payment_confirmed_currency, payment_amount_source, price_snapshot, currency_snapshot, is_free_snapshot, templates(title)";
  let query = db.from("template_requests").select(columns, {count:"exact"});
  if (q) query = query.or(`customer_name.ilike.*${q}*,contact_value.ilike.*${q}*`);
  if (filter) query = query.eq("payment_status", filter);
  if (cancelled) query = query.eq("status", "cancelled");
  if (dates.from) query = query.gte("created_at", dates.from);
  if (dates.to) query = query.lt("created_at", dates.to);
  const {data,count,error} = await query.order("created_at",{ascending:false}).range((page-1)*PAGE_SIZE,page*PAGE_SIZE-1);
  const migrationMissing = isMissingMigration(error);
  const head = {count:"exact" as const,head:true};
  const counts = migrationMissing ? [] : await Promise.all(FILTERS.slice(1).map(([status]) => db.from("template_requests").select("id",head).eq("payment_status",status)));
  const rows = (data??[]) as unknown as PaymentRow[];
  const anyFilter = !!(q||filter||cancelled||dates.from||dates.to);
  return <>
    <PageHeader title="Төлбөрийн бүртгэл" description="Template хүсэлтэд хадгалсан төлбөрийн төлөв. Банк, төлбөрийн gateway холбогдоогүй; баталгаажуулалтыг админ гараар хийдэг.">
      <form method="get" role="search" className="flex flex-wrap gap-2" aria-label="Төлбөрийн хүсэлт хайх">
        {filter && <input type="hidden" name="status" value={filter}/>}
        <label className="sr-only" htmlFor="payment-q">Захиалагч эсвэл холбоо барих утгаар хайх</label><input id="payment-q" name="q" type="search" defaultValue={one(sp,"q")} placeholder="Захиалагч, холбоо барих…" className={`${field.input} min-h-12 rounded-[13px] bg-surface`}/><label className="flex flex-col gap-1 text-xs font-bold">Эхлэх өдөр<input name="from" type="date" defaultValue={one(sp,"from")} className={field.input}/></label><label className="flex flex-col gap-1 text-xs font-bold">Дуусах өдөр<input name="to" type="date" defaultValue={one(sp,"to")} className={field.input}/></label><label className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="cancelled" value="yes" defaultChecked={cancelled}/>Цуцалсан хүсэлтүүд</label><button className={btn.primary}>Хайх</button>
      </form>
      <nav aria-label="Төлбөрийн төлөв" className="ax-scroll gap-1.5">{FILTERS.map(([status,label],i)=><Link key={status||"all"} href={hrefWith("/admin/payments",sp,{status:status||null,page:null})} aria-current={filter===status?"page":undefined} className={`${btn.ghost} shrink-0`}>{label}{status&&counts[i-1]?.count!=null?` · ${counts[i-1].count}`:""}</Link>)}</nav>
    </PageHeader>
    <Body>
      {migrationMissing && <Notice tone="warn">{MIGRATION_HINT}</Notice>}
      {error && !migrationMissing ? <LoadFailed what="төлбөрийн төлөвүүдийг"/> : migrationMissing ? <Panel><EmptyState title="Төлбөрийн бүртгэл хараахан идэвхжээгүй" text="Төлбөрийн migration ажилласны дараа бодит хүсэлтийн төлөв энд харагдана." action={<Link href="/admin/template-requests" className={btn.ghost}>Template хүсэлтүүд</Link>}/></Panel> : !rows.length ? <Panel><EmptyState title={anyFilter?"Тохирох бүртгэл олдсонгүй":"Төлбөрийн хүсэлт алга"} text={anyFilter?undefined:"Төлбөртэй болон үнэгүй template хүсэлтүүдийн бодит бүртгэл энд харагдана."}/></Panel> : <>
        <p className="text-sm font-bold text-muted">{count??0} хүсэлтийн төлбөрийн төлөв{anyFilter&&<> · <Link href="/admin/payments">Цэвэрлэх</Link></>}</p>
        <Panel><ul className="m-0 list-none p-0">{rows.map((r)=><li key={r.id} className="flex flex-col gap-3 border-t border-soft p-4 first:border-t-0 min-[700px]:flex-row min-[700px]:items-center">
          <div className="flex min-w-0 flex-1 flex-col gap-1"><strong className="truncate">{r.templates?.title??"Загварын хүсэлт"} · {r.customer_name}</strong><span className="text-xs text-muted">{shortId(r.id)} · хүсэлт {fmtDateTime(r.created_at)}{r.status==="cancelled"?" · цуцалсан":""}</span>
            {r.payment_status==="confirmed_manual" ? <span className="text-sm">Гараар баталгаажсан дүн: <strong>{r.payment_confirmed_amount!=null&&r.payment_confirmed_currency ? formatPrice({isFree:false,price:Number(r.payment_confirmed_amount),currency:r.payment_confirmed_currency}) : "дүн тэмдэглэгдээгүй"}</strong>{r.payment_confirmed_at?` · ${fmtDateTime(r.payment_confirmed_at)}`:""}{r.payment_confirmed_by?` · админ ${r.payment_confirmed_by.slice(0,6)}`:""}</span> : <span className="text-sm text-muted">Хүсэлтийн үнэ: {r.price_snapshot!=null&&r.currency_snapshot ? formatPrice({isFree:!!r.is_free_snapshot,price:Number(r.price_snapshot),currency:r.currency_snapshot}) : "хадгалагдаагүй"}</span>}
          </div><PaymentPill status={r.payment_status}/><Link href={`/admin/template-requests/${r.id}`} className={btn.ghost}>Дэлгэрэнгүй</Link>
        </li>)}</ul><Pagination page={page} pages={Math.max(1,Math.ceil((count??0)/PAGE_SIZE))} total={count??0} makeHref={(p)=>hrefWith("/admin/payments",sp,{page:p})}/></Panel>
        <Notice>Төлбөрийн арга, банкны гүйлгээний дугаар энэ системд хадгалагддаггүй. “Гараар баталгаажсан” төлөв нь админы тэмдэглэл бөгөөд банкнаас автоматаар шалгасан гэсэн үг биш. Нийт орлого гэж тооцоолох дүн энд харуулахгүй.</Notice>
      </>}
    </Body>
  </>;
}

export default function PaymentsPage(props: { searchParams: Promise<Search> }) { return <Suspense fallback={<AdminPageSkeleton/>}><PaymentsContent {...props}/></Suspense>; }
