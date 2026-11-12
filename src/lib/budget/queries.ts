import "server-only";
import { createClient } from "@/lib/supabase/server";
import { parseBudgetStatus, type BudgetStatus } from "./status";

/**
 * BUD-01 – BUD-05: budget + usage of one month ("YYYY-MM"; default this month in the user's time zone).
 * Opening the current month copies last month's budget when none is set yet (BUD-05).
 */
export async function getBudgetStatus(month?: string): Promise<BudgetStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_budget_status", month ? { p_month: `${month}-01` } : {});
  if (error) throw new Error(error.message);
  return parseBudgetStatus(data);
}
