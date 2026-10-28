import { SignOutButton } from "@/components/admin/AdminShell";
import { Body, PageHeader, Panel, btn } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { fmtDateTime } from "@/lib/admin/labels";
import { isBackendConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Тохиргоо" };

export default async function SettingsPage() {
  const c = await requireAdminPage();
  if (c.kind !== "ok") return null;
  const { user } = c.ctx;
  const rows: [string, string][] = [
    ["Supabase (нийтийн түлхүүр)", "Холбогдсон"],
    ["Серверийн түлхүүр (захиалга хүлээн авах)", isBackendConfigured() ? "Тохируулсан" : "Тохируулаагүй — сайтын анкет туршилтын горимд байна"],
    ["Имэйл / SMS илгээх үйлчилгээ", "Холбогдоогүй — систем мессеж илгээдэггүй"],
    ["Төлбөрийн систем", "Холбогдоогүй — төлбөрийн төлөв автоматаар үүсдэггүй"],
  ];
  return (
    <>
      <PageHeader title="Тохиргоо" description="Бүртгэл болон холболтын төлөв. Нууц түлхүүр энд харагдахгүй." />
      <Body>
        <Panel title="Таны бүртгэл" id="st-acc">
          <dl className="m-0 flex flex-col gap-2 p-[18px] text-[15px]">
            <div>
              <dt className="text-sm font-bold text-muted">Имэйл</dt>
              <dd className="m-0 font-bold">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-muted">Эрх</dt>
              <dd className="m-0">Админ (серверийн admin_users бүртгэлээр баталгаажсан)</dd>
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
              <div key={k} className="grid gap-1 border-b border-soft py-2.5 last:border-b-0 [grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))]">
                <dt className="text-sm font-bold text-muted">{k}</dt>
                <dd className="m-0 text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Админ нэмэх" id="st-admin">
          <div className="flex flex-col gap-2 p-[18px] text-[15px] leading-relaxed">
            <p>Аюулгүй байдлын үүднээс админ эрхийг энэ самбараас олгохгүй. Шинэ админ нэмэхдээ:</p>
            <ol className="m-0 list-decimal pl-5">
              <li>Supabase Dashboard → Authentication → Users хэсэгт хэрэглэгч үүсгэнэ (нийтийн бүртгэл хаалттай байна).</li>
              <li>
                Төслийн хавтсанд <code className="rounded bg-soft px-1">node --env-file=.env.local scripts/grant-admin.mjs имэйл@хаяг</code> ажиллуулна.
              </li>
            </ol>
          </div>
        </Panel>
      </Body>
    </>
  );
}
