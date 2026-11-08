"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "./ui";

/**
 * Disabled "Kirim ulang dalam 0:59" countdown that turns into a resend button (AUTH-05: 60 s gap).
 * `onResend` returns false when sending failed, so the user can retry right away.
 */
export function ResendButton({
  label,
  onResend,
  size = "lg",
  seconds = 59,
}: {
  label: string;
  onResend: () => Promise<boolean>;
  size?: "lg" | "md";
  seconds?: number;
}) {
  const t = useTranslations("common");
  const [left, setLeft] = useState(seconds);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const id = window.setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left]);

  if (left > 0) {
    return (
      <Button disabled size={size} className="!bg-surface tabular-nums">
        {t("resendIn", { seconds: String(left).padStart(2, "0") })}
      </Button>
    );
  }
  return (
    <Button
      variant="secondary"
      size={size}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const ok = await onResend();
        setBusy(false);
        if (ok) setLeft(seconds);
      }}
    >
      {busy ? t("sending") : label}
    </Button>
  );
}
