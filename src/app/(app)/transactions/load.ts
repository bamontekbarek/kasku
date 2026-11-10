import "server-only";
import { getLocale } from "next-intl/server";
import { getAccount } from "@/lib/auth/account";
import { localParts, parseMonth, recentMonths, todayIn } from "@/lib/expenses/dates";
import { getCategories, getMonthExpenses } from "@/lib/expenses/queries";
import { monthTitle } from "@/lib/expenses/summary";
import type { HistoryProps } from "./Transactions";

/** HIS-01 – HIS-03: one month of transactions (`?month=YYYY-MM`, default this month) for the History list. */
export async function loadHistory(monthParam: string | undefined): Promise<HistoryProps> {
  const [account, locale] = await Promise.all([getAccount(), getLocale()]);
  const today = todayIn(account.timeZone);
  const thisMonth = today.slice(0, 7);
  const requested = parseMonth(monthParam);
  const month = requested && requested <= thisMonth ? requested : thisMonth;

  const [rows, categories] = await Promise.all([getMonthExpenses(month), getCategories()]);
  const yesterday = localParts(new Date(Date.parse(`${today}T12:00:00Z`) - 86_400_000), "UTC").date;

  return {
    month,
    months: recentMonths(thisMonth, 24).map((m) => ({ value: m, label: monthTitle(m, locale) })),
    today,
    yesterday,
    categories,
    rows: rows.map((r) => ({ ...r, ...localParts(r.spentAt, account.timeZone) })),
  };
}
