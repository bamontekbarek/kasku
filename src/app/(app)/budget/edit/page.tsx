import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { loadBudget } from "../load";
import { SetBudgetForm } from "./SetBudgetForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("budgetEdit") };
}

/** BUD-01, BUD-02: set the month's total and per-category limits, with last month's usage as reference. */
export default async function SetBudgetPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const { month: m, monthLabel, status } = await loadBudget(month);
  return (
    <SetBudgetForm
      month={m}
      monthLabel={monthLabel}
      total={status.total}
      threshold={status.threshold}
      remind={status.remind}
      categories={status.categories.map((c) => ({ id: c.id, name: c.name, color: c.color, limit: c.limit ?? 0, lastUsed: c.lastUsed }))}
    />
  );
}
