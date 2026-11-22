import "server-only";
import { adminClient } from "@/lib/supabase/server";
import { readJson } from "@/lib/server/http";
import { IntegrationError } from "./contracts";
export async function bodyJson(request: Request) {
  const body = await readJson(request, 200000);
  if (!body.ok) throw new IntegrationError("invalid_body", 400);
  return body.data;
}
export function failure(error: unknown) {
  const code =
    error instanceof IntegrationError
      ? error.code
      : error instanceof Error && error.name === "ZodError"
        ? "invalid_input"
        : "ecosystem_unavailable";
  return Response.json(
    {
      ok: false,
      code,
      message:
        code === "ecosystem_migration_required"
          ? "Экосистемийн migration staging дээр шалгаж ажиллуулах шаардлагатай."
          : "Үйлдэл баталгаажаагүй. Мэдээлэл, эрх болон холболтыг шалгана уу.",
    },
    {
      status:
        error instanceof IntegrationError
          ? error.status
          : code === "invalid_input"
            ? 422
            : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export const serviceDb = adminClient;
