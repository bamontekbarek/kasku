import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, scannedReceipt, transactionDays } from "@/lib/data";
import { EditExpenseForm } from "./EditExpenseForm";

export const metadata: Metadata = { title: "Edit Pengeluaran" };

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tx = transactionDays.flatMap((d) => d.rows).find((r) => r.id === id);
  if (!tx) notFound();

  const day = transactionDays.find((d) => d.rows.includes(tx))!;
  const date = ["2026-11-06", "2026-11-05", "2026-11-04"][transactionDays.indexOf(day)];
  const category = categories.find((c) => c.short === tx.category)?.name ?? "Lainnya";
  // Only the scanned demo receipt carries per-item prices in the mock data.
  const items =
    tx.id === "t1"
      ? scannedReceipt.items.map((it) => ({ name: it.name, price: it.price }))
      : tx.items.map((name) => ({ name, price: 0 }));

  return (
    <EditExpenseForm
      tx={{
        name: tx.name,
        amount: tx.amount,
        date,
        time: tx.time,
        category,
        payment: tx.payment,
        scanned: tx.scanned,
        recordedAt: `Dicatat ${day.day.replace("Hari ini · ", "")} 2026 · ${tx.time}`,
        items,
      }}
    />
  );
}
