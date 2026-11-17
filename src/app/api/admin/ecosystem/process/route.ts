import { adminGuard } from "@/lib/ecosystem/admin-http";
import { failure } from "@/lib/ecosystem/http";
import { EcosystemProcessor } from "@/lib/ecosystem/processor";
export async function POST(request: Request) {
  try {
    await adminGuard(request, true);
    return Response.json(
      { ok: true, ...(await new EcosystemProcessor().tick()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
