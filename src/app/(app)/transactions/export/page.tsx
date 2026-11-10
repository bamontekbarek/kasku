import type { Metadata } from "next";
import { loadHistory } from "../load";
import { Transactions } from "../Transactions";
import { ExportSheet } from "./ExportSheet";

export const metadata: Metadata = { title: "Export Transaksi" };

/** Export itself (HIS-04, HIS-05) arrives with M4; the sheet is still the mockup. */
export default async function ExportPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  return <Transactions {...await loadHistory(month)} overlay={<ExportSheet />} />;
}
