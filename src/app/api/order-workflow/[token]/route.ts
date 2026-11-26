import { z } from "zod";
import { adminClient, isBackendConfigured } from "@/lib/supabase/server";
import { customerWorkflow, calculateForAnswers } from "@/lib/order-workflow/server";
import { allErrors, sanitizeAnswers } from "@/lib/order/questions";
import { answerValue } from "@/lib/order/schema";
import { fail, ok, readJson, rateLimit } from "@/lib/server/http";
const command = z.object({
  action: z.enum(["accept", "revision", "reject", "report_payment", "revise", "cancel"]),
  answers: z.record(z.string().max(16),answerValue).optional(),
  key: z.uuid(),
  version: z.number().int().min(0),
  expectedAmount: z.number().int().positive().optional(),
  message: z.string().trim().max(2000).default(""),
  reference: z.string().trim().max(100).default(""),
});
type Context = { params: Promise<{ token: string }> };
export async function GET(req: Request, { params }: Context) {
  const { token } = await params;
  if (!isBackendConfigured() || !/^[A-Za-z0-9_-]{32}$/.test(token))
    return fail(404, "missing", "Захиалга олдсонгүй.");
  if (!(await rateLimit(req, "workflow-read", 120, 60)))
    return fail(429, "rate", "Түр хүлээгээд дахин оролдоно уу.");
  try {
    const workflow = await customerWorkflow(token);
    return workflow
      ? ok({ workflow })
      : fail(404, "missing", "Захиалга олдсонгүй.");
  } catch {
    return fail(
      503,
      "unavailable",
      "Захиалгын мэдээлэл одоогоор ачаалагдсангүй.",
    );
  }
}
export async function POST(req: Request, { params }: Context) {
  const { token } = await params;
  if (!isBackendConfigured() || !/^[A-Za-z0-9_-]{32}$/.test(token))
    return fail(404, "missing", "Захиалга олдсонгүй.");
  if (req.headers.get("origin") !== new URL(req.url).origin)
    return fail(403, "origin", "Хүсэлтийг зөвшөөрсөнгүй.");
  if (!(await rateLimit(req, "workflow-write", 20, 600)))
    return fail(429, "rate", "Түр хүлээгээд дахин оролдоно уу.");
  const body = await readJson(req, 65536);
  if (!body.ok) return body.res;
  const parsed = command.safeParse(body.data);
  if (!parsed.success) return fail(422, "invalid", "Мэдээллээ шалгана уу.");
  const { action, key, answers, ...rest } = parsed.data;
  const input: Record<string,unknown> = {...rest};
  if (action === "revision" && rest.message.length < 3)
    return fail(422, "message", "Өөрчлөх хүсэлтээ бичнэ үү.");
  if(action === "revise") {
    if(!answers || allErrors(answers).length) return fail(422,"invalid","Анкетын шаардлагатай мэдээллээ бүрэн шалгана уу.");
    input.answers=sanitizeAnswers(answers);
    try {input.draft=await calculateForAnswers(input.answers as import("@/lib/order/questions").Answers);}
    catch {return fail(503,"unavailable","Үнийн тооцоо түр ачаалагдсангүй. Өөрчлөлтөө хадгалж дахин оролдоно уу.");}
  }
  const { data, error } = await adminClient().rpc(
    "website_order_customer_command",
    { p_token: token, p_action: action, p_key: key, p_input: input },
  );
  if (error)
    return fail(
      409,
      "conflict",
      "Төлөв өөрчлөгдсөн эсвэл энэ үйлдэл одоогоор боломжгүй байна. Мэдээллээ шинэчилнэ үү.",
    );
  return ok({ workflow: data });
}
