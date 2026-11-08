"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormAlert, PasswordField, StrengthBar } from "@/components/form";
import { PasswordRules } from "@/components/PasswordRules";
import { Button, Footer, Screen, TopBar } from "@/components/ui";
import { classifyAuthError, getSupabase } from "@/lib/auth/client";
import { changePasswordSchema, checkPassword, type ChangePasswordInput } from "@/lib/validation/auth";

/** AUTH-08: old password, new password (AUTH-02 rules), confirmation; other sessions are revoked. */
export function ChangePasswordForm({ email }: { email: string }) {
  const t = useTranslations("changePassword");
  const tc = useTranslations("common");
  const router = useRouter();
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: { current: "", password: "", confirm: "" },
  });

  const [current, pw, confirm] = watch(["current", "password", "confirm"]);
  const checks = checkPassword(pw);
  const score = pw ? Object.values(checks).filter(Boolean).length + (pw !== current ? 1 : 0) : 0;
  const match = confirm.length > 0 && confirm === pw;

  const onSubmit = handleSubmit(async ({ current: oldPassword, password }) => {
    setFailure(null);
    const supabase = await getSupabase();

    // Re-check the current password first; a wrong one must not change anything.
    const check = await supabase.auth.signInWithPassword({ email, password: oldPassword });
    const kind = classifyAuthError(check.error);
    if (kind) {
      setFailure(kind === "invalidCredentials" ? t("wrongCurrent") : kind === "rateLimited" ? tc("tooManyRequests") : tc("genericError"));
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setFailure(classifyAuthError(error) === "rateLimited" ? tc("tooManyRequests") : tc("genericError"));
      return;
    }
    await supabase.auth.signOut({ scope: "others" });
    router.replace("/settings?password=changed");
    router.refresh();
  });

  return (
    <Screen
      header={<TopBar title={t("title")} back="/settings" />}
      footer={
        <Footer className="flex flex-col gap-2.5">
          <p className="m-0 text-center text-xs text-muted">{t("note")}</p>
          <Button type="submit" form="change-password" disabled={!isValid || isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? tc("saving") : t("cta")}
          </Button>
        </Footer>
      }
    >
      <form id="change-password" className="flex flex-col gap-5 px-4 pt-4 pb-6" onSubmit={onSubmit} noValidate>
        <p className="m-0 text-sm leading-5 text-muted">{t("intro")}</p>

        {failure && <FormAlert>{failure}</FormAlert>}

        <div className="flex flex-col gap-1">
          <PasswordField id="cp-old" label={t("current")} autoComplete="current-password" {...register("current")} />
          <Link href={`/forgot-password?email=${encodeURIComponent(email)}`} className="self-end py-2.5 text-[13px] font-medium no-underline">
            {t("forgot")}
          </Link>
        </div>

        <div className="h-px bg-surface" aria-hidden="true" />

        <div className="flex flex-col gap-2">
          <PasswordField id="cp-new" label={t("newPassword")} autoComplete="new-password" defaultVisible {...register("password")} />
          <StrengthBar score={score} />
          <PasswordRules password={pw} current={current} />
        </div>

        <div className="flex flex-col gap-2">
          <PasswordField id="cp-confirm" label={t("confirm")} autoComplete="new-password" defaultVisible error={errors.confirm?.message} {...register("confirm")} />
          {match && <span className="text-[13px] text-success">{tc("passwordMatch")}</span>}
        </div>
      </form>
    </Screen>
  );
}
