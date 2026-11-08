"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";

/** Long-form legal page: sticky title bar, back returns to wherever it was opened from. */
export function LegalLayout({ kind, children }: { kind: "terms" | "privacy"; children: ReactNode }) {
  const router = useRouter();
  const t = useTranslations("legal");
  const tm = useTranslations("meta");
  const tc = useTranslations("common");
  const locale = useLocale();
  const title = tm(kind);
  const heading = t(kind === "terms" ? "termsHeading" : "privacyHeading");
  return (
    <div className="pt-safe min-h-dvh bg-bg">
      <div className="sticky top-0 z-10 grid h-[52px] grid-cols-[44px_1fr_44px] items-center border-b border-surface bg-bg px-2">
        <button
          type="button"
          aria-label={tc("back")}
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/register"))}
          className="flex size-11 items-center justify-center border-0 bg-transparent text-fg"
        >
          <Icon name="back" size={24} strokeWidth={2} />
        </button>
        <span className="text-center text-[17px] font-semibold">{title}</span>
        <span />
      </div>
      <article lang="id" className="flex flex-col gap-[22px] px-5 pt-6 pb-10 text-sm leading-[22px] text-fg-2">
        <header lang={locale}>
          <h1 className="m-0 text-[26px] leading-8 font-bold text-fg">{heading}</h1>
          <p className="mt-2 mb-0 text-[13px] text-muted">{t("effective")}</p>
          {locale !== "id" && <p className="mt-2 mb-0 rounded-lg bg-surface px-3 py-2 text-[13px] text-fg-2">{t("draftNotice")}</p>}
        </header>
        {children}
      </article>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="m-0 mb-1.5 text-base font-semibold text-fg">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <ul className={`m-0 flex list-disc flex-col gap-1 pl-5 ${className}`}>{children}</ul>;
}

export function LegalCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-surface p-3.5">
      <h2 className="m-0 mb-1 text-[15px] font-semibold text-fg">{title}</h2>
      {children}
    </section>
  );
}
