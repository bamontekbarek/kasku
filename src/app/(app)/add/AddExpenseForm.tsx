"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { AmountInput, Button, ButtonLink, Field, Footer, Screen, TopBar, inputClass, labelClass } from "@/components/ui";
import { DAILY_SCAN_QUOTA, categoryNames, paymentMethods } from "@/lib/data";
import { cx, dots, parseAmount } from "@/lib/format";

export function AddExpenseForm({ quotaLeft }: { quotaLeft: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState<number | null>(null);
  const [cat, setCat] = useState("Makanan & Minuman");
  const [pay, setPay] = useState("QRIS");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Screen
      header={<TopBar title="Tambah Pengeluaran" back="/dashboard" />}
      footer={
        <Footer>
          {/* TODO: insert into Supabase */}
          <Button onClick={() => router.push("/dashboard")}>Simpan pengeluaran</Button>
        </Footer>
      }
    >
      <div className="flex flex-col gap-5 px-4 pt-3 pb-6">
        <section className="flex flex-col gap-3.5 rounded-[14px] border border-accent-line bg-surface p-4" aria-labelledby="ai-title">
          <div className="flex items-start gap-3">
            <div className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-accent-soft text-accent">
              <Icon name="sparkles" size={22} />
            </div>
            <div>
              <h2 id="ai-title" className="m-0 text-base font-semibold">Isi otomatis dari struk</h2>
              <p className="mt-1 mb-0 text-[13px] leading-[19px] text-muted">Foto atau pilih gambar struk — AI akan membaca dan mengisi form ini untukmu.</p>
            </div>
          </div>
          {quotaLeft > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <ButtonLink href="/scan" size="sm">
                  <Icon name="camera" strokeWidth={2} />
                  Kamera
                </ButtonLink>
                <label className={cx("flex h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-raised text-[15px] font-semibold text-fg")}>
                  <Icon name="image" strokeWidth={2} />
                  Galeri
                  {/* TODO: upload the picked image to Supabase Storage */}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.length && router.push("/scan/crop")} />
                </label>
              </div>
              <p className="m-0 text-center text-xs text-muted tabular-nums">
                Sisa scan hari ini:{" "}
                <span className="font-semibold text-fg">
                  {quotaLeft} dari {DAILY_SCAN_QUOTA}
                </span>
              </p>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <Button disabled size="sm">Kamera</Button>
                <Button disabled size="sm">Galeri</Button>
              </div>
              <p role="status" className="m-0 text-[13px] leading-[19px] text-warn">
                Kuota scan hari ini habis ({DAILY_SCAN_QUOTA} dari {DAILY_SCAN_QUOTA}). Kamu tetap bisa isi manual di bawah. Kuota kembali besok pukul 00.00 WIT.
              </p>
            </>
          )}
        </section>

        <div className="flex items-center gap-3 text-xs font-medium text-faint" aria-hidden="true">
          <div className="h-px flex-1 bg-raised" />
          ATAU ISI MANUAL
          <div className="h-px flex-1 bg-raised" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="amt" className={labelClass}>Jumlah</label>
          <AmountInput id="amt" placeholder="0" value={amount === null ? "" : dots(amount)} onChange={(e) => setAmount(e.target.value ? parseAmount(e.target.value) : null)} />
        </div>

        <Field label="Nama toko / keterangan" htmlFor="merchant">
          <input id="merchant" type="text" placeholder="Contoh: Makan siang" className={inputClass} />
        </Field>

        <Field label="Tanggal" htmlFor="date">
          <div className="relative">
            <Icon name="calendar" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
            <input id="date" type="date" defaultValue={today} className={cx(inputClass, "w-full pl-11")} />
          </div>
        </Field>

        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-2.5 p-0 text-sm font-medium text-fg-2">Kategori</legend>
          <div className="flex flex-wrap gap-2">
            {categoryNames.map((c) => {
              const on = c === cat;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCat(c)}
                  className={cx(
                    "h-9 rounded-full border px-3.5 text-sm font-medium",
                    on ? "border-accent bg-accent-soft text-accent" : "border-raised bg-surface text-fg-2",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2.5 p-0 text-sm font-medium text-fg-2">Metode pembayaran</legend>
          <div className="grid grid-cols-5 gap-1 rounded-[10px] bg-surface p-1">
            {paymentMethods.map((p) => {
              const on = p === pay;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPay(p)}
                  className={cx("h-[38px] rounded-lg border-0 text-[13px]", on ? "bg-raised font-semibold text-fg" : "bg-transparent font-medium text-muted")}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field label={<>Catatan <span className="font-normal text-muted">(opsional)</span></>} htmlFor="note">
          <textarea id="note" rows={2} placeholder="Tambahkan catatan" className={cx(inputClass, "h-auto resize-none py-3")} />
        </Field>
      </div>
    </Screen>
  );
}
