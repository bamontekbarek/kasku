"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { AmountInput, Button, Dot, Footer, Screen, TopBar, labelClass } from "@/components/ui";
import { budget } from "@/lib/data";
import { dots, parseAmount, rp } from "@/lib/format";

export function SetBudgetForm() {
  const router = useRouter();
  const [total, setTotal] = useState(budget.total);
  const [vals, setVals] = useState(budget.perCategory.map((c) => c.limit));
  const [remind, setRemind] = useState(true);

  const diff = total - vals.reduce((a, b) => a + b, 0);

  return (
    <Screen
      header={<TopBar title="Atur Anggaran" back="/budget" />}
      footer={
        <Footer>
          {/* TODO: persist budget */}
          <Button onClick={() => router.push("/budget")}>Simpan anggaran</Button>
        </Footer>
      }
    >
      <div className="flex flex-col gap-5 px-4 pt-3 pb-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="b-total" className={labelClass}>Total anggaran · {budget.month}</label>
          <AmountInput id="b-total" size={34} value={dots(total)} onChange={(e) => setTotal(parseAmount(e.target.value))} />
        </div>

        <section aria-labelledby="alloc-h">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="alloc-h" className="m-0 text-[15px] font-semibold">Batas per kategori</h2>
            <span className="text-xs text-muted">Bulan lalu terpakai</span>
          </div>
          <div className="rounded-[14px] bg-card px-3.5">
            {budget.perCategory.map((c, i) => (
              <div key={c.name} className={`flex min-h-16 items-center gap-3 ${i < budget.perCategory.length - 1 ? "border-b border-surface" : ""}`}>
                <div className="min-w-0 flex-1">
                  <label htmlFor={`b-cat-${i}`} className="flex items-center gap-2 text-[15px] font-medium">
                    <Dot color={c.color} />
                    {c.name}
                  </label>
                  <div className="mt-0.5 pl-[18px] text-xs text-muted tabular-nums">{c.lastMonth ? rp(c.lastMonth) : "Belum ada data"}</div>
                </div>
                <div className="box-border flex h-[42px] w-[140px] items-center gap-1 rounded-lg border border-raised bg-surface px-2.5 focus-within:border-accent">
                  <span className="text-[13px] text-muted">Rp</span>
                  <input
                    id={`b-cat-${i}`}
                    type="text"
                    inputMode="numeric"
                    value={dots(vals[i])}
                    onChange={(e) => setVals(vals.map((v, j) => (j === i ? parseAmount(e.target.value) : v)))}
                    className="min-w-0 flex-1 border-0 bg-transparent text-right text-[15px] font-semibold text-fg tabular-nums outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {diff === 0 ? (
          <div role="status" className="flex items-center gap-2 rounded-[10px] bg-success-soft px-3 py-2.5 text-sm text-success">
            <Icon name="check" size={18} strokeWidth={2.4} />
            Semua anggaran sudah dialokasikan
          </div>
        ) : diff > 0 ? (
          <div role="status" className="rounded-[10px] bg-accent-soft px-3 py-2.5 text-sm text-accent tabular-nums">
            Belum dialokasikan: {rp(diff)}
          </div>
        ) : (
          <div role="status" className="rounded-[10px] bg-danger-soft px-3 py-2.5 text-sm text-danger tabular-nums">
            Melebihi total anggaran: {rp(-diff)}
          </div>
        )}

        <label htmlFor="b-remind" className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] bg-card p-3.5">
          <span>
            <span className="block text-[15px] font-medium">Ingatkan saat mencapai 80%</span>
            <span className="mt-0.5 block text-xs text-muted">Notifikasi per kategori dan total</span>
          </span>
          <input id="b-remind" type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} className="m-0 size-5 flex-none accent-accent" />
        </label>
      </div>
    </Screen>
  );
}
