"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import type { Locale } from "@/i18n/config";

export type Lang = Locale;

/**
 * Active UI language (from next-intl) plus a setter that persists it in a cookie and the
 * user's profile, then re-renders server components in the new language.
 */
export function useLang() {
  const lang = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setLang = useCallback(
    (next: Lang) => {
      if (next === lang) return;
      startTransition(async () => {
        await setLocale(next);
        router.refresh();
      });
    },
    [lang, router],
  );

  return { lang, setLang, pending };
}

/**
 * Pick an inline string table for the active language.
 * @deprecated Legacy mock screens only. New/wired screens use `useTranslations` with messages/{id,en}.json.
 */
export function useT<T>(table: Record<Lang, T>): T {
  return table[useLocale()];
}
