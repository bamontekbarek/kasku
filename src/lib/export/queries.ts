import "server-only";
import { getAccount } from "@/lib/auth/account";
import { localParts, zonedToIso } from "@/lib/expenses/dates";
import type { ExpenseSource, PaymentMethod } from "@/lib/expenses/constants";
import { createClient } from "@/lib/supabase/server";

export type ExportFilter = {
  /** inclusive "YYYY-MM-DD" in the user's time zone */
  from: string;
  to: string;
  categoryId: string | null;
};

export type ExportRow = {
  date: string;
  time: string;
  merchant: string;
  categoryName: string;
  payment: PaymentMethod;
  amount: number;
  note: string;
  source: ExpenseSource;
};

const PAGE = 1000; // PostgREST max_rows
const MAX_ROWS = 20_000;

function nextDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

/** HIS-04, HIS-05: every transaction in the range (oldest first), optionally one category. RLS = own rows only. */
export async function getExportRows(filter: ExportFilter): Promise<ExportRow[]> {
  const [{ timeZone }, supabase] = await Promise.all([getAccount(), createClient()]);
  const from = zonedToIso(filter.from, "00:00", timeZone);
  const to = zonedToIso(nextDay(filter.to), "00:00", timeZone);
  const out: ExportRow[] = [];

  for (let offset = 0; offset < MAX_ROWS; offset += PAGE) {
    let q = supabase
      .from("expenses")
      .select("id, amount, merchant, note, spent_at, payment_method, source, categories(name)")
      .gte("spent_at", from)
      .lt("spent_at", to)
      .order("spent_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (filter.categoryId) q = q.eq("category_id", filter.categoryId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    for (const r of data) {
      const local = localParts(r.spent_at, timeZone);
      out.push({
        date: local.date,
        time: local.time,
        merchant: r.merchant,
        categoryName: r.categories?.name ?? "",
        payment: r.payment_method,
        amount: Number(r.amount),
        note: r.note,
        source: r.source,
      });
    }
    if (data.length < PAGE) break;
  }
  return out;
}
