"use client";

import { useTranslations } from "next-intl";
import { checkPassword } from "@/lib/validation/auth";
import { Icon } from "./Icon";

type RuleKey = "length" | "mixedCase" | "digit" | "differs";

/** AUTH-02 checklist (green check when met). Pass `current` to add the "differs from old" rule (AUTH-08). */
export function PasswordRules({ password, current }: { password: string; current?: string }) {
  const t = useTranslations("password");
  const checks = checkPassword(password);
  const rules: Array<{ key: RuleKey; ok: boolean }> = [
    { key: "length", ok: checks.length },
    { key: "mixedCase", ok: checks.mixedCase },
    { key: "digit", ok: checks.digit },
  ];
  if (current !== undefined) rules.push({ key: "differs", ok: password.length > 0 && password !== current });

  return (
    <ul className="m-0 mt-1 flex list-none flex-col gap-1.5 p-0" aria-label={t("rulesLabel")}>
      {rules.map((r) => (
        <li key={r.key} className="flex items-center gap-2 text-[13px]">
          {r.ok ? (
            <Icon name="check" size={16} strokeWidth={2.6} className="text-success" />
          ) : (
            <Icon name="circle" size={16} strokeWidth={2} className="text-muted" />
          )}
          <span className={r.ok ? "text-fg-2" : "text-muted"}>
            {t(r.key)}
            <span className="sr-only"> {r.ok ? t("met") : t("unmet")}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
