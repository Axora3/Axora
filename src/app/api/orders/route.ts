import { TYPES, STYLES } from "@/lib/builder/config";
import { EXT_TO_MIME, extOf } from "@/lib/order/attachments";
import { ANSWERS_SCHEMA_VERSION, BUILDER_SCHEMA_VERSION, CONSENT_TEXT_VERSION, orderSubmissionSchema, type UploadTicket } from "@/lib/order/schema";
import { ALL_FIELDS, allErrors, formatAnswer, preferredChannel, sanitizeAnswers, type Answers } from "@/lib/order/questions";
import { MESSAGES, canonical, fail, looksLikeSpam, newGrant, ok, rateLimit, readJson, sha256 } from "@/lib/server/http";
import { BUCKETS, adminClient, isBackendConfigured } from "@/lib/supabase/server";

const GRANT_TTL_MS = 24 * 60 * 60 * 1000;

type RpcAttachment = { id: string; client_ref: string; storage_path: string; upload_status: string };
type RpcResult =
  | { status: "created" | "duplicate"; order_id: string; reference: string; attachments: RpcAttachment[] }
  | { status: "conflict" };

const field = (id: string) => ALL_FIELDS.find((f) => f.id === id)!;

export async function POST(req: Request) {
  if (!isBackendConfigured()) return fail(503, "not_configured", MESSAGES.notConfigured);

  const body = await readJson(req, 200 * 1024);
  if (!body.ok) return body.res;

  const parsed = orderSubmissionSchema.safeParse(body.data);
  if (!parsed.success) return fail(400, "invalid", "Мэдээллийн бүтэц буруу байна. Хуудсыг дахин ачаалаад оролдоно уу.");
  const input = parsed.data;

  if (looksLikeSpam(input.meta, 5000)) return fail(400, "rejected", MESSAGES.spam);
  if (!(await rateLimit(req, "orders", 5, 600))) return fail(429, "rate_limited", MESSAGES.rateLimited);

  // Same rules as the browser: required, conditional, option lists, formats.
  const raw = input.answers as Answers;
  const errors = allErrors(raw);
  if (errors.length) {
    return fail(422, "validation", "Зарим талбарт засвар хэрэгтэй.", {
      fieldErrors: errors.flatMap((s) => s.errors.map((e) => ({ id: e.field.id, step: s.step, message: e.message }))),
    });
  }
  const answers = sanitizeAnswers(raw);

  // Attachment manifest → server-chosen MIME type from the extension
  // (the browser-reported type is ignored; bytes are checked after upload).
  const atts = [];
  for (const a of input.attachments) {
    const ext = extOf(a.name);
    if (!ext) return fail(422, "file_type", `${a.name} — зөвшөөрөгдөөгүй файлын төрөл.`);
    atts.push({ field: a.field, client_ref: a.clientRef, original_name: a.name, size_bytes: a.size, ext, mime_type: EXT_TO_MIME[ext] });
  }

  const b = input.builder;
  const payloadHash = sha256(canonical({ answers, builder: b, attachments: atts }));
  const grant = newGrant();

  const order = {
    idempotency_key: input.idempotencyKey,
    payload_hash: payloadHash,
    full_name: answers.q1,
    email: answers.q5,
    phone: answers.q4,
    business_name: answers.q2,
    website_type: formatAnswer(field("q12"), answers) || null,
    design_style: (answers.q19 as string) || null,
    preferred_channel: preferredChannel(answers),
    timeline: (answers.q34 as string) || null,
    budget: (answers.q35 as string) || null,
    answers: { schema_version: ANSWERS_SCHEMA_VERSION, ...answers },
    answers_schema_version: ANSWERS_SCHEMA_VERSION,
    builder_type: b?.type ?? null,
    builder_style: b?.style ?? null,
    builder_palette: b?.palette ?? null,
    builder_primary: b?.colors.primary.toUpperCase() ?? null,
    builder_secondary: b?.colors.secondary.toUpperCase() ?? null,
    builder_bg: b?.colors.bg.toUpperCase() ?? null,
    builder_name: b?.name ?? null,
    builder_headline: b?.headline ?? null,
    builder_description: b?.desc ?? null,
    builder_cta: b?.cta ?? null,
    builder_config: b
      ? { schema_version: BUILDER_SCHEMA_VERSION, ...b, type_label: TYPES[b.type].label, style_label: STYLES[b.style].label }
      : null,
    consent_text_version: CONSENT_TEXT_VERSION,
  };

  const db = adminClient();
  const { data, error } = await db.rpc("create_website_order", {
    p_order: order,
    p_attachments: atts,
    p_grant_hash: grant.hash,
    p_grant_expires: new Date(Date.now() + GRANT_TTL_MS).toISOString(),
  });
  if (error || !data) {
    console.error("[orders] create failed:", error?.code);
    return fail(500, "server", MESSAGES.server);
  }
  const result = data as RpcResult;
  if (result.status === "conflict") return fail(409, "conflict", MESSAGES.conflict);

  // One signed upload URL per still-missing file, bound to its random path.
  const uploads: UploadTicket[] = await Promise.all(
    result.attachments.map(async (a): Promise<UploadTicket> => {
      if (a.upload_status === "uploaded") return { attachmentId: a.id, clientRef: a.client_ref, path: a.storage_path, token: null, status: "uploaded" };
      const { data: signed, error: e } = await db.storage.from(BUCKETS.attachments).createSignedUploadUrl(a.storage_path);
      if (e) console.error("[orders] signed upload url failed:", e.message);
      return { attachmentId: a.id, clientRef: a.client_ref, path: a.storage_path, token: signed?.token ?? null, status: a.upload_status };
    }),
  );

  return ok(
    { status: result.status, reference: result.reference, orderId: result.order_id, uploadGrant: grant.token, uploads },
    result.status === "created" ? 201 : 200,
  );
}
