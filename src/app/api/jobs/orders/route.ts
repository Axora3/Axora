import { flushOrderEmails } from "@/lib/order-workflow/email";
import { secureEqual } from "@/lib/ecosystem/security";
import { recoverPendingQuotations } from "@/lib/order-workflow/recovery";
export async function POST(request: Request) {
  const secret = process.env.AXORA_ECOSYSTEM_JOB_SECRET;
  if (
    !secret ||
    secret.length < 32 ||
    !secureEqual(request.headers.get("authorization") ?? "", "Bearer " + secret)
  )
    return Response.json({ ok: false }, { status: 401 });
  try {
    const quotations = await recoverPendingQuotations(10);
    return Response.json(
      { ok: true, quotations, ...(await flushOrderEmails(10)) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
