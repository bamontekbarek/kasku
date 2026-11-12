import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getAccount } from "@/lib/auth/account";
import { PERIODS, type Period } from "@/lib/expenses/constants";
import { localParts, todayIn } from "@/lib/expenses/dates";
import { getBudgetStatus } from "@/lib/budget/queries";
import { budgetLevel, usedPct } from "@/lib/budget/status";
import { getUnreadCount } from "@/lib/notifications/queries";
import { getCategories, getCategoryTotals, getPeriodSummaries, getRecentExpenses, hasExpenses } from "@/lib/expenses/queries";
import { deltaPct, monthName, monthTitle, seriesLabel, shortDate, type PeriodSummary } from "@/lib/expenses/summary";
import { Welcome } from "../welcome/Welcome";
import { Dashboard, type DashboardData, type PeriodView } from "./Dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("dashboard") };
}

/** DASH-01 – DASH-10. Shows the new-user view until the first transaction. `?offline=1` previews the offline banner. */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ offline?: string }> }) {
  const [{ offline }, account, any] = await Promise.all([searchParams, getAccount(), hasExpenses()]);
  if (!any) return <Welcome />;

  const [summaries, totals, recent, categories, locale, t, budget, unread] = await Promise.all([
    getPeriodSummaries(),
    getCategoryTotals(),
    getRecentExpenses(4),
    getCategories(),
    getLocale(),
    getTranslations("dashboard"),
    getBudgetStatus(),
    getUnreadCount(),
  ]);

  const view = (period: Period, s: PeriodSummary): PeriodView => {
    const prevStart = s.series.at(-2)?.start ?? s.start;
    const caption = { day: t("today"), week: t("thisWeek"), month: monthTitle(s.start, locale), year: s.start.slice(0, 4) }[period];
    const prev = { day: t("yesterday"), week: t("lastWeek"), month: monthName(prevStart, locale), year: prevStart.slice(0, 4) }[period];
    return {
      caption,
      prev,
      total: s.total,
      count: s.count,
      max: s.max,
      delta: deltaPct(s.total, s.prevTotal),
      series: s.series.map((b) => ({ key: b.start, label: seriesLabel(period, b.start, locale), total: b.total })),
    };
  };

  const today = todayIn(account.timeZone);
  const monthTotal = totals.reduce((a, c) => a + c.total, 0);
  const byId = new Map(categories.map((c) => [c.id, c]));

  const data: DashboardData = {
    unread,
    budget:
      budget.total === null
        ? null
        : {
            total: budget.total,
            used: budget.used,
            pct: usedPct(budget.used, budget.total),
            level: budgetLevel(budget.used, budget.total, budget.threshold),
          },
    periods: Object.fromEntries(PERIODS.map((p) => [p, view(p, summaries[p])])) as Record<Period, PeriodView>,
    month: monthTitle(today.slice(0, 7), locale),
    top: totals
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((c) => ({ id: c.id, name: c.name, color: c.color, amount: c.total, pct: monthTotal ? (c.total / monthTotal) * 100 : 0 })),
    recent: recent.map((r) => {
      const local = localParts(r.spentAt, account.timeZone);
      const cat = byId.get(r.categoryId);
      return {
        id: r.id,
        name: r.merchant || cat?.name || "",
        category: cat?.name ?? "",
        color: cat?.color,
        when: local.date === today ? local.time : `${shortDate(local.date, locale)} · ${local.time}`,
        amount: r.amount,
        scanned: r.source === "scan",
      };
    }),
  };

  return <Dashboard offline={offline === "1"} user={{ name: account.fullName || account.email, initials: account.initials }} data={data} />;
}
