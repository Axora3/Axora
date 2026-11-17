import "server-only";
import { checkAdmin } from "@/lib/admin/auth";
import { isBackendConfigured } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/server/http";
import { IntegrationError } from "./contracts";
export async function adminGuard(request: Request, write = false) {
  const auth = await checkAdmin();
  if (auth.kind !== "ok")
    throw new IntegrationError(
      "admin_required",
      auth.kind === "anon" ? 401 : 403,
    );
  if (write) {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin)
      throw new IntegrationError("origin_forbidden", 403);
  }
  if (!isBackendConfigured())
    throw new IntegrationError("backend_unconfigured");
  if (
    !(await rateLimit(request, "ecosystem-admin:" + auth.ctx.user.id, 60, 60))
  )
    throw new IntegrationError("rate_limited", 429);
  return auth.ctx;
}
