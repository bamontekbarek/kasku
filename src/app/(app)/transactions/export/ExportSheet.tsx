"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Sheet, SheetHeader } from "@/components/Sheet";
import { Badge, Button, ButtonLink, Segmented } from "@/components/ui";

type P = "now" | "last" | "custom";

const P: Record<P, { label: string; summary: string; file: string }> = {
  now: { label: "Bulan ini", summary: "November 2026 · 63 transaksi · Rp 4.286.400", file: "kasku_2026-11.csv" },
  last: { label: "Bulan lalu", summary: "Oktober 2026 · 58 transaksi · Rp 3.813.000", file: "kasku_2026-10.csv" },
  custom: { label: "Pilih tanggal", summary: "1–6 Nov 2026 · 24 transaksi · Rp 2.053.900", file: "kasku_2026-11-01_2026-11-06.csv" },
};

const dateClass =
  "box-border h-11 w-full min-w-0 rounded-lg border border-raised bg-bg px-2.5 text-sm text-fg outline-none focus:border-accent";

export function ExportSheet() {
  const [p, setP] = useState<P>("now");
  const [done, setDone] = useState(false);

  return (
    <Sheet labelledBy="ex-h" closeHref="/transactions">
      <div className="-mt-1.5">
        <SheetHeader id="ex-h" title="Export transaksi" closeHref="/transactions" />
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2.5 p-0 text-sm font-medium text-fg-2">Periode</legend>
        <Segmented
          className="bg-bg"
          options={(["now", "last", "custom"] as const).map((k) => ({ value: k, label: P[k].label }))}
          value={p}
          onChange={(k) => {
            setP(k);
            setDone(false);
          }}
        />
        {p === "custom" && (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ex-from" className="text-xs text-muted">Dari</label>
              <input id="ex-from" type="date" defaultValue="2026-11-01" className={dateClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ex-to" className="text-xs text-muted">Sampai</label>
              <input id="ex-to" type="date" defaultValue="2026-11-06" className={dateClass} />
            </div>
          </div>
        )}
      </fieldset>

      <div className="flex items-center justify-between rounded-[10px] bg-bg px-3.5 py-3">
        <span className="text-sm text-fg-2">Kategori</span>
        <span className="text-sm font-medium">
          Semua <span className="font-normal text-muted">(ikut filter Riwayat)</span>
        </span>
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2.5 p-0 text-sm font-medium text-fg-2">Format</legend>
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" aria-pressed="true" className="rounded-xl border-2 border-accent bg-accent-soft p-3 text-left text-fg">
            <span className="block text-[15px] font-bold">CSV</span>
            <span className="mt-0.5 block text-xs leading-[17px] text-fg-2">Untuk Excel atau Google Sheets</span>
          </button>
          <button type="button" disabled aria-pressed="false" className="rounded-xl border border-raised bg-transparent p-3 text-left text-muted">
            <span className="flex items-center gap-1.5 text-[15px] font-bold">
              PDF <Badge tone="neutral" size="xs">Segera</Badge>
            </span>
            <span className="mt-0.5 block text-xs leading-[17px]">Laporan siap dibaca</span>
          </button>
        </div>
      </fieldset>

      {done ? (
        <>
          <div role="status" className="flex items-start gap-2.5 rounded-xl bg-success-soft px-3.5 py-3">
            <Icon name="check" size={20} strokeWidth={2.4} className="mt-px flex-none text-success" />
            <span className="text-sm leading-5">
              <span className="font-semibold">{P[p].file}</span> siap. Di iPhone, pilih &quot;Simpan ke File&quot; atau kirim lewat aplikasi lain dari menu bagikan.
            </span>
          </div>
          <ButtonLink href="/transactions" variant="secondary">
            Selesai
          </ButtonLink>
        </>
      ) : (
        <>
          <p className="m-0 text-center text-sm text-fg-2 tabular-nums" aria-live="polite">
            {P[p].summary}
          </p>
          {/* TODO: generate the CSV server-side and trigger a download / share sheet */}
          <Button onClick={() => setDone(true)}>Export CSV</Button>
        </>
      )}
    </Sheet>
  );
}
