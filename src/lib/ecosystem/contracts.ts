import { z } from "zod";
export const businessTypes = [
  "online_store",
  "restaurant",
  "service_business",
  "business_profile",
  "portfolio",
] as const;
export const FactoryAnswers = z
  .object({
    siteId: z.string().min(8).max(128).optional(),
    businessType: z.enum(businessTypes).optional(),
    businessName: z.string().max(160).optional(),
    language: z.enum(["mn", "en"]).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(40).optional(),
    pages: z.array(z.string().max(100)).max(30).optional(),
    features: z
      .array(z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/))
      .max(40)
      .optional(),
    designStyle: z.enum(["minimal", "editorial", "bold", "warm"]).optional(),
    contentStatus: z.enum(["provided", "pending"]).optional(),
    content: z.record(z.string().max(100), z.string().max(50000)).optional(),
    logoUrl: z.string().url().optional(),
    dataBackend: z.enum(["google_sheets", "static"]).optional(),
    adapterOrigin: z.string().url().optional(),
    currency: z.literal("MNT").optional(),
    shippingMode: z.enum(["pickup", "delivery", "both"]).optional(),
    serviceArea: z.string().max(500).optional(),
    paymentProvider: z.enum(["cash", "bank", "qpay", "none"]).optional(),
    paymentAccountReference: z.string().max(160).optional(),
    reservationPolicy: z.string().max(2000).optional(),
    bookingPolicy: z.string().max(2000).optional(),
    timezone: z.string().max(80).optional(),
    domain: z.string().max(250).optional(),
    notes: z.string().max(4000).optional(),
  })
  .strict();
export const AdminCommand = z
  .object({
    action: z.enum([
      "register",
      "requirements",
      "prepare_site",
      "submit",
      "poll",
      "generate",
      "approve",
      "confirm",
      "provision_access",
      "retry_sheets",
      "invoice",
      "cancel",
      "resume",
      "policy",
      "retry_task",
    ]),
    siteId: z.string().uuid().optional(),
    key: z.string().uuid(),
    data: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();
export const FactoryOrder = z
  .object({
    id: z.string().uuid(),
    externalId: z.string(),
    answers: FactoryAnswers,
    analysis: z
      .object({
        spec: z.unknown().nullable(),
        missing: z.array(
          z.object({
            field: z.string(),
            code: z.string(),
            question: z.string().max(2000),
          }),
        ),
        matches: z.array(
          z.object({
            templateId: z.string(),
            score: z.number(),
            scores: z.record(z.string(), z.number()),
            reasons: z.array(z.string()),
          }),
        ),
      })
      .passthrough(),
  })
  .passthrough();
export const FactoryProject = z
  .object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    siteId: z.string(),
    status: z.enum([
      "queued",
      "cloning",
      "coding",
      "qa",
      "preview_pending",
      "awaiting_approval",
      "awaiting_delivery_confirmation",
      "delivered",
      "blocked",
      "failed",
    ]),
    sourceHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    commit: z
      .string()
      .regex(/^[a-f0-9]{40}$/)
      .nullable(),
    qa: z.unknown().nullable(),
    preview: z
      .object({
        id: z.string(),
        url: z.string().url().nullable(),
        sourceHash: z.string(),
        status: z.string(),
        accessibleAt: z.string().datetime().nullable(),
      })
      .nullable(),
    approval: z
      .object({
        actor: z.string(),
        sourceHash: z.string(),
        at: z.string().datetime(),
      })
      .nullable(),
    delivery: z
      .object({
        reference: z.string().min(8),
        actor: z.string(),
        at: z.string().datetime(),
      })
      .nullable(),
    lastError: z.string().nullable(),
    selection: z
      .object({
        template: z.object({ id: z.string(), name: z.string() }).strip(),
        provider: z.string(),
        design: z.object({ id: z.string() }).strip(),
      })
      .optional(),
  })
  .strip();
export type RemoteProject = z.infer<typeof FactoryProject>;
export interface Site {
  id: string;
  order_id: string;
  project_id: string | null;
  customer_id: string;
  business_type: string | null;
  enabled_modules: string[];
  factory_answers: Record<string, unknown>;
  requirements_version: number;
  factory_order_id: string | null;
  factory_project_id: string | null;
  factory_status: string;
  factory_options: Record<string, unknown>;
  factory_snapshot: Record<string, unknown>;
  dashboard_status: string;
  dashboard_user_id: string | null;
  sheets_status: string;
  last_successful_sync: string | null;
  confirmed_delivery_at: string | null;
  access_receipt: Record<string, unknown>;
  updated_at: string;
}
export interface Task {
  id: string;
  site_id: string;
  kind: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  lease_owner: string;
  request_key: string;
}
export const ProvisionReceipt = z
  .object({
    site_id: z.string().uuid(),
    customer_ref: z.string().uuid(),
    business_type: z.enum(businessTypes),
    enabled_modules: z.array(z.string()),
    status: z.enum(["ready", "pending", "failed"]),
    spreadsheet_id: z.string().min(1).optional(),
    integration_status: z.enum(["connected", "pending", "error"]),
    last_successful_sync: z.string().datetime().nullable(),
    configuration_version: z.number().int().positive(),
  })
  .strict();
export const AccessReceipt = z
  .object({
    site_id: z.string().uuid(),
    customer_ref: z.string().uuid(),
    dashboard_user_id: z.string().uuid().nullable(),
    status: z.enum(["active", "invited", "pending"]),
    identity_verified: z.boolean().optional(),
    customer_email: z.string().email().optional(),
    delivery_confirmed_at: z.string().datetime(),
  })
  .strict();
export class IntegrationError extends Error {
  constructor(
    public code: string,
    public status = 503,
    public retryable = false,
  ) {
    super(code);
    this.name = "IntegrationError";
  }
}
export const PaymentNotice = z
  .object({
    event_id: z.string().regex(/^[A-Za-z0-9_.:-]{1,160}$/),
    payment_id: z.string().regex(/^[A-Za-z0-9_-]{1,160}$/),
  })
  .strict();
export const VerifiedPayment = z
  .object({
    id: z.string(),
    invoice_reference: z.string(),
    merchant_id: z.string(),
    status: z.enum(["paid", "pending", "failed", "refunded"]),
    amount: z.number().int().nonnegative(),
    currency: z.literal("MNT"),
    paid_at: z.string().datetime().nullable(),
  })
  .strict();
