import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Account = { id: string; email: string; fullName: string; initials: string; verified: boolean };

export function initialsOf(name: string, email: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return (email[0] ?? "?").toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Signed-in user + profile for server components. Redirects to /login when the session is gone. */
export const getAccount = cache(async (): Promise<Account> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const fullName = profile?.full_name || (user.user_metadata?.full_name as string | undefined) || "";
  return {
    id: user.id,
    email: user.email,
    fullName,
    initials: initialsOf(fullName, user.email),
    verified: Boolean(user.email_confirmed_at),
  };
});
