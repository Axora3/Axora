import { Suspense } from "react";
import { requireAdminPage } from "@/lib/admin/auth";
import { EcosystemConsole } from "@/components/ecosystem/EcosystemConsole";
import { summary } from "@/lib/ecosystem/read";
import { safeCode } from "@/lib/ecosystem/security";
export const metadata = { title: "AXORA экосистем" };
async function Content() {
  const auth = await requireAdminPage();
  if (auth.kind !== "ok") return null;
  let initial: null | Awaited<ReturnType<typeof summary>> = null;
  let error: string | undefined;
  try {
    initial = await summary(auth.ctx.db);
  } catch (e) {
    error = safeCode(e);
  }
  return <EcosystemConsole initial={initial} error={error} />;
}
export default function EcosystemPage() {
  return (
    <Suspense
      fallback={
        <p className="p-8" role="status">
          Экосистемийн бодит мэдээлэл ачаалж байна…
        </p>
      }
    >
      <Content />
    </Suspense>
  );
}
