import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAccount } from "@/lib/auth/account";
import { todayIn } from "@/lib/expenses/dates";
import { getCategories } from "@/lib/expenses/queries";
import { getScanQuota } from "@/lib/scan/queries";
import { AddExpenseForm } from "./AddExpenseForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("add") };
}

/** EXP-01 – EXP-04 with the real scans left today (SCAN-06). */
export default async function AddExpensePage() {
  const [account, categories, quota] = await Promise.all([getAccount(), getCategories(), getScanQuota()]);
  return <AddExpenseForm categories={categories} today={todayIn(account.timeZone)} quotaLeft={quota.left} quotaTotal={quota.total} />;
}
