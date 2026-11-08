"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { TabScreen } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Dot, FilterPills, ScanBadge, TabHeader, pillClass } from "@/components/ui";
import { colorForShort, historyFilters, transactionDays } from "@/lib/data";
import { rp } from "@/lib/format";

/** History list with search (store, note or receipt item) and category filter. `overlay` renders a sheet on top. */
export function Transactions({ overlay }: { overlay?: ReactNode }) {
  const [filter, setFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const { groups, total } = useMemo(() => {
    let total = 0;
    const groups = transactionDays
      .map((g) => {
        const rows = g.rows.filter((r) => {
          if (filter !== "Semua" && r.category !== filter) return false;
          if (!q) return true;
          return r.name.toLowerCase().includes(q) || r.items.some((it) => it.toLowerCase().includes(q));
        });
        const sum = rows.reduce((a, r) => a + r.amount, 0);
        total += sum;
        return { day: g.day, sum, rows };
      })
      .filter((g) => g.rows.length > 0);
    return { groups, total };
  }, [filter, q]);

  const filterName = q ? `hasil "${query.trim()}"` : filter === "Semua" ? "3 hari terakhir" : `${filter} · 3 hari terakhir`;

  return (
    <TabScreen active="history">
      <TabHeader title="Riwayat">
        <div className="flex items-center gap-2">
          <Link href="/transactions/export" className={pillClass}>
            <Icon name="download" size={16} strokeWidth={2} className="text-accent" />
            Export
          </Link>
          <button type="button" className={pillClass}>
            <Icon name="calendar" size={16} className="text-muted" />
            November 2026
            <Icon name="chevronDown" size={14} strokeWidth={2} className="text-muted" />
          </button>
        </div>
      </TabHeader>

      <div className="flex flex-col gap-3.5 px-4 pt-2">
        <div className="flex h-11 items-center gap-2.5 rounded-[10px] bg-surface px-3">
          <Icon name="search" size={18} className="text-muted" />
          <label htmlFor="q" className="sr-only">
            Cari transaksi
          </label>
          <input
            id="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari toko, catatan, atau item"
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-fg outline-none placeholder:text-muted"
          />
        </div>

        <FilterPills options={historyFilters} value={filter} onChange={setFilter} />

        <div className="flex items-baseline justify-between rounded-xl bg-surface px-3.5 py-3">
          <span className="text-[13px] text-muted">Total {filterName}</span>
          <span className="text-lg font-bold tabular-nums">{rp(total)}</span>
        </div>

        {groups.map((g) => (
          <section key={g.day}>
            <div className="flex h-9 items-center justify-between text-[13px] text-muted">
              <h2 className="m-0 text-[13px] font-semibold text-fg-2">{g.day}</h2>
              <span className="tabular-nums">−{rp(g.sum)}</span>
            </div>
            <ul className="m-0 list-none rounded-xl bg-card px-3.5 py-0">
              {g.rows.map((r, i) => {
                const hits = q ? r.items.filter((it) => it.toLowerCase().includes(q)) : [];
                const nameHit = q && r.name.toLowerCase().includes(q);
                return (
                  <li key={r.id} className={i < g.rows.length - 1 ? "border-b border-surface" : undefined}>
                    <Link href={`/transactions/${r.id}`} className="box-border flex min-h-[62px] items-center gap-3 py-2.5 text-fg no-underline hover:text-fg">
                      <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-surface">
                        <Dot color={colorForShort(r.category)} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[15px] font-medium">
                          {r.name}
                          {r.scanned && <ScanBadge />}
                        </div>
                        <div className="mt-0.5 text-[13px] text-muted">
                          {r.category} · {r.payment} · {r.time}
                          {r.items.length > 0 && ` · ${r.items.length} item`}
                        </div>
                        {hits.length > 0 && !nameHit && <div className="mt-0.5 text-xs text-accent">Item cocok: {hits.join(", ")}</div>}
                      </div>
                      <span className="text-[15px] font-semibold tabular-nums">−{rp(r.amount)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {groups.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="text-base font-semibold">Tidak ada yang cocok</span>
            <span className="text-[13px] text-muted">Coba kata lain. Pencarian mencakup nama toko, catatan, dan item di struk.</span>
          </div>
        )}
      </div>
      {overlay}
    </TabScreen>
  );
}
