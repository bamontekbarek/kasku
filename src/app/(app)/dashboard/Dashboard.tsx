"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TabScreen } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Avatar, ButtonLink, Dot, ProgressBar, ScanBadge } from "@/components/ui";
import { budget, periodStats, recentTransactions, topCategories, user, type Period } from "@/lib/data";
import { cx, rp, short } from "@/lib/format";

const periods: Period[] = ["harian", "mingguan", "bulanan", "tahunan"];

function greeting(hour: number) {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export function Dashboard({ offline }: { offline: boolean }) {
  const [period, setPeriod] = useState<Period>("bulanan");
  const [hidden, setHidden] = useState(false);
  const [hello, setHello] = useState("Selamat malam");
  useEffect(() => setHello(greeting(new Date().getHours())), []);

  const cur = periodStats[period];
  const max = Math.max(...cur.series.map(([, v]) => v));
  const last = cur.series.length - 1;
  const usedPct = Math.round((budget.used / budget.total) * 100);

  return (
    <TabScreen active="home">
      <header className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <Avatar initials={user.initials} />
          <div>
            <div className="text-xs text-muted">{hello}</div>
            <div className="text-base font-semibold">{user.name}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <Link href="/transactions" aria-label="Cari transaksi" className="flex size-11 items-center justify-center text-fg hover:text-fg">
            <Icon name="search" size={22} />
          </Link>
          <Link href="/notifications" aria-label="Notifikasi, 3 belum dibaca" className="relative flex size-11 items-center justify-center text-fg hover:text-fg">
            <Icon name="bell" size={22} />
            <span className="absolute top-2.5 right-[11px] size-2 rounded-full bg-accent" />
          </Link>
        </div>
      </header>

      {offline && (
        <div role="status" className="mx-4 mb-1 flex items-center gap-2.5 rounded-[10px] border border-raised bg-surface px-3 py-2.5 text-[13px] leading-[18px] text-fg-2">
          <Icon name="wifiOff" size={18} strokeWidth={2} className="flex-none text-warn" />
          <span>
            <span className="font-semibold text-fg">Sedang offline.</span> Menampilkan data terakhir (diperbarui 19:45). Data baru dikirim otomatis saat online.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4 px-4 pt-2">
        <div role="tablist" aria-label="Periode" className="flex gap-5 border-b border-surface">
          {periods.map((k) => {
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
                {periodStats[k].label}
              </button>
            );
          })}
        </div>

        <section className="flex flex-col gap-1.5" aria-label="Ringkasan">
          <div className="flex items-center gap-1.5 text-sm text-muted">
            Total pengeluaran · {cur.caption}
            <button
              type="button"
              onClick={() => setHidden(!hidden)}
              aria-label={hidden ? "Tampilkan nominal" : "Sembunyikan nominal"}
              aria-pressed={hidden}
              className="-ml-1 flex size-8 items-center justify-center border-0 bg-transparent text-muted"
            >
              <Icon name="eye" size={18} />
            </button>
          </div>
          <div className="text-[34px] leading-10 font-bold tracking-[-0.6px] tabular-nums">{hidden ? "Rp ••••••" : rp(cur.total)}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className={cx("font-semibold", cur.up ? "text-danger" : "text-success")}>
              {cur.up ? "▲" : "▼"} {cur.delta}
            </span>
            <span className="text-muted">vs {cur.prev}</span>
          </div>
        </section>

        <section className="rounded-[14px] bg-surface px-3.5 pt-4 pb-3" aria-label="Grafik pengeluaran">
          <div className="flex h-[150px] items-end justify-between gap-1.5">
            {cur.series.map(([label, v], i) => (
              <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className={cx("text-[11px] tabular-nums", i === last ? "text-accent" : "text-muted")}>{hidden ? "••" : short(v)}</span>
                <div
                  className={cx("w-full max-w-[30px] rounded-[6px_6px_2px_2px]", i === last ? "bg-accent" : "bg-edge")}
                  style={{ height: Math.max(6, Math.round((v / max) * 112)) }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between gap-1.5 border-t border-raised pt-2">
            {cur.series.map(([label], i) => (
              <span key={label} className={cx("flex-1 text-center text-[11px]", i === last ? "text-fg" : "text-muted")}>
                {label}
              </span>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-surface px-3.5 py-3">
            <div className="text-xs text-muted">Jumlah transaksi</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">{cur.count}</div>
          </div>
          <div className="rounded-xl bg-surface px-3.5 py-3">
            <div className="text-xs text-muted">Transaksi terbesar</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">{hidden ? "Rp ••••" : cur.max}</div>
          </div>
        </div>

        <Link href="/budget" className="flex flex-col gap-2.5 rounded-xl bg-surface p-3.5 text-fg no-underline hover:text-fg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Icon name="wallet" size={18} className="text-fg-2" />
              Anggaran bulan ini
            </span>
            <span className="flex items-center gap-1 text-[13px] font-semibold text-accent">
              {usedPct}% terpakai
              <Icon name="chevronRight" size={16} strokeWidth={2} className="text-muted" />
            </span>
          </div>
          <ProgressBar pct={usedPct} />
          <div className="flex justify-between text-xs text-muted tabular-nums">
            <span>
              {rp(budget.used)} dari {rp(budget.total)}
            </span>
            <span>Sisa {rp(budget.total - budget.used)}</span>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-2.5">
          <ButtonLink href="/scan" size="md">
            <Icon name="scan" strokeWidth={2} />
            Scan struk
          </ButtonLink>
          <ButtonLink href="/add" variant="secondary" size="md">
            <Icon name="plus" strokeWidth={2} />
            Input manual
          </ButtonLink>
        </div>

        <section className="flex flex-col gap-3" aria-labelledby="cat-h">
          <div className="flex items-baseline justify-between">
            <h2 id="cat-h" className="m-0 text-[17px] font-semibold">Kategori teratas</h2>
            <span className="text-[13px] text-muted">{budget.month}</span>
          </div>
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]" aria-hidden="true">
            {topCategories.map((c) => (
              <div key={c.name} style={{ width: `${c.pct}%`, background: c.color }} />
            ))}
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {topCategories.map((c) => (
              <li key={c.name} className="flex h-11 items-center gap-3">
                <Dot color={c.color} />
                <span className="flex-1 text-[15px]">{c.name}</span>
                <span className="w-10 text-right text-[13px] text-muted">{c.pct}%</span>
                <span className="w-[110px] text-right text-[15px] font-medium tabular-nums">{hidden ? "Rp ••••" : rp(c.amount)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col" aria-labelledby="recent-h">
          <div className="flex h-10 items-center justify-between">
            <h2 id="recent-h" className="m-0 text-[17px] font-semibold">Transaksi terbaru</h2>
            <Link href="/transactions" className="text-sm font-medium no-underline">
              Lihat semua
            </Link>
          </div>
          <ul className="m-0 list-none p-0">
            {recentTransactions.map((r) => (
              <li key={r.name + r.time} className="flex h-16 items-center gap-3 border-b border-surface">
                <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-surface" style={{ color: r.color }}>
                  <Icon name={r.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[15px] font-medium">
                    {r.name}
                    {r.scanned && <ScanBadge />}
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted">
                    {r.category} · {r.time}
                  </div>
                </div>
                <span className="text-[15px] font-semibold tabular-nums">−{hidden ? "Rp ••••" : rp(r.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </TabScreen>
  );
}
