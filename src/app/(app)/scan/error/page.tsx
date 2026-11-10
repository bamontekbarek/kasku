import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { IconName } from "@/components/Icon";
import { ButtonLink, StateIcon, TopBar } from "@/components/ui";
import { scanConfig } from "@/lib/scan/config";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("scanError") };
}

type Kind = "notReceipt" | "failed" | "tooFast" | "uploadFailed" | "quota" | "paused";

const LOOK: Record<Kind, { href: string; bg: string; fg: string; icon: IconName }> = {
  notReceipt: { href: "/scan", bg: "var(--color-warn-soft)", fg: "var(--color-warn)", icon: "receiptX" },
  // The photo and receipt id are still in memory, so retrying needs no new photo.
  failed: { href: "/scan/processing", bg: "var(--color-danger-soft)", fg: "var(--color-danger)", icon: "alertCircle" },
  tooFast: { href: "/add", bg: "var(--color-info-soft)", fg: "var(--color-info)", icon: "timer" },
  uploadFailed: { href: "/scan/processing", bg: "var(--color-surface)", fg: "var(--color-fg-2)", icon: "wifiOff" },
  quota: { href: "/add", bg: "var(--color-warn-soft)", fg: "var(--color-warn)", icon: "timer" },
  paused: { href: "/add", bg: "var(--color-surface)", fg: "var(--color-fg-2)", icon: "alertCircle" },
};

/** SCAN-05, SCAN-06: `?kind=notReceipt|failed|tooFast|uploadFailed|quota|paused&remaining=&retry=`. */
export default async function ScanErrorPage({ searchParams }: { searchParams: Promise<{ kind?: string; remaining?: string; retry?: string }> }) {
  const { kind: k, remaining, retry } = await searchParams;
  const kind: Kind = k && k in LOOK ? (k as Kind) : "failed";
  const t = await getTranslations("scan.error");
  const look = LOOK[kind];
  const left = remaining !== undefined && /^\d+$/.test(remaining) ? Number(remaining) : null;
  const seconds = retry !== undefined && /^\d+$/.test(retry) ? Number(retry) : null;

  const body =
    kind === "tooFast" ? (seconds ? t("tooFastBody", { seconds }) : t("tooFastBodyNoTime")) : t(`${kind}Body`);

  return (
    <div className="pt-safe pb-safe flex min-h-dvh flex-col bg-bg">
      <TopBar title={t("title")} back="/add" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-7 text-center">
        <StateIcon icon={look.icon} bg={look.bg} fg={look.fg} />
        <h2 className="mt-2 mb-0 text-2xl leading-[30px] font-bold" aria-live="polite">
          {t(`${kind}Title`)}
        </h2>
        <p className="m-0 text-[15px] leading-[22px] text-muted">{body}</p>
        {left !== null && kind !== "quota" && (
          <span className="mt-1 inline-flex h-7 items-center rounded-full bg-surface px-3 text-[13px] text-fg-2">
            {t("quotaLeft", { left, total: scanConfig().dailyLimit })}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2.5 px-4 pt-3">
        <ButtonLink href={look.href}>{t(`${kind}Cta`)}</ButtonLink>
        {look.href !== "/add" && (
          <ButtonLink href="/add" variant="surface" size="md">
            {t("manual")}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
