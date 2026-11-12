import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { recentMonths } from "@/lib/expenses/dates";
import { monthTitle } from "@/lib/expenses/summary";
import { loadHistory } from "../load";
import { Transactions } from "../Transactions";
import { ExportSheet } from "./ExportSheet";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("export") };
}

/** HIS-04, HIS-05: export sheet over History; follows History's category filter (`?category=`). */
export default async function ExportPage({ searchParams }: { searchParams: Promise<{ month?: string; category?: string }> }) {
  const { month, category } = await searchParams;
  const [history, locale] = await Promise.all([loadHistory(month, category), getLocale()]);
  const lastMonth = recentMonths(history.thisMonth, 2)[1]!;
  const cat = history.categories.find((c) => c.id === history.filter) ?? null;
  const back = `/transactions?month=${history.month}${cat ? `&category=${cat.id}` : ""}`;

  return (
    <Transactions
      {...history}
      overlay={
        <ExportSheet
          closeHref={back}
          today={history.today}
          thisMonth={{ value: history.thisMonth, label: monthTitle(history.thisMonth, locale) }}
          lastMonth={{ value: lastMonth, label: monthTitle(lastMonth, locale) }}
          category={cat ? { id: cat.id, name: cat.name } : null}
        />
      }
    />
  );
}
