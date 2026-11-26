import { Suspense } from "react";
import { NotificationPreferences } from "@/components/admin/NotificationPreferences";
import { AdminPageSkeleton } from "@/components/admin/PageSkeleton";
import { SignOutButton } from "@/components/admin/AdminShell";
import { Body, PageHeader, Panel, btn } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { fmtDateTime } from "@/lib/admin/labels";
import { isBackendConfigured } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { WorkflowSettings } from "@/components/admin/WorkflowSettings";
import {
  bankSchema,
  workflowSettingsSchema,
} from "@/lib/order-workflow/contracts";
import { parseContent } from "@/lib/content/schema";
import { isEmailConfigured } from "@/lib/server/email";

export const metadata = { title: "Тохиргоо" };

async function SettingsPageContent() {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const { user, db } = c.ctx;
  const { data: workflowSettings } = await db
    .from("website_workflow_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  const { data: site } = await db
    .from("site_content")
    .select("published")
    .eq("key", "site")
    .maybeSingle();
  const { bank } = parseContent(site?.published ?? {});
  const verifiedBank = bankSchema.safeParse(workflowSettings?.verified_bank);
  const policy = workflowSettings
    ? workflowSettingsSchema.safeParse({
        pricing: workflowSettings.pricing,
        scheduling: workflowSettings.scheduling,
        bank,
        bankVerified:
          verifiedBank.success &&
          verifiedBank.data.name === bank.name &&
          verifiedBank.data.holder === bank.holder &&
          verifiedBank.data.account === bank.account,
        bankInstructions: workflowSettings.bank_instructions,
      })
    : null;
  const { error: databaseError } = await db
    .from("website_orders")
    .select("id", { head: true, count: "exact" });
  const rows: [string, string][] = [
    ["Supabase (нийтийн түлхүүр)", "Холбогдсон"],
    [
      "Өгөгдлийн сан (захиалга унших)",
      databaseError
        ? "Унших шалгалт амжилтгүй — холболт, migration болон эрхийг шалгана уу"
        : "Унших шалгалт амжилттай",
    ],
    [
      "Серверийн түлхүүр (захиалга хүлээн авах)",
      isBackendConfigured()
        ? "Тохируулсан"
        : "Тохируулаагүй — сайтын анкет туршилтын горимд байна",
    ],
    [
      "Захиалгын имэйл",
      isEmailConfigured() &&
      /^https?:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL ?? "")
        ? "SMTP болон tracking origin тохируулсан — provider хүлээн авсан төлөв нь inbox хүргэлтийн баталгаа биш"
        : "SMTP эсвэл NEXT_PUBLIC_SITE_URL дутуу — имэйлүүд дараалалд хадгалагдана",
    ],
    ["Төлбөрийн систем", "Холбогдоогүй — төлбөрийн төлөв автоматаар үүсдэггүй"],
  ];
  return (
    <>
      <PageHeader
        title="Тохиргоо"
        description="Бүртгэл болон холболтын төлөв. Нууц түлхүүр энд харагдахгүй."
      />
      <Body>
        <Panel
          title="Веб хөгжүүлэлтийн үнэ, хугацаа, банк"
          id="order-workflow-settings"
        >
          {policy?.success && workflowSettings ? (
            <WorkflowSettings
              initial={policy.data}
              version={workflowSettings.version}
            />
          ) : (
            <p className="p-5 text-sm">
              20261125000000_order_workflow.sql migration-ийг шалгаж
              хэрэгжүүлсний дараа тохиргоо нээгдэнэ.
            </p>
          )}
        </Panel>
        <Panel title="Мэдэгдлийн тохиргоо" id="notification-preferences">
          <NotificationPreferences />
        </Panel>
        <Panel title="Өнгөний горим">
          <div className="flex items-center justify-between gap-3 p-[18px]">
            <p className="text-sm text-muted">
              Цайвар, бараан эсвэл төхөөрөмжийн горимыг сонгоно. Энэ төхөөрөмжид
              хадгалагдана.
            </p>
            <ThemeToggle />
          </div>
        </Panel>
        <Panel title="Таны бүртгэл" id="st-acc">
          <dl className="m-0 flex flex-col gap-2 p-[18px] text-[15px]">
            <div>
              <dt className="text-sm font-bold text-muted">Имэйл</dt>
              <dd className="m-0 font-bold">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-muted">Эрх</dt>
              <dd className="m-0">
                Админ (серверийн admin_users бүртгэлээр баталгаажсан)
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-muted">Сүүлд нэвтэрсэн</dt>
              <dd className="m-0">{fmtDateTime(user.last_sign_in_at)}</dd>
            </div>
          </dl>
          <div className="border-t border-soft p-[18px]">
            <SignOutButton className={btn.ghost} />
          </div>
        </Panel>
        <Panel title="Холболтууд" id="st-conn">
          <dl className="m-0 px-[18px] py-2">
            {rows.map(([k, v]) => (
              <div
                key={k}
                className="grid gap-1 border-b border-soft py-2.5 last:border-b-0 [grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))]"
              >
                <dt className="text-sm font-bold text-muted">{k}</dt>
                <dd className="m-0 text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Админ нэмэх" id="st-admin">
          <div className="flex flex-col gap-2 p-[18px] text-[15px] leading-relaxed">
            <p>
              Аюулгүй байдлын үүднээс админ эрхийг энэ самбараас олгохгүй. Шинэ
              админ нэмэхдээ:
            </p>
            <ol className="m-0 list-decimal pl-5">
              <li>
                Supabase Dashboard → Authentication → Users хэсэгт хэрэглэгч
                үүсгэнэ (нийтийн бүртгэл хаалттай байна).
              </li>
              <li>
                Төслийн хавтсанд{" "}
                <code className="rounded bg-soft px-1">
                  node --env-file=.env.local scripts/grant-admin.mjs имэйл@хаяг
                </code>{" "}
                ажиллуулна.
              </li>
            </ol>
          </div>
        </Panel>
      </Body>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <SettingsPageContent />
    </Suspense>
  );
}
