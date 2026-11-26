/** Accept common phone formatting, never arbitrary text that happens to contain digits. */
export function isPhoneNumber(value: string): boolean {
  const text = value.trim();
  return /^\+?[\d\s().-]+$/.test(text) && text.replace(/\D/g, "").length >= 8;
}
