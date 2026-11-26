export type GlassMode =
  "pending" | "live-backdrop" | "frost-fallback" | "static-fallback";
export function readGlassMode(): GlassMode {
  if (typeof window === "undefined") return "pending";
  if (
    matchMedia("(forced-colors: active)").matches ||
    matchMedia("(prefers-reduced-transparency: reduce)").matches
  )
    return "static-fallback";
  if (
    typeof ResizeObserver === "undefined" ||
    typeof SVGFEDisplacementMapElement === "undefined"
  )
    return "static-fallback";
  const blur =
    CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)");
  if (!blur) return "static-fallback";
  // CSS.supports parses url() in WebKit too; it does not prove live backdrop rendering.
  // Match upstream's documented Blink restriction after checking actual platform APIs.
  const blink =
    /(?:Chrome|Chromium|Edg)\//.test(navigator.userAgent) &&
    !/iPhone|iPad|iPod|CriOS|EdgiOS/.test(navigator.userAgent);
  return blink && CSS.supports("backdrop-filter", 'url("#ax-capability")')
    ? "live-backdrop"
    : "frost-fallback";
}
export function subscribeGlassMode(callback: () => void) {
  const queries = [
    "(forced-colors: active)",
    "(prefers-reduced-transparency: reduce)",
  ].map((q) => matchMedia(q));
  queries.forEach((q) => q.addEventListener("change", callback));
  return () =>
    queries.forEach((q) => q.removeEventListener("change", callback));
}
