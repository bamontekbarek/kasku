"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form";
import { Icon } from "@/components/Icon";
import { Button, IconLink } from "@/components/ui";
import { sendPasswordReset } from "@/lib/auth/client";
import { forgotSchema, type ForgotInput } from "@/lib/validation/auth";
import { AuthScreen } from "../AuthScreen";

/** AUTH-05/06: ask for the email only, then always show the neutral "check your email" screen. */
export function ForgotPasswordForm({ defaultEmail }: { defaultEmail: string }) {
  const t = useTranslations("forgot");
  const tc = useTranslations("common");
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema), defaultValues: { email: defaultEmail } });

  const onSubmit = handleSubmit(async ({ email }) => {
    // The result is deliberately not shown: unknown and known emails look the same.
    await sendPasswordReset(email);
    router.push(`/forgot-password/sent?email=${encodeURIComponent(email)}`);
  });

  return (
    <AuthScreen
      footer={
        <p className="m-0 text-center text-sm text-muted">
          {t("remembered")}{" "}
          <Link href="/login" className="inline-block py-3 font-semibold no-underline">
            {t("backToLogin")}
          </Link>
        </p>
      }
    >
      <div className="flex h-12 items-center">
        <IconLink href="/login" label={tc("back")} icon="back" className="-ml-2.5" />
      </div>

      <div className="mt-5">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Icon name="lockOpen" size={28} />
        </div>
        <h1 className="mt-5 mb-0 text-[30px] leading-[38px] font-bold tracking-[-0.4px]">{t("title")}</h1>
        <p className="mt-2.5 mb-0 text-[15px] leading-[22px] text-muted">{t("sub")}</p>
      </div>

      <form className="mt-8 flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        <TextField
          id="fp-email"
          label={t("email")}
          icon="mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={tc("emailPlaceholder")}
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? tc("sending") : t("cta")}
        </Button>
      </form>
    </AuthScreen>
  );
}
