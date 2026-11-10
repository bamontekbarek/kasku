import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getAccount } from "@/lib/auth/account";
import { localParts } from "@/lib/expenses/dates";
import { getCategories, getExpense } from "@/lib/expenses/queries";
import { shortDate } from "@/lib/expenses/summary";
import { receiptPhotoUrl } from "@/lib/scan/queries";
import { EditExpenseForm } from "./EditExpenseForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("editExpense") };
}

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [account, expense, categories, locale, t] = await Promise.all([getAccount(), getExpense(id), getCategories(), getLocale(), getTranslations("expense")]);
  if (!expense) notFound();

  const photoUrl = expense.receiptPath ? await receiptPhotoUrl(expense.receiptPath) : null;
  const spent = localParts(expense.spentAt, account.timeZone);
  const recorded = localParts(expense.createdAt, account.timeZone);

  return (
    <EditExpenseForm
      categories={categories}
      expense={{
        id: expense.id,
        scanned: expense.source === "scan",
        photoUrl,
        recordedAt: t("recordedAt", { date: shortDate(recorded.date, locale), time: recorded.time }),
        values: {
          amount: expense.amount,
          merchant: expense.merchant,
          date: spent.date,
          time: spent.time,
          categoryId: expense.categoryId,
          paymentMethod: expense.payment,
          note: expense.note,
          items: expense.items,
        },
      }}
    />
  );
}
