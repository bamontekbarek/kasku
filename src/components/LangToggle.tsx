"use client";

import { useTranslations } from "next-intl";
import { cx } from "@/lib/format";
import { useLang, type Lang } from "@/lib/i18n";

/** Pill ID / EN switch used on the auth screens. */
export function LangToggle() {
  const t = useTranslations("common");
  const { lang, setLang, pending } = useLang();
  const item = (value: Lang, label: string) => (
    <button
      type="button"
      aria-pressed={lang === value}
      disabled={pending}
      aria-busy={(pending && lang !== value) || undefined}
      onClick={() => setLang(value)}
      className={cx(
        "min-h-11 min-w-11 rounded-full border-0 px-3 text-[13px] font-semibold",
        lang === value ? "bg-raised text-accent" : "bg-transparent text-muted",
      )}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label={t("language")} className="flex rounded-full bg-surface p-[3px]">
      {item("id", "ID")}
      {item("en", "EN")}
    </div>
  );
}
