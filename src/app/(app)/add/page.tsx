import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAccount } from "@/lib/auth/account";
import { DAILY_SCAN_QUOTA } from "@/lib/data";
import { todayIn } from "@/lib/expenses/dates";
import { getCategories } from "@/lib/expenses/queries";
import { AddExpenseForm } from "./AddExpenseForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("add") };
}

/** `?quota=0` previews the "daily scan quota used up" state. The real quota arrives with M3 (SCAN-06). */
export default async function AddExpensePage({ searchParams }: { searchParams: Promise<{ quota?: string }> }) {
  const [{ quota }, account, categories] = await Promise.all([searchParams, getAccount(), getCategories()]);
  const left = quota === undefined ? DAILY_SCAN_QUOTA : Math.max(0, Math.min(DAILY_SCAN_QUOTA, Number(quota) || 0));
  return <AddExpenseForm categories={categories} today={todayIn(account.timeZone)} quotaLeft={left} quotaTotal={DAILY_SCAN_QUOTA} />;
}
