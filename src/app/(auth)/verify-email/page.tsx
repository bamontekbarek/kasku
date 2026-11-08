import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VerifyEmail } from "./VerifyEmail";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("verifyEmail") };
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return <VerifyEmail email={email?.trim() || null} />;
}
