"use client";

import { useTranslations } from "next-intl";
import { useAppRouter } from "@/components/NavProgress";
import { useState, useTransition } from "react";
import { saveBudget } from "@/app/actions/budget";
import { Icon } from "@/components/Icon";
import { AmountInput, Button, Dot, Footer, Notice, Screen, TopBar, labelClass } from "@/components/ui";
import { unallocated } from "@/lib/budget/status";
import { MAX_AMOUNT } from "@/lib/expenses/constants";
import { dots, parseAmount, rp } from "@/lib/format";

type Row = { id: string; name: string; color: string; limit: number; lastUsed: number };

const clamp = (v: string) => Math.min(parseAmount(v), MAX_AMOUNT);

export function SetBudgetForm({
  month,
  monthLabel,
  total: initialTotal,
  threshold,
  remind: initialRemind,
  categories,
}: {
  month: string;
  monthLabel: string;
  total: number | null;
  threshold: number;
  remind: boolean;
  categories: Row[];
}) {
  const t = useTranslations("budgetEdit");
  const tv = useTranslations("validation");
  const tc = useTranslations("common");
  const router = useAppRouter();
  const back = `/budget?month=${month}`;
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [vals, setVals] = useState(categories.map((c) => c.limit));
  const [remind, setRemind] = useState(initialRemind);
  const [error, setError] = useState<string | null>(null);
  const [totalError, setTotalError] = useState(false);
  const [pending, start] = useTransition();
  const [leaving, setLeaving] = useState(false);

  const diff = unallocated(total, vals);

  const submit = () => {
    setError(null);
    if (total <= 0) {
      setTotalError(true);
      document.getElementById("b-total")?.focus();
      return;
    }
    start(async () => {
      const res = await saveBudget({
        month,
        total,
        remind,
        categories: categories.map((c, i) => ({ categoryId: c.id, amount: vals[i] ?? 0 })),
      });
      if (res.ok) {
        setLeaving(true);
        router.push(back);
      }
      else setError(tc("genericError"));
    });
  };

  return (
    <Screen
      header={<TopBar title={t("title")} back={back} />}
      footer={
        <Footer>
          <Button onClick={submit} loading={pending || leaving}>
            {pending || leaving ? tc("saving") : t("save")}
          </Button>
        </Footer>
      }
    >
      <div className="flex flex-col gap-5 px-4 pt-3 pb-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="b-total" className={labelClass}>
            {t("totalLabel", { month: monthLabel })}
          </label>
          <AmountInput
            id="b-total"
            size={34}
            placeholder="0"
            value={total ? dots(total) : ""}
            aria-invalid={totalError || undefined}
            aria-describedby={totalError ? "b-total-err" : undefined}
            onChange={(e) => {
              setTotal(clamp(e.target.value));
              setTotalError(false);
            }}
          />
          {totalError && (
            <p id="b-total-err" role="alert" className="m-0 text-[13px] text-danger">
              {tv("budgetTotalRequired")}
            </p>
          )}
        </div>

        <section aria-labelledby="alloc-h">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="alloc-h" className="m-0 text-[15px] font-semibold">
              {t("perCategory")}
            </h2>
            <span className="text-xs text-muted">{t("lastMonth")}</span>
          </div>
          <div className="rounded-[14px] bg-card px-3.5">
            {categories.map((c, i) => (
              <div key={c.id} className={`flex min-h-16 items-center gap-3 ${i < categories.length - 1 ? "border-b border-surface" : ""}`}>
                <div className="min-w-0 flex-1">
                  <label htmlFor={`b-cat-${i}`} className="flex items-center gap-2 text-[15px] font-medium">
                    <Dot color={c.color} />
                    <span className="truncate">{c.name}</span>
                  </label>
                  <div className="mt-0.5 pl-[18px] text-xs text-muted tabular-nums">{c.lastUsed ? rp(c.lastUsed) : t("noData")}</div>
                </div>
                <div className="box-border flex h-[42px] w-[140px] items-center gap-1 rounded-lg border border-raised bg-surface px-2.5 focus-within:border-accent">
                  <span className="text-[13px] text-muted">Rp</span>
                  <input
                    id={`b-cat-${i}`}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={vals[i] ? dots(vals[i]) : ""}
                    onChange={(e) => setVals(vals.map((v, j) => (j === i ? clamp(e.target.value) : v)))}
                    className="min-w-0 flex-1 border-0 bg-transparent text-right text-[15px] font-semibold text-fg tabular-nums outline-none placeholder:text-muted"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 mb-0 text-xs text-muted">{t("emptyHint")}</p>
        </section>

        {total > 0 &&
          (diff === 0 ? (
            <div role="status" className="flex items-center gap-2 rounded-[10px] bg-success-soft px-3 py-2.5 text-sm text-success">
              <Icon name="check" size={18} strokeWidth={2.4} />
              {t("allocated")}
            </div>
          ) : diff > 0 ? (
            <div role="status" className="rounded-[10px] bg-accent-soft px-3 py-2.5 text-sm text-accent tabular-nums">
              {t("unallocated", { amount: rp(diff) })}
            </div>
          ) : (
            <div role="status" className="rounded-[10px] bg-danger-soft px-3 py-2.5 text-sm text-danger tabular-nums">
              {t("overAllocated", { amount: rp(-diff) })}
            </div>
          ))}

        <label htmlFor="b-remind" className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] bg-card p-3.5">
          <span>
            <span className="block text-[15px] font-medium">{t("remind", { pct: threshold })}</span>
            <span className="mt-0.5 block text-xs text-muted">{t("remindSub")}</span>
          </span>
          <input id="b-remind" type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} className="m-0 size-5 flex-none accent-accent" />
        </label>

        {error && (
          <Notice tone="danger" icon="alertTriangle" role="alert">
            {error}
          </Notice>
        )}
      </div>
    </Screen>
  );
}
