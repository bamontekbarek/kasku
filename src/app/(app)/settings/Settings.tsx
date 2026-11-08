"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { TabScreen } from "@/components/BottomNav";
import { FormAlert } from "@/components/form";
import { Icon, type IconName } from "@/components/Icon";
import { Avatar, Badge, ChevronRight, SectionLabel, Segmented, buttonClass } from "@/components/ui";
import type { Account } from "@/lib/auth/account";
import { getSupabase } from "@/lib/auth/client";
import { useLang } from "@/lib/i18n";

const APP_VERSION = "1.0.0";

function Row({ icon, children, href, last, right }: { icon: IconName; children: ReactNode; href?: string; last?: boolean; right?: ReactNode }) {
  const cls = `flex min-h-[60px] items-center justify-between gap-3 text-fg no-underline hover:text-fg ${last ? "" : "border-b border-surface"}`;
  const body = (
    <>
      <span className="flex items-center gap-3 text-[15px]">
        <Icon name={icon} className="text-fg-2" />
        {children}
      </span>
      {right ?? (href ? <ChevronRight /> : null)}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Account & settings tab (ACC-01 – ACC-04, AUTH-09). `overlay` renders a sheet on top (install guide). */
export function Settings({ account, overlay, notice }: { account: Account; overlay?: ReactNode; notice?: "passwordChanged" }) {
  const t = useTranslations("account");
  const tc = useTranslations("changePassword");
  const { lang, setLang, pending } = useLang();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    await (await getSupabase()).auth.signOut({ scope: "local" });
    navigator.serviceWorker?.controller?.postMessage("clear-pages");
    router.replace("/login");
    router.refresh();
  };

  return (
    <TabScreen active="account">
      <header className="flex h-14 items-center px-4">
        <h1 className="m-0 text-[22px] font-bold">{t("title")}</h1>
      </header>

      <div className="flex flex-col gap-5 px-4 pt-2">
        {notice === "passwordChanged" && <FormAlert tone="success">{tc("success")}</FormAlert>}

        <div className="flex items-center gap-3.5 rounded-[14px] bg-surface p-4">
          <Avatar initials={account.initials} size={52} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[17px] font-semibold">{account.fullName || account.email}</div>
            <div className="mt-0.5 truncate text-sm text-muted">{account.email}</div>
          </div>
          <Badge tone={account.verified ? "success" : "warn"}>{account.verified ? t("verified") : t("unverified")}</Badge>
        </div>

        <section aria-labelledby="pref-h">
          <SectionLabel id="pref-h">{t("preferences")}</SectionLabel>
          <div className="rounded-[14px] bg-card px-3.5">
            <Row
              icon="globe"
              right={
                <Segmented
                  label={t("language")}
                  className="!gap-0 rounded-lg bg-surface !p-[3px]"
                  itemClass="h-11 rounded-md px-3 text-[13px]"
                  activeClass="bg-raised text-accent font-semibold"
                  options={[
                    { value: "id", label: "Indonesia" },
                    { value: "en", label: "English" },
                  ]}
                  value={lang}
                  onChange={(v) => !pending && setLang(v)}
                />
              }
            >
              {t("language")}
            </Row>
            <Row icon="cash" right={<span className="text-sm text-muted">{t("currencyValue")}</span>}>
              {t("currency")}
            </Row>
            <Row icon="tag" href="/settings/categories" last>
              {t("categories")}
            </Row>
          </div>
        </section>

        <section aria-labelledby="app-h">
          <SectionLabel id="app-h">{t("app")}</SectionLabel>
          <div className="rounded-[14px] bg-card px-3.5">
            <Link href="/settings/install" className="flex min-h-16 items-center justify-between gap-3 border-b border-surface text-fg no-underline hover:text-fg">
              <span className="flex items-center gap-3">
                <Icon name="phoneDownload" className="text-accent" />
                <span>
                  <span className="block text-[15px]">{t("install")}</span>
                  <span className="mt-0.5 block text-xs text-muted">{t("installSub")}</span>
                </span>
              </span>
              <span className="inline-flex h-[30px] flex-none items-center rounded-lg bg-accent px-3 text-[13px] font-semibold text-accent-ink">{t("installCta")}</span>
            </Link>
            <Row icon="bell" href="/settings/notifications">
              {t("notifications")}
            </Row>
            <Row icon="lock" href="/settings/password" last>
              {t("changePassword")}
            </Row>
          </div>
        </section>

        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className={buttonClass("surface", "lg", "h-[50px] text-[15px] !text-danger")}
        >
          {loggingOut ? t("loggingOut") : t("logout")}
        </button>
        <Link href="/settings/delete-account" className="-mt-2 self-center px-3 py-3 text-[13px] text-muted no-underline hover:text-fg-2">
          {t("deleteAccount")}
        </Link>
        <p className="-mt-1.5 mb-0 text-center text-xs text-muted">
          <Link href="/terms" className="inline-block py-2 text-fg-2 no-underline">
            {t("terms")}
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="inline-block py-2 text-fg-2 no-underline">
            {t("privacy")}
          </Link>{" "}
          · {t("version", { version: APP_VERSION })}
        </p>
      </div>
      {overlay}
    </TabScreen>
  );
}
