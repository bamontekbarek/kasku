import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TabScreen } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { MonthPill } from "@/components/MonthPill";
import { Badge, ButtonLink, Dot, ProgressBar, StateIcon, TabHeader } from "@/components/ui";
import { budgetLevel, safePerDay, usedPct, type BudgetLevel } from "@/lib/budget/status";
import { rp } from "@/lib/format";
import { loadBudget } from "./load";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("budget") };
}

const barColor: Record<BudgetLevel, string> = {
  safe: "var(--color-success)",
  near: "var(--color-accent)",
  over: "var(--color-danger)",
};
const badgeTone = { safe: "success", near: "accent", over: "danger" } as const;

/** BUD-03, BUD-04: this month's budget, usage, safe daily spend and per-category status. */
export default async function BudgetPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: monthParam } = await searchParams;
  const [{ month, monthLabel, months, status }, t] = await Promise.all([loadBudget(monthParam), getTranslations("budget")]);
  const editHref = `/budget/edit?month=${month}`;

  const header = (
    <TabHeader title={t("title")}>
      <MonthPill path="/budget" month={month} months={months} label={t("month")} />
    </TabHeader>
  );

  if (status.total === null) {
    return (
      <TabScreen active="budget">
        {header}
        <div className="flex flex-col items-center gap-2.5 px-6 pt-16 text-center">
          <StateIcon icon="wallet" bg="var(--color-surface)" fg="var(--color-accent)" size={72} iconSize={32} />
          <h2 className="m-0 mt-2 text-lg font-semibold">{t("emptyTitle")}</h2>
          <p className="m-0 text-sm leading-5 text-muted">{t("emptyBody", { month: monthLabel })}</p>
          <ButtonLink href={editHref} size="md" className="mt-4 px-6">
            <Icon name="pencil" size={18} strokeWidth={2} />
            {t("edit")}
          </ButtonLink>
        </div>
      </TabScreen>
    );
  }

  const total = status.total;
  const pct = usedPct(status.used, total);
  const left = total - status.used;
  const totalLevel = budgetLevel(status.used, total, status.threshold);
  const limited = status.categories.filter((c) => c.limit !== null);
  const overCats = limited.filter((c) => c.used > c.limit!);

  return (
    <TabScreen active="budget">
      {header}

      <div className="flex flex-col gap-4 px-4 pt-2">
        <section className="flex flex-col gap-3 rounded-[14px] bg-surface p-4" aria-label={t("summaryLabel")}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] text-muted">{t("used")}</div>
              <div className="mt-0.5 text-[30px] leading-9 font-bold tracking-[-0.5px] tabular-nums">{rp(status.used)}</div>
              <div className="mt-0.5 text-[13px] text-muted tabular-nums">{t("of", { total: rp(total) })}</div>
            </div>
            <Badge tone={badgeTone[totalLevel]} size="md" className="h-[26px] px-2.5 text-[13px] font-bold">
              {pct}%
            </Badge>
          </div>
          <ProgressBar pct={pct} height={10} color={barColor[totalLevel]} />
          <div className="grid grid-cols-2 gap-2.5 border-t border-raised pt-3">
            <div>
              <div className="text-xs text-muted">{left >= 0 ? t("left") : t("overTotal")}</div>
              <div className={`mt-0.5 text-[17px] font-semibold tabular-nums ${left < 0 ? "text-danger" : ""}`}>{rp(Math.abs(left))}</div>
            </div>
            <div>
              <div className="text-xs text-muted">{t("perDay")}</div>
              {status.daysLeft > 0 ? (
                <>
                  <div className="mt-0.5 text-[17px] font-semibold tabular-nums">±{rp(safePerDay(left, status.daysLeft))}</div>
                  <div className="text-xs text-muted">{t("daysLeft", { count: status.daysLeft })}</div>
                </>
              ) : (
                <div className="mt-0.5 text-[15px] font-medium text-muted">{t("monthEnded")}</div>
              )}
            </div>
          </div>
        </section>

        {overCats.map((c) => (
          <div key={c.id} role="status" className="flex items-start gap-2.5 rounded-xl border border-danger-line bg-danger-soft px-3.5 py-3">
            <Icon name="alertTriangle" size={20} strokeWidth={2} className="mt-px flex-none text-danger" />
            <p className="m-0 text-sm leading-5 text-fg">
              {t.rich("overBanner", {
                name: c.name,
                amount: rp(c.used - c.limit!),
                b: (s) => <strong className="font-semibold">{s}</strong>,
                r: (s) => <span className="font-semibold text-danger">{s}</span>,
              })}
            </p>
          </div>
        ))}

        <section aria-labelledby="percat-h">
          <h2 id="percat-h" className="m-0 mb-2 text-[17px] font-semibold">
            {t("perCategory")}
          </h2>
          {limited.length === 0 ? (
            <p className="m-0 rounded-[14px] bg-card px-3.5 py-4 text-sm text-muted">{t("noCategoryLimits")}</p>
          ) : (
            <ul className="m-0 list-none rounded-[14px] bg-card px-3.5 py-0">
              {limited.map((c, i) => {
                const limit = c.limit!;
                const p = usedPct(c.used, limit);
                const level = budgetLevel(c.used, limit, status.threshold);
                return (
                  <li key={c.id} className={`flex flex-col gap-2 py-3.5 ${i < limited.length - 1 ? "border-b border-surface" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2.5 text-[15px] font-medium">
                        <Dot color={c.color} />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <Badge tone={badgeTone[level]} size="sm">
                        {t(level)}
                      </Badge>
                    </div>
                    <ProgressBar pct={p} color={barColor[level]} />
                    <div className="flex justify-between gap-2 text-[13px] tabular-nums">
                      <span className="text-fg-2">
                        {rp(c.used)} <span className="text-muted">/ {rp(limit)}</span>
                      </span>
                      <span className={level === "over" ? "font-medium text-danger" : "font-medium text-muted"}>
                        {level === "over" ? t("overBy", { amount: rp(c.used - limit), pct: p }) : t("leftOf", { amount: rp(limit - c.used), pct: p })}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <ButtonLink href={editHref} variant="secondary" className="h-[50px] text-[15px]">
          <Icon name="pencil" size={18} strokeWidth={2} />
          {t("edit")}
        </ButtonLink>
      </div>
    </TabScreen>
  );
}
