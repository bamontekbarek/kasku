import type { Metadata } from "next";
import { getAccount } from "@/lib/auth/account";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = { title: "Beranda" };

/** `?offline=1` previews the offline banner. */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ offline?: string }> }) {
  const [{ offline }, account] = await Promise.all([searchParams, getAccount()]);
  return <Dashboard offline={offline === "1"} user={{ name: account.fullName || account.email, initials: account.initials }} />;
}
