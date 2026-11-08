import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAccount } from "@/lib/auth/account";
import { Settings } from "./Settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("account") };
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const [account, { password }] = await Promise.all([getAccount(), searchParams]);
  return <Settings account={account} notice={password === "changed" ? "passwordChanged" : undefined} />;
}
