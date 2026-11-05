/** Use only a configured origin or the same origin as the authenticated admin action. */
export function resolveDownloadOrigin(env: Record<string, string | undefined>, requestHeaders: Headers): string | null {
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const candidates = [env.NEXT_PUBLIC_SITE_URL, env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined];
  try {
    if (origin && host && new URL(origin).host === host) candidates.push(origin);
  } catch { /* Invalid request headers cannot supply a delivery origin. */ }
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (url.username || url.password) continue;
      const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
      if (local) {
        if (env.NODE_ENV === "development" && env.ALLOW_LOCAL_DOWNLOAD_LINKS === "true" && ["http:", "https:"].includes(url.protocol)) return url.origin;
        continue;
      }
      if (url.protocol === "https:") return url.origin;
    } catch { /* Try the next trusted source. */ }
  }
  return null;
}
