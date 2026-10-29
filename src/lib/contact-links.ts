/** Build safe, usable contact links while leaving owner placeholders as plain text. */
export function phoneHref(value: string): string | null {
  const phone = value.trim().replace(/[^\d+]/g, "");
  return /^\+?\d{6,15}$/.test(phone) ? `tel:${phone}` : null;
}

export function emailHref(value: string): string | null {
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
}

export function httpsHref(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
