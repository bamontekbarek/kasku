import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StateIcon } from "@/components/ui";
import { RetryButton } from "./RetryButton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("offline") };
}

/** Fallback page the service worker serves when a navigation fails without a connection. */
export default async function OfflinePage() {
  const t = await getTranslations("offline");
  return (
    <div className="pt-safe flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 pb-8 text-center">
      <StateIcon icon="alertCircle" bg="var(--color-warn-soft)" fg="var(--color-warn)" />
      <h1 className="mt-2 mb-0 text-[26px] font-bold">{t("title")}</h1>
      <p className="m-0 text-[15px] leading-[22px] text-muted">{t("body")}</p>
      <RetryButton label={t("retry")} />
    </div>
  );
}
