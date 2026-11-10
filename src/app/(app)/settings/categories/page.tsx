import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCategoryTotals } from "@/lib/expenses/queries";
import { CategoriesManager } from "./CategoriesManager";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("categories") };
}

export default async function CategoriesPage() {
  return <CategoriesManager categories={await getCategoryTotals()} />;
}
