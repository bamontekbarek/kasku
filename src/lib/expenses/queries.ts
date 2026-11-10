import "server-only";
import { cache } from "react";
import { getAccount } from "@/lib/auth/account";
import { createClient } from "@/lib/supabase/server";
import { PERIODS, type ExpenseSource, type PaymentMethod, type Period } from "./constants";
import { monthBounds } from "./dates";
import { parseSummary, type PeriodSummary } from "./summary";

export type Category = { id: string; name: string; color: string; isSystem: boolean };

export type CategoryTotal = Category & { total: number; count: number };

/** One row in History / Recent: one transaction (one receipt), not one item (HIS-01). */
export type ExpenseRow = {
  id: string;
  amount: number;
  merchant: string;
  note: string;
  spentAt: string;
  categoryId: string;
  payment: PaymentMethod;
  source: ExpenseSource;
  items: string[];
};

export type ExpenseDetail = Omit<ExpenseRow, "items"> & {
  createdAt: string;
  receiptPath: string | null;
  items: Array<{ name: string; price: number }>;
};

/** Thrown for failed reads so the route's error boundary (not an empty screen) shows up. */
function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const rows = check(await supabase.from("categories").select("id, name, color, is_system").order("sort_order").order("name"));
  return rows.map((c) => ({ id: c.id, name: c.name, color: c.color, isSystem: c.is_system }));
});

/** Total + transaction count per category for a month ("YYYY-MM-01"; default this month). */
export async function getCategoryTotals(month?: string): Promise<CategoryTotal[]> {
  const supabase = await createClient();
  const rows = check(await supabase.rpc("get_category_totals", month ? { p_month: month } : {}));
  return rows.map((r) => ({
    id: r.category_id,
    name: r.name,
    color: r.color,
    isSystem: r.is_system,
    total: Number(r.total),
    count: Number(r.tx_count),
  }));
}

/** DASH-01: all four periods at once, so switching tabs needs no extra request on a weak signal. */
export async function getPeriodSummaries(): Promise<Record<Period, PeriodSummary>> {
  const supabase = await createClient();
  const results = await Promise.all(PERIODS.map((p) => supabase.rpc("get_period_summary", { p_period: p })));
  return Object.fromEntries(PERIODS.map((p, i) => [p, parseSummary(check(results[i]!), p)])) as Record<Period, PeriodSummary>;
}

const rowColumns = "id, amount, merchant, note, spent_at, category_id, payment_method, source, expense_items(name, position)";

type RawRow = {
  id: string;
  amount: number;
  merchant: string;
  note: string;
  spent_at: string;
  category_id: string;
  payment_method: PaymentMethod;
  source: ExpenseSource;
  expense_items: Array<{ name: string; position: number }>;
};

function toRow(r: RawRow): ExpenseRow {
  return {
    id: r.id,
    amount: Number(r.amount),
    merchant: r.merchant,
    note: r.note,
    spentAt: r.spent_at,
    categoryId: r.category_id,
    payment: r.payment_method,
    source: r.source,
    items: [...r.expense_items].sort((a, b) => a.position - b.position).map((i) => i.name),
  };
}

/** DASH-09: latest transactions. */
export async function getRecentExpenses(limit = 4): Promise<ExpenseRow[]> {
  const supabase = await createClient();
  const rows = check(await supabase.from("expenses").select(rowColumns).order("spent_at", { ascending: false }).limit(limit));
  return (rows as RawRow[]).map(toRow);
}

/** True once the user has recorded anything (decides between Dashboard and the new-user view). */
export async function hasExpenses(): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase.from("expenses").select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

/** HIS-01: every transaction in a calendar month ("YYYY-MM") of the user's time zone, newest first. */
export async function getMonthExpenses(month: string): Promise<ExpenseRow[]> {
  const [{ timeZone }, supabase] = await Promise.all([getAccount(), createClient()]);
  const { from, to } = monthBounds(month, timeZone);
  const rows = check(
    await supabase
      .from("expenses")
      .select(rowColumns)
      .gte("spent_at", from)
      .lt("spent_at", to)
      .order("spent_at", { ascending: false })
      .limit(2000),
  );
  return (rows as RawRow[]).map(toRow);
}

/** EXP-05: one transaction with its receipt items, or null when it doesn't exist / isn't the user's. */
export async function getExpense(id: string): Promise<ExpenseDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, merchant, note, spent_at, created_at, category_id, payment_method, source, expense_items(name, price, position), receipts(storage_path)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    amount: Number(data.amount),
    merchant: data.merchant,
    note: data.note,
    spentAt: data.spent_at,
    createdAt: data.created_at,
    receiptPath: data.receipts?.storage_path ?? null,
    categoryId: data.category_id,
    payment: data.payment_method,
    source: data.source,
    items: [...data.expense_items].sort((a, b) => a.position - b.position).map((i) => ({ name: i.name, price: Number(i.price) })),
  };
}
