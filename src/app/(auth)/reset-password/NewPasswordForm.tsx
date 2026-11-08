"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormAlert, PasswordField } from "@/components/form";
import { PasswordRules } from "@/components/PasswordRules";
import { Button, ButtonLink, Logo, StateIcon } from "@/components/ui";
import { classifyAuthError, getSupabase } from "@/lib/auth/client";
import { newPasswordSchema, type NewPasswordInput } from "@/lib/validation/auth";

const b = (chunks: React.ReactNode) => <span className="font-semibold text-fg">{chunks}</span>;

export function NewPasswordForm({ expired, email }: { expired: boolean; email: string }) {
  const t = useTranslations("reset");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const [done, setDone] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", confirm: "" },
  });
  const pw = watch("password");

  const onSubmit = handleSubmit(async ({ password }) => {
    setFailure(null);
    const supabase = await getSupabase();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setFailure(
        error.code === "same_password"
          ? tv("passwordSameAsOld")
          : classifyAuthError(error) === "rateLimited"
            ? tc("tooManyRequests")
            : tc("genericError"),
      );
      return;
    }
    // Sign out every other device; this one stays signed in.
    await supabase.auth.signOut({ scope: "others" });
    setDone(true);
  });

  return (
    <div className="pt-safe flex min-h-dvh flex-col bg-bg px-6 pb-8">
      <Logo />

      {expired ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <StateIcon icon="clock" bg="var(--color-warn-soft)" fg="var(--color-warn)" />
            <h1 className="mt-2 mb-0 text-[26px] font-bold">{t("expiredTitle")}</h1>
            <p className="m-0 text-[15px] leading-[22px] text-muted">{t("expiredBody")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <ButtonLink href="/forgot-password">{t("expiredCta")}</ButtonLink>
            <Link href="/login" className="self-center py-3 text-sm font-semibold no-underline">
              {t("backToLogin")}
            </Link>
          </div>
        </>
      ) : done ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <StateIcon icon="check" bg="var(--color-success-soft)" fg="var(--color-success)" strokeWidth={2.4} />
            <h1 className="mt-2 mb-0 text-[26px] font-bold">{t("doneTitle")}</h1>
            <p className="m-0 text-[15px] leading-[22px] text-muted">{t("doneBody")}</p>
          </div>
          <ButtonLink href="/dashboard">{t("doneCta")}</ButtonLink>
        </>
      ) : (
        <>
          <div className="mt-10">
            <h1 className="m-0 text-[30px] leading-[38px] font-bold tracking-[-0.4px]">{t("title")}</h1>
            <p className="mt-2.5 mb-0 text-[15px] leading-[22px] text-muted">{t.rich("body", { email, b })}</p>
          </div>
          {failure && (
            <div className="mt-5">
              <FormAlert>{failure}</FormAlert>
            </div>
          )}
          <form className="mt-7 flex flex-col gap-[18px]" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <PasswordField id="np-new" label={t("newPassword")} autoComplete="new-password" defaultVisible {...register("password")} />
              <PasswordRules password={pw} />
            </div>
            <PasswordField
              id="np-confirm"
              label={t("confirm")}
              autoComplete="new-password"
              placeholder={t("confirmPlaceholder")}
              error={errors.confirm?.message}
              {...register("confirm")}
            />
            <Button type="submit" disabled={!isValid || isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? tc("saving") : t("cta")}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
