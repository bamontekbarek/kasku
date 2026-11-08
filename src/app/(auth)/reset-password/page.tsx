import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { RECOVERY_COOKIE } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";
import { NewPasswordForm } from "./NewPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("reset") };
}

/**
 * AUTH-07: opened via /auth/confirm after the reset link was verified (which signs the user in).
 * Without a session or the recovery cookie — or with `?expired=1` from /auth/confirm — the link is treated as expired.
 */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fromResetLink = (await cookies()).get(RECOVERY_COOKIE)?.value === "1";
  const email = user?.email ?? null;
  return <NewPasswordForm expired={expired === "1" || !email || !fromResetLink} email={email ?? ""} />;
}
