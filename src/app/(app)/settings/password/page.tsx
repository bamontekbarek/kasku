import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAccount } from "@/lib/auth/account";
import { ChangePasswordForm } from "./ChangePasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("changePassword") };
}

export default async function ChangePasswordPage() {
  const { email } = await getAccount();
  return <ChangePasswordForm email={email} />;
}
