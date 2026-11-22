import { assertNoSecrets } from "@/lib/ecosystem/security";
import { adminGuard } from "@/lib/ecosystem/admin-http";
import { z } from "zod";
import { AdminCommand, FactoryAnswers } from "@/lib/ecosystem/contracts";
import { bodyJson, failure, serviceDb } from "@/lib/ecosystem/http";
import { checked } from "@/lib/ecosystem/processor";
import { summary } from "@/lib/ecosystem/read";
export async function GET(request: Request) {
  try {
    const ctx = await adminGuard(request);
    return Response.json(
      { ok: true, ...(await summary(ctx.db)) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const ctx = await adminGuard(request, true);
    const input = AdminCommand.parse(await bodyJson(request));
    const schemas = {
      register: z.object({ orderId: z.string().uuid() }).strict(),
      requirements: z
        .object({
          answers: FactoryAnswers,
          enabledModules: z
            .array(z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,60}$/))
            .max(40),
        })
        .strict(),
      generate: z
        .object({
          templateId: z.string().max(160),
          designId: z.string().max(160),
          provider: z.enum([
            "codex",
            "claude-code",
            "codex+claude-code",
            "custom",
          ]),
        })
        .strict(),
      confirm: z.object({ reference: z.string().min(8).max(500) }).strict(),
      invoice: z.object({ plan: z.enum(["monthly", "annual"]) }).strict(),
      policy: z
        .object({
          autoSuspend: z.boolean(),
          graceDays: z.number().int().min(0).max(60),
        })
        .strict(),
      retry_task: z.object({ taskId: z.string().uuid() }).strict(),
    };
    const schema =
      schemas[input.action as keyof typeof schemas] ?? z.object({}).strict();
    const data = schema.parse(input.data);
    if (input.action === "requirements") assertNoSecrets(data);
    if (input.action !== "register") z.string().uuid().parse(input.siteId);
    const result = checked(
      await serviceDb().rpc("ecosystem_command", {
        p_action: input.action,
        p_site: input.siteId ?? null,
        p_data: data,
        p_key: input.key,
        p_actor: ctx.user.id,
      }),
    );
    return Response.json(
      {
        ok: true,
        result,
        message:
          "Хүсэлт хадгалагдлаа. Дарааллын ажил болон бодит үр дүнг шалгана уу.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
