"use client";

import { cx } from "@/lib/format";
import { useLang, type Lang } from "@/lib/i18n";

/** Pill ID / EN switch used on the auth screens. */
export function LangToggle() {
  const { lang, setLang } = useLang();
  const item = (value: Lang, label: string) => (
    <button
      type="button"
      aria-pressed={lang === value}
      onClick={() => setLang(value)}
      className={cx(
        "rounded-full border-0 px-3 py-1.5 text-[13px] font-semibold",
        lang === value ? "bg-raised text-accent" : "bg-transparent text-muted",
      )}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Bahasa / Language" className="flex rounded-full bg-surface p-[3px]">
      {item("id", "ID")}
      {item("en", "EN")}
    </div>
  );
}
