import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { safeNextPath } from "@/lib/auth/routes";
import { LoginForm, type LoginNotice } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("login") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; verify?: string; reset?: string; error?: string }>;
}) {
  const { next, verify, reset, error } = await searchParams;
  const notice: LoginNotice | null =
    verify === "failed" ? "verifyFailed" : reset === "done" ? "passwordChanged" : error === "1" ? "invalidCredentials" : null;
  return <LoginForm next={safeNextPath(next)} notice={notice} />;
}
