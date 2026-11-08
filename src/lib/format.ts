/** 1234567 → "1.234.567" (Indonesian thousands separator). */
export function dots(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 1234567 → "Rp 1.234.567" */
export function rp(n: number): string {
  return `Rp ${dots(n)}`;
}

/** Compact chart label: 1_250_000 → "1,3jt", 312_900 → "313rb". */
export function short(v: number): string {
  return v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1).replace(".", ",")}jt`
    : `${Math.round(v / 1000)}rb`;
}

/** Parse a user-typed amount ("187.400", "Rp 5.000") into a number. */
export function parseAmount(v: string): number {
  const n = parseInt(v.replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
