import { z } from "zod";
import { BUSINESS_TYPES, PALETTE_IDS, STYLE_IDS } from "@/lib/builder/config";
import { MAX_FILE_BYTES, MAX_FILES_PER_FIELD } from "./attachments";
import { FILE_FIELDS } from "./questions";

/** Bumped whenever the consent wording on the form changes. */
export const CONSENT_TEXT_VERSION = "2026-10-processing-v1";
export const ANSWERS_SCHEMA_VERSION = 1;
export const BUILDER_SCHEMA_VERSION = 1;

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const metaSchema = z.object({
  website: z.string().max(200).optional().default(""),
  startedAt: z.number().int().positive(),
});

export const builderSnapshotSchema = z.object({
  v: z.literal(1),
  type: z.enum(BUSINESS_TYPES),
  style: z.enum(STYLE_IDS),
  palette: z.union([z.enum(PALETTE_IDS), z.literal("custom")]),
  colors: z.object({ primary: hex, secondary: hex, bg: hex }),
  name: z.string().max(40),
  headline: z.string().max(70),
  desc: z.string().max(160),
  cta: z.string().max(24),
});
export type BuilderSnapshot = z.infer<typeof builderSnapshotSchema>;

export const attachmentManifestSchema = z.object({
  clientRef: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  field: z.enum(FILE_FIELDS),
  name: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
});
export type AttachmentManifest = z.infer<typeof attachmentManifestSchema>;

const answerValue = z.union([z.string().max(6000), z.array(z.string().max(300)).max(20), z.boolean()]);

export const orderSubmissionSchema = z
  .object({
    idempotencyKey: z.uuid(),
    answers: z.record(z.string().max(16), answerValue),
    builder: builderSnapshotSchema.nullable(),
    attachments: z.array(attachmentManifestSchema).max(MAX_FILES_PER_FIELD * FILE_FIELDS.length),
    meta: metaSchema,
  })
  .refine((o) => FILE_FIELDS.every((f) => o.attachments.filter((a) => a.field === f).length <= MAX_FILES_PER_FIELD), {
    message: "too_many_files",
  })
  .refine((o) => new Set(o.attachments.map((a) => a.clientRef)).size === o.attachments.length, { message: "duplicate_ref" });
export type OrderSubmission = z.infer<typeof orderSubmissionSchema>;

/** What the order endpoint returns — no personal data, just what the browser needs to finish uploads. */
export type UploadTicket = { attachmentId: string; clientRef: string; path: string; token: string | null; status: string };
export type OrderResponse =
  | { ok: true; status: "created" | "duplicate"; reference: string; orderId: string; uploadGrant: string; uploads: UploadTicket[] }
  | { ok: false; code: string; message: string; fieldErrors?: { id: string; message: string }[] };
