import { contactMessageSchema, phoneOrEmailError } from "@/lib/requests/validation";
import { idempotentInsert } from "@/lib/server/idempotent-insert";
import { MESSAGES, canonical, fail, looksLikeSpam, ok, rateLimit, readJson, sha256 } from "@/lib/server/http";
import { isBackendConfigured } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (!isBackendConfigured()) return fail(503, "not_configured", MESSAGES.notConfigured);
  const body = await readJson(req, 16 * 1024);
  if (!body.ok) return body.res;
  const parsed = contactMessageSchema.safeParse(body.data);
  if (!parsed.success) return fail(400, "invalid", "Мэдээллийн бүтэц буруу байна.");
  const input = parsed.data;

  if (looksLikeSpam(input.meta, 2500)) return fail(400, "rejected", MESSAGES.spam);
  if (!(await rateLimit(req, "contact", 5, 600))) return fail(429, "rate_limited", MESSAGES.rateLimited);

  const cErr = phoneOrEmailError(input.contact);
  if (cErr) return fail(422, "validation", cErr, { fieldErrors: [{ id: "contact", message: cErr }] });

  const res = await idempotentInsert("contact_messages", {
    idempotency_key: input.idempotencyKey,
    payload_hash: sha256(canonical({ name: input.name, contact: input.contact, message: input.message })),
    name: input.name,
    contact: input.contact,
    message: input.message,
  });
  if (res.kind === "conflict") return fail(409, "conflict", MESSAGES.conflict);
  if (res.kind === "error") return fail(500, "server", MESSAGES.server);
  return ok({ status: res.kind }, res.kind === "created" ? 201 : 200);
}
