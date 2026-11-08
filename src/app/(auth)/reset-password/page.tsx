import type { Metadata } from "next";
import { NewPasswordForm } from "./NewPasswordForm";

export const metadata: Metadata = { title: "Buat Kata Sandi Baru" };

/** Opened from the reset link in the email. `?expired=1` shows the expired-link state. */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return <NewPasswordForm expired={expired === "1"} />;
}
