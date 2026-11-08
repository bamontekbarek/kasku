import type { Metadata } from "next";
import { SetBudgetForm } from "./SetBudgetForm";

export const metadata: Metadata = { title: "Atur Anggaran" };

export default function SetBudgetPage() {
  return <SetBudgetForm />;
}
