"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { FormAlert } from "@/components/form";
import { Icon } from "@/components/Icon";
import { ResendButton } from "@/components/ResendButton";
import { IconLink, StepList } from "@/components/ui";
import { sendPasswordReset } from "@/lib/auth/client";
import { AuthScreen } from "../../AuthScreen";

const b = (chunks: React.ReactNode) => <span className="font-semibold text-fg">{chunks}</span>;

/** AUTH-05: neutral confirmation, 3 steps, 1-hour validity, resend after 60 s. */
export function ForgotSent({ email }: { email: string | null }) {
  const t = useTranslations("forgotSent");
  const tc = useTranslations("common");
  const [status, setStatus] = useState<"sent" | "failed" | null>(null);
  const shown = email ?? t("yourEmail");
  const changeHref = email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password";

  return (
    <AuthScreen
      footer={
        <Link href="/login" className="mt-6 self-center py-3 text-sm font-semibold no-underline">
          {t("backToLogin")}
        </Link>
      }
    >
      <div className="flex h-12 items-center">
        <IconLink href={changeHref} label={tc("back")} icon="back" className="-ml-2.5" />
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <div className="relative flex size-24 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon name="mail" size={44} strokeWidth={1.6} />
          <span className="absolute right-0.5 bottom-0.5 flex size-[30px] items-center justify-center rounded-full border-[3px] border-bg bg-success text-bg">
            <Icon name="check" size={14} strokeWidth={3} />
          </span>
        </div>
        <h1 className="mt-6 mb-0 text-[28px] leading-9 font-bold">{t("title")}</h1>
        <p className="mt-2.5 mb-0 text-[15px] leading-[22px] text-muted">{t.rich("body", { email: shown, b })}</p>
      </div>

      <StepList className="mt-7" steps={[t.rich("step1", { email: shown, b }), t.rich("step2", { b }), t.rich("step3", { b })]} />

      {status && (
        <div className="mt-4">
          <FormAlert tone={status === "sent" ? "success" : "danger"}>{status === "sent" ? t("resent") : tc("genericError")}</FormAlert>
        </div>
      )}

      {email && (
        <div className="mt-5 flex flex-col gap-3">
          <ResendButton
            label={t("resend")}
            onResend={async () => {
              const ok = await sendPasswordReset(email);
              setStatus(ok ? "sent" : "failed");
              return ok;
            }}
          />
        </div>
      )}

      <div className="mt-4 flex gap-2.5 rounded-xl bg-surface px-3.5 py-3">
        <Icon name="info" size={18} className="mt-px flex-none text-muted" />
        <p className="m-0 text-[13px] leading-[19px] text-fg-2">
          {t.rich("tip", {
            link: (chunks) => (
              <Link href={changeHref} className="font-semibold no-underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </AuthScreen>
  );
}
