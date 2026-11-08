import type { Metadata } from "next";
import { Transactions } from "../Transactions";
import { ExportSheet } from "./ExportSheet";

export const metadata: Metadata = { title: "Export Transaksi" };

export default function ExportPage() {
  return <Transactions overlay={<ExportSheet />} />;
}
