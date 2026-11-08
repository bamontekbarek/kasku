import type { Metadata } from "next";
import { TabScreen } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Badge, ButtonLink, Dot, ProgressBar, TabHeader, pillClass } from "@/components/ui";
import { budget } from "@/lib/data";
import { rp } from "@/lib/format";

export const metadata: Metadata = { title: "Anggaran" };

export default function BudgetPage() {
  const usedPct = Math.round((budget.used / budget.total) * 100);
  const left = budget.total - budget.used;
  const perDay = Math.round(left / budget.daysLeft / 100) * 100;
  const overCats = budget.perCategory.filter((c) => c.used > c.limit);

  return (
    <TabScreen active="budget">
      <TabHeader title="Anggaran">
        <button type="button" className={pillClass}>
          <Icon name="calendar" size={16} className="text-muted" />
          {budget.month}
          <Icon name="chevronDown" size={14} strokeWidth={2} className="text-muted" />
        </button>
      </TabHeader>

      <div className="flex flex-col gap-4 px-4 pt-2">
        <section className="flex flex-col gap-3 rounded-[14px] bg-surface p-4" aria-label="Ringkasan anggaran">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] text-muted">Total terpakai</div>
              <div className="mt-0.5 text-[30px] leading-9 font-bold tracking-[-0.5px] tabular-nums">{rp(budget.used)}</div>
              <div className="mt-0.5 text-[13px] text-muted tabular-nums">dari {rp(budget.total)}</div>
            </div>
            <Badge size="md" className="h-[26px] px-2.5 text-[13px] font-bold">
              {usedPct}%
            </Badge>
          </div>
          <ProgressBar pct={usedPct} height={10} />
          <div className="grid grid-cols-2 gap-2.5 border-t border-raised pt-3">
            <div>
              <div className="text-xs text-muted">Sisa anggaran</div>
              <div className="mt-0.5 text-[17px] font-semibold tabular-nums">{rp(left)}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Batas aman per hari</div>
              <div className="mt-0.5 text-[17px] font-semibold tabular-nums">±{rp(perDay)}</div>
              <div className="text-xs text-muted">{budget.daysLeft} hari lagi</div>
            </div>
          </div>
        </section>

        {overCats.map((c) => (
          <div key={c.name} role="status" className="flex items-start gap-2.5 rounded-xl border border-danger-line bg-danger-soft px-3.5 py-3">
            <Icon name="alertTriangle" size={20} strokeWidth={2} className="mt-px flex-none text-danger" />
            <p className="m-0 text-sm leading-5 text-fg">
              <strong className="font-semibold">{c.name}</strong> sudah lewat batas <span className="font-semibold text-danger">{rp(c.used - c.limit)}</span>.
            </p>
          </div>
        ))}

        <section aria-labelledby="percat-h">
          <h2 id="percat-h" className="m-0 mb-2 text-[17px] font-semibold">Per kategori</h2>
          <ul className="m-0 list-none rounded-[14px] bg-card px-3.5 py-0">
            {budget.perCategory.map((c, i) => {
              const pct = Math.round((c.used / c.limit) * 100);
              const over = c.used > c.limit;
              const warn = !over && pct >= 80;
              const bar = over ? "var(--color-danger)" : warn ? "var(--color-accent)" : "var(--color-success)";
              return (
                <li key={c.name} className={`flex flex-col gap-2 py-3.5 ${i < budget.perCategory.length - 1 ? "border-b border-surface" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2.5 text-[15px] font-medium">
                      <Dot color={c.color} />
                      {c.name}
                    </span>
                    {over ? (
                      <Badge tone="danger" size="sm">Lewat batas</Badge>
                    ) : warn ? (
                      <Badge tone="accent" size="sm">Hampir habis</Badge>
                    ) : (
                      <Badge tone="success" size="sm">Aman</Badge>
                    )}
                  </div>
                  <ProgressBar pct={pct} color={bar} />
                  <div className="flex justify-between text-[13px] tabular-nums">
                    <span className="text-fg-2">
                      {rp(c.used)} <span className="text-muted">/ {rp(c.limit)}</span>
                    </span>
                    <span className={over ? "font-medium text-danger" : "font-medium text-muted"}>
                      {over ? `Lewat ${rp(c.used - c.limit)}` : `Sisa ${rp(c.limit - c.used)}`} · {pct}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <ButtonLink href="/budget/edit" variant="secondary" className="h-[50px] text-[15px]">
          <Icon name="pencil" size={18} strokeWidth={2} />
          Atur anggaran
        </ButtonLink>
      </div>
    </TabScreen>
  );
}
