import { z } from "zod";
import { rateLimit } from "@/lib/server/http";
import { isBackendConfigured } from "@/lib/supabase/server";
import { secureEqual } from "@/lib/ecosystem/security";
import { billingDto } from "@/lib/ecosystem/read";
import { failure, serviceDb } from "@/lib/ecosystem/http";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  try {
    const token = process.env.AXORA_DASHBOARD_BILLING_TOKEN;
    if (
      !token ||
      token.length < 32 ||
      !secureEqual(
        request.headers.get("authorization") || "",
        "Bearer " + token,
      )
    )
      return Response.json(
        { ok: false, code: "unauthorized" },
        { status: 401 },
      );
    if (!isBackendConfigured())
      return Response.json(
        { ok: false, code: "backend_unconfigured" },
        { status: 503 },
      );
    const site = z
      .string()
      .uuid()
      .parse((await params).siteId);
    const db = serviceDb();
    const grant = await db
      .from("ecosystem_billing_grants")
      .select("site_id")
      .eq("site_id", site)
      .eq("client_id", "dashboard")
      .maybeSingle();
    if (grant.error || !grant.data)
      return Response.json(
        { ok: false, code: "site_forbidden" },
        { status: 403 },
      );
    if (!(await rateLimit(request, "ecosystem-billing", 120, 60)))
      return Response.json(
        { ok: false, code: "rate_limited" },
        { status: 429 },
      );
    return Response.json(await billingDto(db, site), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
