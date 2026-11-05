import { shortId } from "@/lib/admin/labels";
import { contactError, optionalContactError, templateRequestSchema } from "@/lib/requests/validation";
import { idempotentInsert } from "@/lib/server/idempotent-insert";
import { MESSAGES, canonical, fail, looksLikeSpam, ok, rateLimit, readJson, sha256 } from "@/lib/server/http";
import { adminClient, isBackendConfigured } from "@/lib/supabase/server";

/**
 * Template purchase request. Stores a request only — it never grants a download
 * or confirms a payment; an admin confirms payment by hand. The template is resolved on the server; price and
 * status are never taken from the browser.
 */
export async function POST(req: Request) {
  if (!isBackendConfigured()) return fail(503, "not_configured", MESSAGES.notConfigured);
  const body = await readJson(req, 16 * 1024);
  if (!body.ok) return body.res;
  const parsed = templateRequestSchema.safeParse(body.data);
  if (!parsed.success) return fail(400, "invalid", "Мэдээллийн бүтэц буруу байна.");
  const input = parsed.data;

  if (looksLikeSpam(input.meta, 2500)) return fail(400, "rejected", MESSAGES.spam);
  if (!(await rateLimit(req, "template-requests", 10, 600))) return fail(429, "rate_limited", MESSAGES.rateLimited);

  for (const [id, message] of [["email", contactError("email", input.email)], ["phone", optionalContactError("phone", input.phone)], ["messenger", optionalContactError("messenger", input.messenger)]]) {
    if (message) return fail(422, "validation", message, { fieldErrors: [{ id, message }] });
  }

  const { data: tpl, error } = await adminClient()
    .from("templates")
    .select("id")
    .eq("slug", input.slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) return fail(500, "server", MESSAGES.server);
  if (!tpl) return fail(404, "not_found", "Энэ загвар олдсонгүй эсвэл одоогоор боломжгүй байна.");

  const payload = { template_id: tpl.id, name: input.name, email: input.email, phone: input.phone, messenger: input.messenger, note: input.note };
  const res = await idempotentInsert("template_requests", {
    idempotency_key: input.idempotencyKey,
    payload_hash: sha256(canonical(payload)),
    template_id: tpl.id,
    customer_name: input.name,
    // The download link goes to this address, so email is always the contact.
    contact_channel: "email",
    contact_value: input.email,
    ...(input.phone ? { customer_phone: input.phone } : {}),
    ...(input.messenger ? { customer_messenger: input.messenger } : {}),
    note: input.note || null,
  });
  if (res.kind === "conflict") return fail(409, "conflict", MESSAGES.conflict);
  if (res.kind === "error") return fail(500, "server", MESSAGES.server);
  const { data: saved } = await adminClient().from("template_requests").select("id").eq("idempotency_key", input.idempotencyKey).maybeSingle();
  return ok({ status: res.kind, reference: saved ? shortId(saved.id) : null }, res.kind === "created" ? 201 : 200);
}
