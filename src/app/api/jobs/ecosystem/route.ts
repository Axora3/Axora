import { isBackendConfigured } from "@/lib/supabase/server";
import { EcosystemProcessor } from "@/lib/ecosystem/processor";
import { secureEqual } from "@/lib/ecosystem/security";
import { failure } from "@/lib/ecosystem/http";
export async function POST(request: Request) {
  const secret = process.env.AXORA_ECOSYSTEM_JOB_SECRET;
  if (
    !secret ||
    secret.length < 32 ||
    !secureEqual(request.headers.get("authorization") || "", "Bearer " + secret)
  )
    return Response.json({ ok: false, code: "unauthorized" }, { status: 401 });
  if (!isBackendConfigured())
    return Response.json(
      { ok: false, code: "backend_unconfigured" },
      { status: 503 },
    );
  try {
    return Response.json(
      { ok: true, ...(await new EcosystemProcessor().tick()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
