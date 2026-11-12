"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { TabScreen } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { ButtonLink, Dot, ScanBadge, TabHeader, pillClass } from "@/components/ui";
import { NEUTRAL_COLOR } from "@/lib/expenses/constants";
import type { Category, ExpenseRow } from "@/lib/expenses/queries";
import { weekdayDate } from "@/lib/expenses/summary";
import { cx, rp } from "@/lib/format";

export type HistoryRow = ExpenseRow & { date: string; time: string };

export type HistoryProps = {
  /** "YYYY-MM" */
  month: string;
  /** "YYYY-MM" in the user's time zone */
  thisMonth: string;
  /** "all" or a category id */
  filter: string;
  months: Array<{ value: string; label: string }>;
  today: string;
  yesterday: string;
  categories: Category[];
  rows: HistoryRow[];
};

/**
 * HIS-01 – HIS-03: one month of transactions grouped per day. Search (store, note, receipt item)
 * and the category filter run in the browser over the loaded month, so they stay instant on a weak signal.
 * `overlay` renders a sheet on top (Export).
 */
export function Transactions({ month, filter: initialFilter, months, today, yesterday, categories, rows, overlay }: HistoryProps & { overlay?: ReactNode }) {
  const t = useTranslations("history");
  const tp = useTranslations("payment");
  const locale = useLocale();
  const router = useRouter();
  const [filter, setFilter] = useState<string>(initialFilter);
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase();

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const monthLabel = months.find((m) => m.value === month)?.label ?? month;

  const { groups, total } = useMemo(() => {
    let total = 0;
    const map = new Map<string, { date: string; sum: number; rows: Array<HistoryRow & { hits: string[]; nameHit: boolean }> }>();
    for (const r of rows) {
      if (filter !== "all" && r.categoryId !== filter) continue;
      let hits: string[] = [];
      let nameHit = false;
      if (q) {
        nameHit = r.merchant.toLocaleLowerCase().includes(q) || r.note.toLocaleLowerCase().includes(q);
        hits = r.items.filter((it) => it.toLocaleLowerCase().includes(q));
        if (!nameHit && hits.length === 0) continue;
      }
      total += r.amount;
      const g = map.get(r.date) ?? { date: r.date, sum: 0, rows: [] };
      g.sum += r.amount;
      g.rows.push({ ...r, hits, nameHit });
      map.set(r.date, g);
    }
    return { groups: [...map.values()], total };
  }, [rows, filter, q]);

  const dayLabel = (date: string) => {
    const base = weekdayDate(date, locale);
    if (date === today) return `${t("today")} · ${base}`;
    if (date === yesterday) return `${t("yesterday")} · ${base}`;
    return base;
  };

  const filterName = byId.get(filter)?.name;
  const totalLabel = q ? t("totalQuery", { q: query.trim() }) : filterName ? `${filterName} · ${monthLabel}` : monthLabel;

  return (
    <TabScreen active="history">
      <TabHeader title={t("title")}>
        <div className="flex items-center gap-2">
          <Link href={`/transactions/export?month=${month}${filter !== "all" ? `&category=${filter}` : ""}`} className={pillClass}>
            <Icon name="download" size={16} strokeWidth={2} className="text-accent" />
            {t("export")}
          </Link>
          <label className={cx(pillClass, "relative")}>
            <Icon name="calendar" size={16} className="text-muted" />
            {monthLabel}
            <Icon name="chevronDown" size={14} strokeWidth={2} className="text-muted" />
            <select
              aria-label={t("month")}
              value={month}
              onChange={(e) => router.push(`/transactions?month=${e.target.value}${filter !== "all" ? `&category=${filter}` : ""}`)}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </TabHeader>

      <div className="flex flex-col gap-3.5 px-4 pt-2">
        <div className="flex h-11 items-center gap-2.5 rounded-[10px] bg-surface px-3">
          <Icon name="search" size={18} className="text-muted" />
          <label htmlFor="q" className="sr-only">
            {t("searchLabel")}
          </label>
          <input
            id="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-fg outline-none placeholder:text-muted"
          />
        </div>

        <div role="group" aria-label={t("filtersLabel")} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {[{ id: "all", name: t("all") }, ...categories].map((c) => {
            const on = c.id === filter;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(c.id)}
                className={cx("h-[34px] flex-none rounded-lg border-0 px-3.5 text-sm", on ? "bg-raised font-semibold text-fg" : "bg-transparent font-medium text-muted")}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-baseline justify-between gap-3 rounded-xl bg-surface px-3.5 py-3">
          <span className="min-w-0 truncate text-[13px] text-muted">{t("total", { label: totalLabel })}</span>
          <span className="text-lg font-bold tabular-nums" aria-live="polite">
            {rp(total)}
          </span>
        </div>

        {groups.map((g) => (
          <section key={g.date}>
            <div className="flex h-9 items-center justify-between text-[13px] text-muted">
              <h2 className="m-0 text-[13px] font-semibold text-fg-2">{dayLabel(g.date)}</h2>
              <span className="tabular-nums">−{rp(g.sum)}</span>
            </div>
            <ul className="m-0 list-none rounded-xl bg-card px-3.5 py-0">
              {g.rows.map((r, i) => {
                const cat = byId.get(r.categoryId);
                return (
                  <li key={r.id} className={i < g.rows.length - 1 ? "border-b border-surface" : undefined}>
                    <Link href={`/transactions/${r.id}`} className="box-border flex min-h-[62px] items-center gap-3 py-2.5 text-fg no-underline hover:text-fg">
                      <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-surface">
                        <Dot color={cat?.color ?? NEUTRAL_COLOR} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[15px] font-medium">
                          <span className="truncate">{r.merchant || cat?.name}</span>
                          {r.source === "scan" && <ScanBadge />}
                        </div>
                        <div className="mt-0.5 text-[13px] text-muted">
                          {cat?.name} · {tp(r.payment)} · {r.time}
                          {r.items.length > 0 && ` · ${t("itemCount", { count: r.items.length })}`}
                        </div>
                        {r.hits.length > 0 && !r.nameHit && <div className="mt-0.5 text-xs text-accent">{t("itemMatch", { items: r.hits.join(", ") })}</div>}
                      </div>
                      <span className="text-[15px] font-semibold tabular-nums">−{rp(r.amount)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="text-base font-semibold">{t("emptyMonthTitle")}</span>
            <span className="text-[13px] text-muted">{t("emptyMonthBody", { month: monthLabel })}</span>
            <ButtonLink href="/add" size="sm" className="mt-3 px-5">
              <Icon name="plus" strokeWidth={2} />
              {t("addCta")}
            </ButtonLink>
          </div>
        ) : (
          groups.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span className="text-base font-semibold">{t("emptyTitle")}</span>
              <span className="text-[13px] text-muted">{t("emptyBody")}</span>
            </div>
          )
        )}
      </div>
      {overlay}
    </TabScreen>
  );
}
