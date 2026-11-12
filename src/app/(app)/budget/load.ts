import "server-only";
import { getLocale } from "next-intl/server";
import { getAccount } from "@/lib/auth/account";
import { getBudgetStatus } from "@/lib/budget/queries";
import { budgetMonths, type BudgetStatus } from "@/lib/budget/status";
import { parseMonth, todayIn } from "@/lib/expenses/dates";
import { monthTitle } from "@/lib/expenses/summary";

export type BudgetPageData = {
  /** "YYYY-MM" */
  month: string;
  monthLabel: string;
  months: Array<{ value: string; label: string }>;
  status: BudgetStatus;
};

/** `?month=YYYY-MM` (next month back to 11 months ago; default this month). */
export async function loadBudget(monthParam: string | undefined): Promise<BudgetPageData> {
  const [account, locale] = await Promise.all([getAccount(), getLocale()]);
  const thisMonth = todayIn(account.timeZone).slice(0, 7);
  const allowed = budgetMonths(thisMonth);
  const requested = parseMonth(monthParam);
  const month = requested && allowed.includes(requested) ? requested : thisMonth;
  const status = await getBudgetStatus(month);
  return {
    month,
    monthLabel: monthTitle(month, locale),
    months: allowed.map((m) => ({ value: m, label: monthTitle(m, locale) })),
    status,
  };
}
