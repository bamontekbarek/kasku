import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { loadHistory } from "./load";
import { Transactions } from "./Transactions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("history") };
}

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ month?: string; category?: string }> }) {
  const { month, category } = await searchParams;
  return <Transactions {...await loadHistory(month, category)} />;
}
