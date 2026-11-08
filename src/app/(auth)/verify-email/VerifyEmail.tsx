"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { FormAlert } from "@/components/form";
import { ResendButton } from "@/components/ResendButton";
import { ButtonLink, IconLink, StateIcon, StepList } from "@/components/ui";
import { resendVerification } from "@/lib/auth/client";
import { AuthScreen } from "../AuthScreen";

const b = (chunks: React.ReactNode) => <span className="font-semibold text-fg">{chunks}</span>;

/** AUTH-03: shown after sign-up and when an unverified user tries to log in. */
export function VerifyEmail({ email }: { email: string | null }) {
  const t = useTranslations("verify");
  const tc = useTranslations("common");
  const [status, setStatus] = useState<"sent" | "failed" | null>(null);
  const shown = email ?? t("yourEmail");

  return (
    <AuthScreen
      footer={
        <p className="m-0 mt-6 text-center text-[13px] leading-[19px] text-muted">
          {t.rich("footer", {
            link: (chunks) => (
              <Link href="/register" className="font-semibold no-underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      }
    >
      <div className="flex h-12 items-center">
        <IconLink href="/register" label={tc("back")} icon="back" className="-ml-2.5" />
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <StateIcon icon="mail" bg="var(--color-accent-soft)" fg="var(--color-accent)" size={96} iconSize={44} strokeWidth={1.6} />
        <h1 className="mt-6 mb-0 text-[28px] leading-9 font-bold">{t("title")}</h1>
        <p className="mt-2.5 mb-0 text-[15px] leading-[22px] text-muted">{t.rich("body", { email: shown, b })}</p>
      </div>

      <StepList
        className="mt-7"
        steps={[t.rich("step1", { email: shown, b }), t.rich("step2", { b }), t("step3")]}
      />

      {status && (
        <div className="mt-4">
          <FormAlert tone={status === "sent" ? "success" : "danger"}>{status === "sent" ? t("resent") : tc("genericError")}</FormAlert>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        <ButtonLink href="/login">{t("cta")}</ButtonLink>
        {email && (
          <ResendButton
            label={t("resend")}
            size="md"
            onResend={async () => {
              const ok = await resendVerification(email);
              setStatus(ok ? "sent" : "failed");
              return ok;
            }}
          />
        )}
      </div>
    </AuthScreen>
  );
}
