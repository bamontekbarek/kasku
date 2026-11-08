import type { Metadata } from "next";
import { DAILY_SCAN_QUOTA } from "@/lib/data";
import { AddExpenseForm } from "./AddExpenseForm";

export const metadata: Metadata = { title: "Tambah Pengeluaran" };

/** `?quota=0` previews the "daily scan quota used up" state. */
export default async function AddExpensePage({ searchParams }: { searchParams: Promise<{ quota?: string }> }) {
  const { quota } = await searchParams;
  const left = quota === undefined ? 17 : Math.max(0, Math.min(DAILY_SCAN_QUOTA, Number(quota) || 0));
  return <AddExpenseForm quotaLeft={left} />;
}
