"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { ButtonLink, TopBar } from "@/components/ui";
import { errorKind } from "@/lib/scan/api";
import { scanUploaded, uploadReceipt, type ApiFailure } from "@/lib/scan/client";
import { scanStore } from "@/lib/scan/store";

const STEPS = ["step1", "step2", "step3", "step4"] as const;

/** SCAN-03: upload → AI reads → build data → fill form, with "Batal, isi manual". */
export function Processing() {
  const t = useTranslations("scan.processing");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const { optimized, receiptId } = scanStore.get();
    if (!optimized) {
      router.replace("/add");
      return;
    }
    const url = URL.createObjectURL(optimized.blob);
    setPhoto(url);

    const abort = new AbortController();
    abortRef.current = abort;
    const timers: number[] = [];

    const fail = (f: ApiFailure) => {
      const params = new URLSearchParams({ kind: errorKind(f.error) });
      if (f.remaining != null) params.set("remaining", String(f.remaining));
      if (f.retryAfter != null) params.set("retry", String(f.retryAfter));
      router.replace(`/scan/error?${params}`);
    };

    (async () => {
      try {
        let id = receiptId;
        if (!id) {
          const up = await uploadReceipt(optimized, abort.signal);
          if ("error" in up) return fail(up);
          id = up.id;
          scanStore.setReceipt(id);
        }
        setStep(1);
        timers.push(window.setTimeout(() => setStep(2), 2500));

        const res = await scanUploaded(id, abort.signal);
        if ("error" in res) return fail(res);
        setStep(3);
        timers.push(window.setTimeout(() => setStep(4), 400));
        timers.push(window.setTimeout(() => router.replace(`/scan/review?id=${id}`), 700));
      } catch {
        // Aborted: the user chose to fill in manually.
      }
    })();

    return () => {
      abort.abort();
      timers.forEach(window.clearTimeout);
      URL.revokeObjectURL(url);
    };
  }, [router]);

  const finished = step >= STEPS.length;

  return (
    <div className="pt-safe pb-safe flex min-h-dvh flex-col bg-bg">
      <TopBar title={t("title")} back="/add" />

      <div className="flex justify-center pt-6">
        <div className="relative box-border h-[290px] w-[190px] overflow-hidden rounded-[14px] bg-surface p-3.5">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element -- local blob URL
            <img src={photo} alt="" className="size-full rounded object-cover object-top" />
          )}
          {!finished && (
            <div className="absolute right-2 left-2 h-[3px] animate-kscan rounded-sm bg-accent shadow-[0_0_16px_4px_rgba(252,213,53,0.55)]" aria-hidden="true" />
          )}
        </div>
      </div>

      <div className="px-6 pt-7 text-center">
        <div className="inline-flex h-7 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-[13px] font-semibold text-accent">
          <Icon name="sparkle" size={14} strokeWidth={2} />
          {t("badge")}
        </div>
        <h2 className="mt-3 mb-0 text-[22px] font-bold" aria-live="polite">
          {finished ? t("done") : t("reading")}
        </h2>
        <p className="mt-1.5 mb-0 text-sm leading-5 text-muted">{t("body")}</p>
      </div>

      <ol className="mx-4 mt-6 mb-0 flex list-none flex-col rounded-[14px] bg-surface px-4 py-1">
        {STEPS.map((key, i) => (
          <li key={key} className="flex h-12 items-center gap-3 text-[15px]">
            {i < step ? (
              <>
                <span className="flex size-6 flex-none items-center justify-center rounded-full bg-success text-bg">
                  <Icon name="check" size={14} strokeWidth={3} />
                </span>
                <span className="text-fg">{t(key)}</span>
              </>
            ) : i === step ? (
              <>
                <span className="box-border size-6 flex-none animate-kspin rounded-full border-[3px] border-raised border-t-accent" aria-hidden="true" />
                <span className="font-semibold text-accent">{t(key)}</span>
              </>
            ) : (
              <>
                <span className="box-border size-6 flex-none rounded-full border-2 border-raised" aria-hidden="true" />
                <span className="text-muted">{t(key)}</span>
              </>
            )}
          </li>
        ))}
      </ol>

      <div className="flex-1" />
      <div className="flex flex-col gap-2.5 px-4 pt-3">
        <ButtonLink href="/add" variant="surface" size="md" onClick={() => abortRef.current?.abort()}>
          {t("cancel")}
        </ButtonLink>
      </div>
    </div>
  );
}
