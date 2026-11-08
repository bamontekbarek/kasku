import type { Metadata } from "next";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = { title: "Beranda" };

/** `?offline=1` previews the offline banner. */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ offline?: string }> }) {
  const { offline } = await searchParams;
  return <Dashboard offline={offline === "1"} />;
}
