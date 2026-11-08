import type { Metadata } from "next";
import { Transactions } from "./Transactions";

export const metadata: Metadata = { title: "Riwayat" };

export default function TransactionsPage() {
  return <Transactions />;
}
