"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

const ONE_YEAR = 60 * 60 * 24 * 365;

async function writeLocaleCookie(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
}

/** ACC-02: switch the UI language and, when signed in, remember it in the profile. */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  await writeLocaleCookie(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ locale }).eq("id", user.id);
  }
}

/** After login: adopt the language saved in the profile so every device shows the same language. */
export async function syncLocaleFromProfile(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase.from("profiles").select("locale").eq("id", user.id).single();
  if (data && isLocale(data.locale)) await writeLocaleCookie(data.locale);
}
