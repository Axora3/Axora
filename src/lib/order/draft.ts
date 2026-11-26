import { z } from "zod";
import type { Answers } from "./questions";

const schema = z.object({
  v: z.literal(1),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string()), z.boolean()])),
  step: z.number().int().min(0).max(7),
  maxStep: z.number().int().min(0).max(7),
  showLinks: z.boolean(),
  idemKey: z.uuid(),
  builderSig: z.string(),
  fileNames: z.array(z.string()),
});
export type OrderDraft = Omit<z.infer<typeof schema>, "answers"> & { answers: Answers };

/** Browser storage is untrusted and may contain an old or interrupted write. */
export function parseOrderDraft(raw: unknown): OrderDraft | null {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return null;
  const draft = parsed.data;
  delete draft.answers.q39;
  return { ...draft, maxStep: Math.max(draft.step, draft.maxStep) };
}

/** Resolve the Storage getter inside the guard: browsers can throw on access. */
export function readOrderDraft(getStorage: () => Pick<Storage, "getItem">, key: string): OrderDraft | null {
  try { return parseOrderDraft(JSON.parse(getStorage().getItem(key) ?? "null")); }
  catch { return null; }
}
