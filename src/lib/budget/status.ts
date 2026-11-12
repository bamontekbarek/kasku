/** Budget math shared by the Budget screens and the Dashboard card (BUD-01 – BUD-04). Pure, no I/O. */

export type BudgetCategory = {
  id: string;
  name: string;
  color: string;
  isSystem: boolean;
  /** null = no limit for this category */
  limit: number | null;
  used: number;
  lastUsed: number;
};

export type BudgetStatus = {
  /** "YYYY-MM-01" */
  month: string;
  daysLeft: number;
  /** "Hampir habis" threshold from notification settings (70/80/90). */
  threshold: number;
  /** Notify when nearly used up (notification_settings.budget_near). */
  remind: boolean;
  /** null = no budget set for this month */
  total: number | null;
  used: number;
  lastUsed: number;
  /** The user has set a budget in some month before. */
  hasAny: boolean;
  categories: BudgetCategory[];
};

export type BudgetLevel = "safe" | "near" | "over";

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const numOrNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** jsonb from `get_budget_status` → typed status. */
export function parseBudgetStatus(raw: unknown): BudgetStatus {
  const r = (raw ?? {}) as Record<string, unknown>;
  const cats = Array.isArray(r.categories) ? (r.categories as Array<Record<string, unknown>>) : [];
  return {
    month: String(r.month ?? ""),
    daysLeft: num(r.days_left),
    threshold: num(r.threshold) || 80,
    remind: r.remind !== false,
    total: numOrNull(r.total),
    used: num(r.used),
    lastUsed: num(r.last_used),
    hasAny: Boolean(r.has_any),
    categories: cats.map((c) => ({
      id: String(c.id),
      name: String(c.name),
      color: String(c.color),
      isSystem: Boolean(c.is_system),
      limit: numOrNull(c.limit),
      used: num(c.used),
      lastUsed: num(c.last_used),
    })),
  };
}

/** Whole percent used (floor, so 79.9% never shows as "80%" next to an "Aman" badge). */
export function usedPct(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.floor((used / limit) * 100);
}

/** BUD-04: Aman (< threshold), Hampir habis (≥ threshold), Lewat batas (> 100%). */
export function budgetLevel(used: number, limit: number, threshold: number): BudgetLevel {
  if (used > limit) return "over";
  if (usedPct(used, limit) >= threshold) return "near";
  return "safe";
}

/** BUD-03: remaining ÷ days left (today included), rounded down to Rp 100. 0 when nothing is left. */
export function safePerDay(left: number, daysLeft: number): number {
  if (left <= 0 || daysLeft <= 0) return 0;
  return Math.floor(left / daysLeft / 100) * 100;
}

/** BUD-02: total minus the sum of category limits. > 0 unallocated, < 0 over the total. */
export function unallocated(total: number, limits: number[]): number {
  return total - limits.reduce((a, b) => a + b, 0);
}

/** Months the budget screens offer: next month (plan ahead) + this month + the 11 before it, newest first. */
export function budgetMonths(thisMonth: string): string[] {
  const [y, m] = thisMonth.split("-").map(Number);
  const idx = y! * 12 + (m! - 1);
  return Array.from({ length: 13 }, (_, i) => {
    const k = idx + 1 - i;
    return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`;
  });
}
