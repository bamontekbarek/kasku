"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FieldError, FormAlert, PasswordField, TextField } from "@/components/form";
import { Icon } from "@/components/Icon";
import { LangToggle } from "@/components/LangToggle";
import { Button, IconLink } from "@/components/ui";
import { classifyAuthError, emailRedirect, getSupabase } from "@/lib/auth/client";
import { cx } from "@/lib/format";
import { checkPassword, passwordScore, registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { AuthScreen } from "../AuthScreen";

const RULES = [
  { key: "length", label: "lengthShort" },
  { key: "mixedCase", label: "mixedCaseShort" },
  { key: "digit", label: "digitShort" },
] as const;

export function RegisterForm() {
  const t = useTranslations("register");
  const tc = useTranslations("common");
  const tp = useTranslations("password");
  const locale = useLocale();
  const router = useRouter();
  const [failure, setFailure] = useState<"rateLimited" | "generic" | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirm: "", agree: false },
  });

  const pw = watch("password");
  const checks = checkPassword(pw);
  const score = passwordScore(pw);

  const onSubmit = handleSubmit(async ({ fullName, email, password }) => {
    setFailure(null);
    const { error } = await (await getSupabase()).auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, locale }, emailRedirectTo: emailRedirect("signup") },
    });
    // With email confirmation on, an already-registered email gets the same success response
    // as a new one (no account enumeration), so any error here is a real failure.
    if (error) {
      setFailure(classifyAuthError(error) === "rateLimited" ? "rateLimited" : "generic");
      return;
    }
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  });

  return (
    <AuthScreen
      footer={
        <p className="m-0 mt-6 text-center text-sm text-muted">
          {t("haveAccount")}{" "}
          <Link href="/login" className="inline-block py-3 font-semibold no-underline">
            {t("login")}
          </Link>
        </p>
      }
    >
      <div className="flex h-12 items-center justify-between">
        <IconLink href="/login" label={tc("back")} icon="back" className="-ml-2.5" />
        <LangToggle />
      </div>

      <div className="mt-4">
        <h1 className="m-0 text-[30px] leading-[38px] font-bold tracking-[-0.4px]">{t("title")}</h1>
        <p className="mt-2 mb-0 text-[15px] leading-[22px] text-muted">{t("sub")}</p>
      </div>

      {failure && (
        <div className="mt-5">
          <FormAlert>{failure === "rateLimited" ? tc("tooManyRequests") : tc("genericError")}</FormAlert>
        </div>
      )}

      <form className="mt-5 flex flex-col gap-3.5" onSubmit={onSubmit} noValidate>
        <TextField
          id="reg-name"
          label={t("name")}
          type="text"
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <TextField
          id="reg-email"
          label={t("email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={tc("emailPlaceholder")}
          error={errors.email?.message}
          {...register("email")}
        />
        <div className="flex flex-col gap-2">
          <PasswordField
            id="reg-pw"
            label={t("password")}
            autoComplete="new-password"
            placeholder={t("passwordPlaceholder")}
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="mt-0.5 flex gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cx("h-1 flex-1 rounded-sm", i < score ? "bg-success" : "bg-raised")} />
            ))}
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label={tp("rulesLabel")}>
            {RULES.map(({ key, label }) => (
              <li key={key} className={cx("flex h-6 items-center gap-1 rounded-md bg-surface px-2 text-xs", checks[key] ? "text-fg-2" : "text-muted")}>
                {checks[key] ? (
                  <Icon name="check" size={12} strokeWidth={3} className="text-success" />
                ) : (
                  <Icon name="circle" size={12} strokeWidth={2.4} className="text-muted" />
                )}
                {tp(label)}
                <span className="sr-only"> {checks[key] ? tp("met") : tp("unmet")}</span>
              </li>
            ))}
          </ul>
        </div>
        <PasswordField
          id="reg-pw2"
          label={t("confirm")}
          autoComplete="new-password"
          placeholder={t("confirmPlaceholder")}
          error={errors.confirm?.message}
          {...register("confirm")}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="reg-terms" className="flex min-h-11 cursor-pointer items-start gap-2.5 py-1 text-sm leading-5 text-fg-2">
            <input
              id="reg-terms"
              type="checkbox"
              aria-invalid={errors.agree ? true : undefined}
              aria-describedby={errors.agree ? "reg-terms-error" : undefined}
              className="m-0 size-5 flex-none accent-accent"
              {...register("agree")}
            />
            <span>
              {t.rich("agree", {
                terms: (chunks) => (
                  <Link href="/terms" className="no-underline">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/privacy" className="no-underline">
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          <FieldError id="reg-terms-error" message={errors.agree?.message} />
        </div>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? t("loading") : t("cta")}
        </Button>
        <p className="m-0 -mt-1 text-center text-[13px] leading-[18px] text-muted">{t("hint")}</p>
      </form>
    </AuthScreen>
  );
}
