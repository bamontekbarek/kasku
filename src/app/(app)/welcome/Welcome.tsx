import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { TabScreen } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Avatar, ButtonLink, ChevronRight, ProgressBar } from "@/components/ui";
import { getAccount } from "@/lib/auth/account";
import { todayIn } from "@/lib/expenses/dates";
import { monthTitle } from "@/lib/expenses/summary";

/** Dashboard for a brand-new user with no transactions yet. */
export async function Welcome() {
  const [account, locale, t, td] = await Promise.all([getAccount(), getLocale(), getTranslations("welcome"), getTranslations("dashboard")]);
  const name = account.fullName || account.email;
  const steps = [
    { label: t("stepFirst"), href: "/add" },
    { label: t("stepBudget"), href: "/budget/edit" },
    { label: t("stepInstall"), href: "/settings/install" },
  ];

  return (
    <TabScreen active="home">
      <header className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <Avatar initials={account.initials} />
          <div>
            <div className="text-xs text-muted">{t("hello")}</div>
            <div className="text-base font-semibold">{name}</div>
          </div>
        </div>
        <Link href="/notifications" aria-label={td("notifications")} className="flex size-11 items-center justify-center text-fg hover:text-fg">
          <Icon name="bell" size={22} />
        </Link>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-2">
        <section className="flex flex-col gap-3.5 rounded-2xl border border-accent-line bg-surface p-[18px]">
          <div className="flex items-center gap-3.5">
            <span className="flex size-[52px] flex-none items-center justify-center rounded-[14px] bg-accent-soft text-accent">
              <Icon name="receipt" size={28} />
            </span>
            <div>
              <h1 className="m-0 text-lg leading-6 font-bold">{t("title")}</h1>
              <p className="mt-1 mb-0 text-[13px] leading-[19px] text-fg-2">{t("sub")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <ButtonLink href="/scan" size="md">
              <Icon name="scan" strokeWidth={2} />
              {td("scan")}
            </ButtonLink>
            <ButtonLink href="/add" variant="secondary" size="md">
              <Icon name="plus" strokeWidth={2} />
              {td("manual")}
            </ButtonLink>
          </div>
        </section>

        <section className="flex flex-col gap-1" aria-label={td("summary")}>
          <div className="text-sm text-muted">{td("totalLabel", { caption: monthTitle(todayIn(account.timeZone).slice(0, 7), locale) })}</div>
          <div className="text-[34px] leading-10 font-bold text-faint tabular-nums">Rp 0</div>
          <div className="text-[13px] text-muted">{t("emptyHint")}</div>
        </section>

        <section aria-labelledby="start-h" className="rounded-[14px] bg-card px-3.5 py-1">
          <div className="flex h-12 items-center justify-between">
            <h2 id="start-h" className="m-0 text-[15px] font-semibold">
              {t("steps")}
            </h2>
            <span className="text-[13px] text-muted">{t("progress", { done: 1, total: steps.length + 1 })}</span>
          </div>
          <div className="mb-1.5">
            <ProgressBar pct={100 / (steps.length + 1)} height={4} />
          </div>
          <ul className="m-0 list-none p-0">
            <li className="flex min-h-[52px] items-center gap-3 border-b border-surface">
              <span className="flex size-6 flex-none items-center justify-center rounded-full bg-success text-bg">
                <Icon name="check" size={14} strokeWidth={3} />
              </span>
              <span className="flex-1 text-[15px] text-muted line-through">{t("stepAccount")}</span>
            </li>
            {steps.map((s, i) => (
              <li key={s.href} className={i < steps.length - 1 ? "border-b border-surface" : undefined}>
                <Link href={s.href} className="flex min-h-[52px] items-center gap-3 text-fg no-underline hover:text-fg">
                  <span className="box-border size-6 flex-none rounded-full border-2 border-edge" aria-hidden="true" />
                  <span className="flex-1 text-[15px]">{s.label}</span>
                  <ChevronRight />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </TabScreen>
  );
}
