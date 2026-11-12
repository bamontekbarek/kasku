"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAppRouter } from "@/components/NavProgress";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { syncLocaleFromProfile } from "@/app/actions/locale";
import { FormAlert, PasswordField, TextField } from "@/components/form";
import { LangToggle } from "@/components/LangToggle";
import { Button, Logo } from "@/components/ui";
import { classifyAuthError, type AuthFailure, getSupabase } from "@/lib/auth/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { AuthScreen } from "../AuthScreen";

export type LoginNotice = "verifyFailed" | "passwordChanged" | "invalidCredentials";

export function LoginForm({ next, notice }: { next: string; notice: LoginNotice | null }) {
  const t = useTranslations("login");
  const tc = useTranslations("common");
  const router = useAppRouter();
  // Done and navigating away: keep the button locked until the next page shows.
  const [leaving, setLeaving] = useState(false);
  const [failure, setFailure] = useState<AuthFailure | null>(notice === "invalidCredentials" ? "invalidCredentials" : null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFailure(null);
    const { error } = await (await getSupabase()).auth.signInWithPassword({ email, password });
    const kind = classifyAuthError(error);
    if (kind) {
      setFailure(kind);
      return;
    }
    await syncLocaleFromProfile();
    setLeaving(true);
    router.replace(next);
    router.refresh();
  });

  const alert =
    failure === "invalidCredentials" ? (
      <FormAlert>{t("error")}</FormAlert>
    ) : failure === "unverified" ? (
      <FormAlert>
        {t("unverified")}{" "}
        <Link href={`/verify-email?email=${encodeURIComponent(getValues("email"))}`} className="font-semibold no-underline">
          {t("unverifiedCta")}
        </Link>
      </FormAlert>
    ) : failure === "rateLimited" ? (
      <FormAlert>{tc("tooManyRequests")}</FormAlert>
    ) : failure === "generic" ? (
      <FormAlert>{tc("genericError")}</FormAlert>
    ) : notice === "verifyFailed" ? (
      <FormAlert>{t("verifyFailed")}</FormAlert>
    ) : notice === "passwordChanged" ? (
      <FormAlert tone="success">{t("passwordChanged")}</FormAlert>
    ) : null;

  return (
    <AuthScreen
      footer={
        <p className="m-0 text-center text-sm text-muted">
          {t("noAccount")}{" "}
          <Link href="/register" className="inline-block py-3 font-semibold no-underline">
            {t("register")}
          </Link>
        </p>
      }
    >
      <div className="flex items-center justify-between">
        <Logo />
        <LangToggle />
      </div>

      <div className="mt-14">
        <h1 className="m-0 text-[30px] leading-[38px] font-bold tracking-[-0.4px]">{t("title")}</h1>
        <p className="mt-2.5 mb-0 text-[15px] leading-[22px] text-muted">{t("sub")}</p>
      </div>

      {alert && <div className="mt-6">{alert}</div>}

      <form className="mt-9 flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        <TextField
          id="login-email"
          label={t("email")}
          icon="mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={tc("emailPlaceholder")}
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordField
          id="login-pw"
          label={t("password")}
          icon="lock"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="-mt-3 flex justify-end">
          <Link href="/forgot-password" className="py-3 text-sm font-medium no-underline">
            {t("forgot")}
          </Link>
        </div>
        <Button type="submit" className="mt-1" loading={isSubmitting || leaving}>
          {isSubmitting || leaving ? t("loading") : t("cta")}
        </Button>
      </form>
    </AuthScreen>
  );
}
