import { adminGuard } from "@/lib/ecosystem/admin-http";
import { z } from "zod";
import { bodyJson, failure, serviceDb } from "@/lib/ecosystem/http";
import { checked } from "@/lib/ecosystem/processor";
import { ServiceHttp } from "@/lib/ecosystem/connections";
export async function POST(request: Request) {
  try {
    const ctx = await adminGuard(request, true);
    const body = z
      .object({
        operation: z.enum(["sync", "register", "verify", "approve"]),
        key: z.string().uuid(),
        templateId: z
          .string()
          .regex(/^[A-Za-z0-9_-]{1,160}$/)
          .optional(),
        template: z.record(z.string(), z.unknown()).optional(),
      })
      .strict()
      .parse(await bodyJson(request));
    const http = new ServiceHttp();
    if (body.operation !== "sync") {
      if (body.operation === "register") {
        z.record(z.string(), z.unknown()).parse(body.template);
        await http.call(
          "factory",
          "/api/templates",
          "POST",
          body.template,
          body.key,
        );
      } else {
        const id = z
          .string()
          .regex(/^[A-Za-z0-9_-]{1,160}$/)
          .parse(body.templateId);
        await http.call(
          "factory",
          "/api/templates/" +
            id +
            (body.operation === "verify" ? "/verify" : "/approve"),
          "POST",
          {},
          body.key,
        );
      }
    }
    const state = z
      .object({
        templates: z.array(z.record(z.string(), z.unknown())),
        providers: z.record(z.string(), z.boolean()).optional(),
      })
      .passthrough()
      .parse(await http.call("factory", "/api/state"));
    const db = serviceDb();
    if (state.templates.length)
      checked(
        await db.from("ecosystem_remote_registry").upsert(
          state.templates.map((t) => ({
            service: "factory",
            kind: "template",
            remote_id: z.string().parse(t.id),
            body: t,
            observed_at: new Date().toISOString(),
          })),
          { onConflict: "service,kind,remote_id" },
        ),
      );
    if (state.providers)
      checked(
        await db.from("ecosystem_remote_registry").upsert(
          {
            service: "factory",
            kind: "configuration",
            remote_id: "providers",
            body: state.providers,
            observed_at: new Date().toISOString(),
          },
          { onConflict: "service,kind,remote_id" },
        ),
      );
    checked(
      await db.from("ecosystem_audit").insert({
        actor_id: ctx.user.id,
        action: "factory.registry." + body.operation,
        details: { templates: state.templates.length },
      }),
    );
    return Response.json(
      { ok: true, message: "Factory-ийн бодит хариуг хадгаллаа." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
