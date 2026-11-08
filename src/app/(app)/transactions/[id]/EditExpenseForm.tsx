"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ReceiptThumb } from "@/components/Receipt";
import { AmountInput, Button, ButtonLink, Field, Footer, ScanBadge, Screen, TopBar, inputClass, labelClass, selectClass } from "@/components/ui";
import { categoryNames, paymentOptions } from "@/lib/data";
import { cx, dots, parseAmount, rp } from "@/lib/format";

type Tx = {
  name: string;
  amount: number;
  date: string;
  time: string;
  category: string;
  payment: string;
  scanned: boolean;
  recordedAt: string;
  items: Array<{ name: string; price: number }>;
};

const itemInput = "box-border h-10 rounded-lg border border-raised bg-bg px-2.5 text-sm text-fg outline-none focus:border-accent";

export function EditExpenseForm({ tx }: { tx: Tx }) {
  const router = useRouter();
  const [amount, setAmount] = useState(tx.amount);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const itemsTotal = tx.items.reduce((a, it) => a + it.price, 0);
  const payments = paymentOptions.includes(tx.payment) ? paymentOptions : [...paymentOptions, tx.payment];

  return (
    <Screen
      header={
        <TopBar
          title="Edit Pengeluaran"
          back="/transactions"
          right={
            <button type="button" onClick={() => setConfirm(true)} aria-label="Hapus pengeluaran" className="flex size-11 items-center justify-center border-0 bg-transparent text-danger">
              <Icon name="trash" size={22} />
            </button>
          }
        />
      }
      footer={
        <Footer>
          {/* TODO: persist changes */}
          <Button onClick={() => router.push("/transactions")}>Simpan perubahan</Button>
        </Footer>
      }
    >
      <div className="flex flex-col gap-[18px] px-4 pt-3 pb-6">
        {tx.scanned && (
          <div className="flex items-center gap-3 rounded-[14px] bg-surface p-3">
            <ReceiptThumb />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <ScanBadge />
                Dari foto struk
              </div>
              <div className="mt-0.5 text-[13px] text-muted">{tx.recordedAt}</div>
              <button type="button" className="mt-0.5 border-0 bg-transparent p-0 text-[13px] font-semibold text-accent">
                Lihat foto struk
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="e-amt" className={labelClass}>Jumlah</label>
          <AmountInput id="e-amt" value={dots(amount)} onChange={(e) => setAmount(parseAmount(e.target.value))} />
        </div>

        <Field label="Nama toko / keterangan" htmlFor="e-merchant">
          <input id="e-merchant" type="text" defaultValue={tx.name} className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Tanggal" htmlFor="e-date">
            <input id="e-date" type="date" defaultValue={tx.date} className={selectClass} />
          </Field>
          <Field label="Jam" htmlFor="e-time">
            <input id="e-time" type="time" defaultValue={tx.time} className={selectClass} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Kategori" htmlFor="e-cat">
            <select id="e-cat" defaultValue={tx.category} className={selectClass}>
              {categoryNames.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Pembayaran" htmlFor="e-pay">
            <select id="e-pay" defaultValue={tx.payment} className={selectClass}>
              {payments.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        {tx.items.length > 0 && (
          <section className="rounded-[14px] bg-surface px-3">
            <button
              type="button"
              onClick={() => setItemsOpen(!itemsOpen)}
              aria-expanded={itemsOpen}
              className="flex h-12 w-full items-center justify-between border-0 bg-transparent p-0 text-[15px] font-semibold text-fg"
            >
              <span>
                Rincian item <span className="font-normal text-muted">({tx.items.length})</span>
              </span>
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
                {itemsOpen ? "Tutup" : itemsTotal ? `Total ${rp(itemsTotal)}` : "Lihat"}
                <Icon name={itemsOpen ? "chevronUp" : "chevronDown"} size={16} strokeWidth={2} />
              </span>
            </button>
            {itemsOpen && (
              <div className="flex flex-col pb-3">
                {tx.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-1.5 border-t border-raised py-2">
                    <input type="text" aria-label={`Nama item ${i + 1}`} defaultValue={it.name} className={cx(itemInput, "min-w-0 flex-1")} />
                    <input type="text" inputMode="numeric" aria-label={`Harga item ${i + 1}`} defaultValue={it.price ? dots(it.price) : ""} className={cx(itemInput, "w-[100px] text-right")} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <Field label={<>Catatan <span className="font-normal text-muted">(opsional)</span></>} htmlFor="e-note">
          <textarea id="e-note" rows={2} placeholder="Tambahkan catatan" className={cx(inputClass, "h-auto resize-none py-3")} />
        </Field>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-30 mx-auto max-w-[430px]">
          <div onClick={() => setConfirm(false)} className="absolute inset-0 bg-black/65" aria-hidden="true" />
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="del-h"
            aria-describedby="del-p"
            className="absolute top-1/2 right-6 left-6 flex -translate-y-1/2 flex-col gap-3 rounded-2xl bg-surface p-5"
          >
            <h2 id="del-h" className="m-0 text-lg font-bold">Hapus pengeluaran ini?</h2>
            <p id="del-p" className="m-0 text-sm leading-5 text-fg-2">
              <span className="font-semibold text-fg">
                {tx.name} · {rp(tx.amount)}
              </span>{" "}
              akan dihapus permanen{tx.scanned ? " beserta foto struk dan rincian itemnya" : ""}.
            </p>
            <div className="mt-1 grid grid-cols-2 gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>
                Batal
              </Button>
              {/* TODO: delete the transaction */}
              <ButtonLink href="/transactions" variant="danger" size="sm">
                Hapus
              </ButtonLink>
            </div>
          </section>
        </div>
      )}
    </Screen>
  );
}
