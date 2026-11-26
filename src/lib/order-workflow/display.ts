/** Stable server/browser output; Mongolian ICU support differs across engines. */
export function workflowTime(value: string) {
  const stamp = Date.parse(value);
  if (!Number.isFinite(stamp)) return "—";
  return (
    new Date(stamp + 8 * 3600000).toISOString().slice(0, 19).replace("T", " ") +
    " (УБ)"
  );
}
