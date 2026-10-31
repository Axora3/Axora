import type { ActionFail } from "./auth";

/** Preserve editor state when transport fails; the server may have committed. */
export async function runAdminAction<T extends { ok: boolean }>(action: () => Promise<T>): Promise<T | ActionFail> {
  try {
    return await action();
  } catch {
    return { ok: false, code: "connection", message: "Серверийн хариу ирсэнгүй. Өөрчлөлт хадгалагдсан эсэхийг хуудсаа шинэчилж шалгаад дахин оролдоно уу." };
  }
}
