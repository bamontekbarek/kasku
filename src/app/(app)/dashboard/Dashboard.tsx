"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TabScreen } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Avatar, ButtonLink, Dot, ScanBadge } from "@/components/ui";
import { NEUTRAL_COLOR, PERIODS, type Period } from "@/lib/expenses/constants";
import { formatPct, shortAmount } from "@/lib/expenses/summary";
import { cx, rp } from "@/lib/format";

export type PeriodView = {
  caption: string;
  prev: string;
  total: number;
  count: number;
  max: number;
  delta: number | null;
  series: Array<{ key: string; label: string; total: number }>;
};

export type DashboardData = {
  periods: Record<Period, PeriodView>;
  /** "November 2026" */
  month: string;
  top: Array<{ id: string; name: string; color: string; amount: number; pct: number }>;
  recent: Array<{ id: string; name: string; category: string; color?: string; when: string; amount: number; scanned: boolean }>;
};

function greetingKey(hour: number) {
  if (hour < 11) return "morning" as const;
  if (hour < 15) return "afternoon" as const;
  if (hour < 18) return "evening" as const;
  return "night" as const;
}

const HIDDEN_KEY = "kasku:hide-amounts";

export function Dashboard({ offline, user, data }: { offline: boolean; user: { name: string; initials: string }; data: DashboardData }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>("month");
  const [hidden, setHidden] = useState(false);
  const [hello, setHello] = useState<ReturnType<typeof greetingKey> | null>(null);

  useEffect(() => {
    setHello(greetingKey(new Date().getHours()));
    try {
      setHidden(localStorage.getItem(HIDDEN_KEY) === "1");
    } catch {}
  }, []);

  const toggleHidden = () => {
    const next = !hidden;
    setHidden(next);
    try {
      localStorage.setItem(HIDDEN_KEY, next ? "1" : "0");
    } catch {}
  };

  const cur = data.periods[period];
  const max = Math.max(1, ...cur.series.map((s) => s.total));
  const last = cur.series.length - 1;
  const money = (v: number, mask = "Rp ••••") => (hidden ? mask : rp(v));
  const up = cur.delta !== null && cur.delta > 0;
  const deltaText =
    cur.delta === null
      ? t("noCompare", { prev: cur.prev })
      : Math.abs(cur.delta) < 0.05
        ? t("same", { prev: cur.prev })
        : t(up ? "up" : "down", { pct: formatPct(cur.delta, locale), prev: cur.prev });

  return (
    <TabScreen active="home">
      <header className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <Avatar initials={user.initials} />
          <div>
            <div className="min-h-4 text-xs text-muted">{hello ? t(hello) : ""}</div>
            <div className="text-base font-semibold">{user.name}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <Link href="/transactions" aria-label={t("search")} className="flex size-11 items-center justify-center text-fg hover:text-fg">
            <Icon name="search" size={22} />
          </Link>
          <Link href="/notifications" aria-label={t("notifications")} className="flex size-11 items-center justify-center text-fg hover:text-fg">
            <Icon name="bell" size={22} />
          </Link>
        </div>
      </header>

      {offline && (
        <div role="status" className="mx-4 mb-1 flex items-center gap-2.5 rounded-[10px] border border-raised bg-surface px-3 py-2.5 text-[13px] leading-[18px] text-fg-2">
          <Icon name="wifiOff" size={18} strokeWidth={2} className="flex-none text-warn" />
          <span>
            <span className="font-semibold text-fg">{t("offline")}</span> {t("offlineBody")}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4 px-4 pt-2">
        <div role="tablist" aria-label={t("periodsLabel")} className="flex gap-5 border-b border-surface">
          {PERIODS.map((k) => {
            const on = k === period;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPeriod(k)}
                className={cx(
                  "-mb-px h-10 border-0 border-b-2 bg-transparent p-0 text-[15px]",
                  on ? "border-accent font-semibold text-fg" : "border-transparent font-medium text-muted",
                )}
              >
                {t(k)}
              </button>
            );
          })}
        </div>

        <section className="flex flex-col gap-1.5" aria-label={t("summary")}>
          <div className="flex items-center gap-1.5 text-sm text-muted">
            {t("totalLabel", { caption: cur.caption })}
            <button
              type="button"
              onClick={toggleHidden}
              aria-label={hidden ? t("showAmounts") : t("hideAmounts")}
              aria-pressed={hidden}
              className="-my-1.5 -ml-1 flex size-11 items-center justify-center border-0 bg-transparent text-muted"
            >
              <Icon name="eye" size={18} />
            </button>
          </div>
          <div className="text-[34px] leading-10 font-bold tracking-[-0.6px] tabular-nums">{money(cur.total, "Rp ••••••")}</div>
          <div className="flex items-center gap-2 text-sm">
            {cur.delta === null || Math.abs(cur.delta) < 0.05 ? (
              <span className="text-muted">{deltaText}</span>
            ) : (
              <>
                <span className={cx("font-semibold", up ? "text-danger" : "text-success")} aria-hidden="true">
                  {up ? "▲" : "▼"} {formatPct(cur.delta, locale)}
                </span>
                <span className="text-muted" aria-hidden="true">
                  {t("vs", { prev: cur.prev })}
                </span>
                <span className="sr-only">{deltaText}</span>
              </>
            )}
          </div>
        </section>

        <section className="rounded-[14px] bg-surface px-3.5 pt-4 pb-3" aria-label={t("chart")}>
          <div className="flex h-[150px] items-end justify-between gap-1.5">
            {cur.series.map((s, i) => (
              <div key={s.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className={cx("text-[11px] tabular-nums", i === last ? "text-accent" : "text-muted")}>{hidden ? "••" : shortAmount(s.total, locale)}</span>
                <div
                  className={cx("w-full max-w-[30px] rounded-[6px_6px_2px_2px]", i === last ? "bg-accent" : "bg-edge")}
                  style={{ height: Math.max(6, Math.round((s.total / max) * 112)) }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between gap-1.5 border-t border-raised pt-2">
            {cur.series.map((s, i) => (
              <span key={s.key} className={cx("flex-1 text-center text-[11px]", i === last ? "text-fg" : "text-muted")}>
                {s.label}
              </span>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-surface px-3.5 py-3">
            <div className="text-xs text-muted">{t("count")}</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">{cur.count}</div>
          </div>
          <div className="rounded-xl bg-surface px-3.5 py-3">
            <div className="text-xs text-muted">{t("biggest")}</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">{money(cur.max)}</div>
          </div>
        </div>

        {/* DASH-06: real budget numbers arrive with M4 (budgets table). */}
        <Link href="/budget/edit" className="flex items-center gap-3 rounded-xl bg-surface p-3.5 text-fg no-underline hover:text-fg">
          <Icon name="wallet" size={20} className="flex-none text-fg-2" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{t("budgetTitle")}</span>
            <span className="mt-0.5 block text-xs leading-[17px] text-muted">{t("budgetEmpty")}</span>
          </span>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-accent">
            {t("budgetCta")}
            <Icon name="chevronRight" size={16} strokeWidth={2} className="text-muted" />
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-2.5">
          <ButtonLink href="/scan" size="md">
            <Icon name="scan" strokeWidth={2} />
            {t("scan")}
          </ButtonLink>
          <ButtonLink href="/add" variant="secondary" size="md">
            <Icon name="plus" strokeWidth={2} />
            {t("manual")}
          </ButtonLink>
        </div>

        <section className="flex flex-col gap-3" aria-labelledby="cat-h">
          <div className="flex items-baseline justify-between">
            <h2 id="cat-h" className="m-0 text-[17px] font-semibold">
              {t("topCategories")}
            </h2>
            <span className="text-[13px] text-muted">{data.month}</span>
          </div>
          {data.top.length === 0 ? (
            <p className="m-0 text-sm text-muted">{t("topEmpty")}</p>
          ) : (
            <>
              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]" aria-hidden="true">
                {data.top.map((c) => (
                  <div key={c.id} style={{ width: `${c.pct}%`, background: c.color }} />
                ))}
              </div>
              <ul className="m-0 flex list-none flex-col p-0">
                {data.top.map((c) => (
                  <li key={c.id} className="flex h-11 items-center gap-3">
                    <Dot color={c.color} />
                    <span className="min-w-0 flex-1 truncate text-[15px]">{c.name}</span>
                    <span className="w-10 text-right text-[13px] text-muted">{Math.round(c.pct)}%</span>
                    <span className="w-[110px] text-right text-[15px] font-medium tabular-nums">{money(c.amount)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="flex flex-col" aria-labelledby="recent-h">
          <div className="flex h-10 items-center justify-between">
            <h2 id="recent-h" className="m-0 text-[17px] font-semibold">
              {t("recent")}
            </h2>
            <Link href="/transactions" className="text-sm font-medium no-underline">
              {t("seeAll")}
            </Link>
          </div>
          <ul className="m-0 list-none p-0">
            {data.recent.map((r) => (
              <li key={r.id} className="border-b border-surface">
                <Link href={`/transactions/${r.id}`} className="flex h-16 items-center gap-3 text-fg no-underline hover:text-fg">
                  <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-surface">
                    <Dot color={r.color ?? NEUTRAL_COLOR} size={12} radius={4} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[15px] font-medium">
                      <span className="truncate">{r.name}</span>
                      {r.scanned && <ScanBadge />}
                    </div>
                    <div className="mt-0.5 truncate text-[13px] text-muted">
                      {r.category} · {r.when}
                    </div>
                  </div>
                  <span className="text-[15px] font-semibold tabular-nums">−{money(r.amount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </TabScreen>
  );
}
