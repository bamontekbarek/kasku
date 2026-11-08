import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotSent } from "./ForgotSent";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("forgotSent") };
}

export default async function ForgotSentPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return <ForgotSent email={email?.trim() || null} />;
}
