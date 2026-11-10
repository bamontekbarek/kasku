import type { Period } from "./constants";

/** Shape returned by the `get_period_summary` RPC. */
export type PeriodSummary = {
  period: Period;
  /** First local day of the current period, "YYYY-MM-DD". */
  start: string;
  total: number;
  count: number;
  max: number;
  prevTotal: number;
  series: Array<{ start: string; total: number }>;
};

export function parseSummary(raw: unknown, period: Period): PeriodSummary {
  const r = (raw ?? {}) as Record<string, unknown>;
  const series = Array.isArray(r.series) ? (r.series as Array<{ start: string; total: number }>) : [];
  return {
    period,
    start: String(r.start ?? ""),
    total: Number(r.total ?? 0),
    count: Number(r.count ?? 0),
    max: Number(r.max ?? 0),
    prevTotal: Number(r.prev_total ?? 0),
    series: series.map((s) => ({ start: String(s.start), total: Number(s.total) })),
  };
}

export function intlLocale(locale: string): string {
  return locale === "en" ? "en-GB" : "id-ID";
}

/** DASH-02: change vs the previous period in percent, or null when there is nothing to compare. */
export function deltaPct(total: number, prev: number): number | null {
  if (prev <= 0) return null;
  return ((total - prev) / prev) * 100;
}

/** "12,4%" / "12.4%" */
export function formatPct(value: number, locale: string): string {
  return `${new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(Math.abs(value))}%`;
}

/** A "YYYY-MM-DD" calendar date as a Date at UTC midnight; format it with timeZone UTC. */
function asDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function fmt(day: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: "UTC", ...options }).format(asDate(day));
}

/** DASH-04 bar labels: 6/11 · 3 Nov · Nov · 2026 */
export function seriesLabel(period: Period, start: string, locale: string): string {
  const [y, m, d] = start.split("-").map(Number);
  switch (period) {
    case "day":
      return `${d}/${m}`;
    case "week":
      return fmt(start, locale, { day: "numeric", month: "short" }).replace(".", "");
    case "month":
      return fmt(start, locale, { month: "short" }).replace(".", "");
    case "year":
      return String(y);
  }
}

/** "November 2026" */
export function monthTitle(start: string, locale: string): string {
  return fmt(start.length === 7 ? `${start}-01` : start, locale, { month: "long", year: "numeric" });
}

/** "Oktober" */
export function monthName(start: string, locale: string): string {
  return fmt(start, locale, { month: "long" });
}

/** "6 Nov 2026" */
export function shortDate(day: string, locale: string): string {
  return fmt(day, locale, { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
}

/** "Jumat, 6 Nov" */
export function weekdayDate(day: string, locale: string): string {
  return fmt(day, locale, { weekday: "long", day: "numeric", month: "short" }).replace(".", "");
}

/** Compact chart label: 1.250.000 → "1,3jt" / "1.3M", 312.900 → "313rb" / "313K". */
export function shortAmount(v: number, locale: string): string {
  const en = locale === "en";
  if (v >= 1_000_000) {
    const n = (v / 1_000_000).toFixed(1);
    return en ? `${n}M` : `${n.replace(".", ",")}jt`;
  }
  if (v >= 1_000) return `${Math.round(v / 1000)}${en ? "K" : "rb"}`;
  return String(v);
}
