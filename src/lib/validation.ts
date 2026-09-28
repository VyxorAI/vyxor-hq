/** "R 12,500" or "12 500" -> 12500. Empty -> null. Invalid -> NaN. */
export function parseMoney(value: string): number | null {
  const cleaned = value.replace(/[R\s,]/gi, '');
  if (cleaned === '') return null;
  return /^\d+(\.\d{1,2})?$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value);
}

/** Money value for an input: 2500 -> "2500", null -> "". */
export function moneyInput(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

/** Trimmed text, or null when empty. */
export function orNull(value: string): string | null {
  return value.trim() || null;
}
