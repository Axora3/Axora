import { z } from "zod";
import { isCalendarDate } from "@/lib/admin/dates";

export const MAX_MONEY = 999_999_999_999;
const money = z.number().int().min(0).max(MAX_MONEY);
const days = z.number().int().min(0).max(3650);
export const businessDate = z
  .string()
  .refine(isCalendarDate, "Огноо буруу байна.");

export const quoteItemSchema = z.object({
  kind: z.enum([
    "base_package",
    "additional_pages",
    "feature",
    "custom",
    "rush",
    "maintenance",
    "external",
  ]),
  billing: z.enum(["one_time", "monthly", "external"]).default("one_time"),
  code: z.string().trim().max(120).default(""),
  label: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(1).max(1000),
  unitPrice: money,
});
export type QuoteItem = z.infer<typeof quoteItemSchema>;
export type PricedItem = QuoteItem & { total: number };

export const pricingPolicySchema = z
  .object({
    enabled: z.boolean(),
    version: z.string().trim().max(80),
    packages: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]{1,80}$/),
          label: z.string().trim().min(1).max(120),
          basePrice: money.refine((n) => n > 0),
          includedPages: z.number().int().min(0).max(1000),
          includedFeatures: z.array(z.string().max(120)).max(30),
          includedRevisions: z.number().int().min(0).max(100),
          minDays: days,
          maxDays: days.refine((n) => n > 0),
        }),
      )
      .max(50),
    features: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]{1,80}$/),
          label: z.string().trim().min(1).max(120),
          answerValue: z.string().trim().min(1).max(120),
          unitPrice: money,
          durationDays: days,
        }),
      )
      .max(50),
    additionalPagePrice: money,
    additionalPageDays: days,
    discountPercent: z.number().int().min(0).max(99),
    rushPercent: z.number().int().min(0).max(200),
    monthlyMaintenancePrice: money,
    extraRevisionPrice: money,
    extraRevisionDays: days.nullable(),
  })
  .superRefine((p, ctx) => {
    if (p.enabled && (!p.version || !p.packages.length))
      ctx.addIssue({
        code: "custom",
        message: "Үнийн дүрмийн хувилбар, багцуудаа тохируулна уу.",
      });
    for (const list of [p.packages, p.features])
      if (new Set(list.map((x) => x.id)).size !== list.length)
        ctx.addIssue({ code: "custom", message: "Дүрмийн ID давхцаж байна." });
    if (p.packages.some((x) => x.minDays > x.maxDays))
      ctx.addIssue({
        code: "custom",
        message: "Хугацааны доод утга дээд утгаасаа их байна.",
      });
    if (
      new Set(p.features.map((x) => x.answerValue)).size !== p.features.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Нэг боломжид хоёр үнэ тохируулахгүй.",
      });
  });
export type PricingPolicy = z.infer<typeof pricingPolicySchema>;

export const schedulingPolicySchema = z
  .object({
    enabled: z.boolean(),
    workingDays: z.array(z.number().int().min(1).max(7)).max(7),
    maxParallelProjects: z.number().int().min(1).max(30).nullable(),
    bufferWorkingDays: z.number().int().min(0).max(60),
    holidays: z.array(businessDate).max(366),
    queueStrategy: z.enum(["fifo", "deadline", "priority"]),
  })
  .superRefine((p, ctx) => {
    if (new Set(p.workingDays).size !== p.workingDays.length)
      ctx.addIssue({ code: "custom", message: "Ажлын өдөр давхцаж байна." });
    if (p.enabled && (!p.workingDays.length || !p.maxParallelProjects))
      ctx.addIssue({
        code: "custom",
        message: "Ажлын өдөр, зэрэг ажиллах төслийн тоог тохируулна уу.",
      });
  });
export type SchedulingPolicy = z.infer<typeof schedulingPolicySchema>;

export const bankSchema = z.object({
  name: z.string().trim().min(2).max(80),
  holder: z.string().trim().min(2).max(120),
  account: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9 -]{5,59}$/, "Дансны мэдээллээ шалгана уу."),
});
export type BankDetails = z.infer<typeof bankSchema>;
export const workflowSettingsSchema = z
  .object({
    pricing: pricingPolicySchema,
    scheduling: schedulingPolicySchema,
    bank: z.object({
      name: z.string().trim().max(80),
      holder: z.string().trim().max(120),
      account: z.string().trim().max(60),
    }),
    bankVerified: z.boolean(),
    bankInstructions: z.string().trim().max(1000),
  })
  .superRefine((s, ctx) => {
    if (s.bankVerified && !bankSchema.safeParse(s.bank).success)
      ctx.addIssue({
        code: "custom",
        path: ["bank"],
        message: "Банк, данс, эзэмшигчийн мэдээллийг бүрэн шалгана уу.",
      });
  });

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "revision_requested"
  | "rejected"
  | "superseded";
export type Quotation = {
  id: string;
  version: number;
  status: QuoteStatus;
  pricing_version: string | null;
  package_label: string | null;
  requirements: Record<string, unknown>;
  items: PricedItem[];
  subtotal: number;
  discount: number;
  total: number | null;
  monthly_total: number;
  external_total: number;
  notes: string;
  review_flags: string[];
  estimated_effort_days: number | null;
  accepted_at: string | null;
  created_at: string;
};
export type Schedule = {
  suggestedDeadline: string | null;
  suggestedStart: string | null;
  effortDays: number | null;
  workingDays: number | null;
  approximate: boolean;
  workloadCount: number;
  explanations: string[];
  policyVersion?: string;
};
export type WorkflowProject = {
  id: string;
  status: string;
  progress_percent: number;
  target_completion_date: string | null;
  actual_started_at: string | null;
  actual_completed_at: string | null;
  delivered_at: string | null;
  delivery_url: string | null;
  estimated_effort_days: number | null;
  remaining_effort_days: number | null;
  queue_priority: number;
  suggested_completion_date: string | null;
};
export type WorkflowOrder = {
  id: string;
  reference: string;
  business_name: string;
  full_name: string;
  status: string;
  payment_status: string;
  quote_amount: number | null;
  paid_at: string | null;
  agreed_deadline: string | null;
  workflow_managed: boolean;
  workflow_revision: number;
};
export type CustomerWorkflow = {
  answers?: import("@/lib/order/questions").Answers;
  order: WorkflowOrder;
  quote: Quotation | null;
  project: WorkflowProject | null;
  paymentReport: {
    id: string;
    status: string;
    reported_at: string;
    reference: string;
    note: string;
    review_note?: string;
    verification_note?: string;
  } | null;
  bank: BankDetails | null;
  bankInstructions: string;
  history: { id: string; label: string; created_at: string }[];
};
export type AdminWorkflow = CustomerWorkflow & {
  customerEmail?: string;
  quotes: Quotation[];
  customerRequests?: { message: string; created_at: string }[];
  emailEvents: {
    id: string;
    event_type: string;
    status: string;
    attempts: number;
    last_error: string | null;
    provider_message_id?: string | null;
    created_at: string;
  }[];
  trackingPath: string | null;
};
