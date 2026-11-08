"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { ReceiptPaper, ReceiptThumb } from "@/components/Receipt";
import { AmountInput, Button, ButtonLink, Footer, Screen, TopBar, labelClass, selectClass } from "@/components/ui";
import { categoryNames, paymentOptions, scannedReceipt } from "@/lib/data";
import { cx, dots, parseAmount, rp } from "@/lib/format";

type Key = "amount" | "merchant" | "date" | "time" | "cat" | "pay";
type Item = { id: number; name: string; price: number; low: boolean };

/** Field label with the AI / "Cek lagi" / "Diubah" provenance badge. */
function AiLabel({ htmlFor, label, state }: { htmlFor: string; label: string; state: "ai" | "check" | "edited" }) {
  const badge = {
    ai: { text: "AI", cls: "bg-accent-soft text-accent" },
    check: { text: "Cek lagi", cls: "bg-warn-soft text-warn" },
    edited: { text: "Diubah", cls: "bg-raised text-fg-2" },
  }[state];
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={htmlFor} className={labelClass}>{label}</label>
      <span className={cx("inline-flex h-[22px] items-center rounded-md px-2 text-xs font-semibold", badge.cls)}>{badge.text}</span>
    </div>
  );
}

function Legend({ cls, text, children }: { cls: string; text: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cx("rounded px-1.5 py-px font-semibold", cls)}>{text}</span>
      {children}
    </span>
  );
}

const itemBox = "box-border h-10 rounded-lg border bg-bg text-sm text-fg outline-none focus-within:border-accent";

export function ReviewForm() {
  const router = useRouter();
  const r = scannedReceipt;
  const [v, setV] = useState({ amount: r.amount, merchant: r.merchant, date: r.date, time: r.time, cat: r.category, pay: r.payment });
  const [edited, setEdited] = useState<Partial<Record<Key, boolean>>>({});
  const [check, setCheck] = useState<Partial<Record<Key, boolean>>>({ date: true });
  const [items, setItems] = useState<Item[]>(r.items);
  const [nextId, setNextId] = useState(r.items.length + 1);
  const [keepAmount, setKeepAmount] = useState(false);
  const [photo, setPhoto] = useState(false);

  const state = (k: Key) => (edited[k] ? "edited" : check[k] ? "check" : "ai");
  const mark = <K extends Key>(k: K, value: (typeof v)[K]) => {
    setV((cur) => ({ ...cur, [k]: value }));
    setEdited((e) => ({ ...e, [k]: true }));
    setCheck((c) => ({ ...c, [k]: false }));
    if (k === "amount") setKeepAmount(false);
  };
  const setItem = (id: number, patch: Partial<Item>) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const sum = items.reduce((a, it) => a + it.price, 0);
  const checks = (check.date ? 1 : 0) + items.filter((it) => it.low).length;
  const mismatch = sum !== v.amount && !keepAmount && items.length > 0;

  return (
    <Screen
      header={<TopBar title="Periksa Hasil Scan" back="/add" />}
      footer={
        <Footer className="grid grid-cols-[1fr_2fr] gap-2.5">
          <ButtonLink href="/scan" variant="surface" className="text-[15px]">Scan ulang</ButtonLink>
          {/* TODO: save the expense + items to Supabase */}
          <Button onClick={() => router.push("/dashboard")}>Simpan</Button>
        </Footer>
      }
    >
      <div className="flex flex-col gap-[18px] px-4 pt-3 pb-6">
        <div className="flex items-center gap-3 rounded-[14px] bg-surface p-3">
          <button type="button" onClick={() => setPhoto(true)} aria-label="Lihat foto struk" className="flex-none border-0 bg-transparent p-0">
            <ReceiptThumb large />
          </button>
          <div className="min-w-0 flex-1">
            {checks > 0 ? (
              <div className="text-sm font-semibold text-warn">{checks} data perlu kamu cek</div>
            ) : (
              <div className="text-sm font-semibold text-success">Data siap disimpan</div>
            )}
            <p className="mt-1 mb-0 text-[13px] leading-[18px] text-fg-2">Semua isian bisa diedit. Bandingkan dengan foto struk sebelum menyimpan.</p>
            <button type="button" onClick={() => setPhoto(true)} className="mt-1 border-0 bg-transparent p-0 text-[13px] font-semibold text-accent">
              Lihat foto struk
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted" aria-label="Keterangan label">
          <Legend cls="bg-accent-soft text-accent" text="AI">diisi AI</Legend>
          <Legend cls="bg-warn-soft text-warn" text="Cek lagi">AI kurang yakin</Legend>
          <Legend cls="bg-raised text-fg-2" text="Diubah">sudah kamu edit</Legend>
        </div>

        <div className="flex flex-col gap-1.5">
          <AiLabel htmlFor="r-amt" label="Jumlah" state={state("amount")} />
          <AmountInput id="r-amt" value={dots(v.amount)} onChange={(e) => mark("amount", parseAmount(e.target.value))} />
        </div>

        <div className="flex flex-col gap-2">
          <AiLabel htmlFor="r-merchant" label="Nama toko" state={state("merchant")} />
          <input
            id="r-merchant"
            type="text"
            value={v.merchant}
            onChange={(e) => mark("merchant", e.target.value)}
            className="box-border h-[50px] rounded-[10px] border border-raised bg-surface px-3.5 text-base text-fg outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-2">
            <AiLabel htmlFor="r-date" label="Tanggal" state={state("date")} />
            <input id="r-date" type="date" value={v.date} onChange={(e) => mark("date", e.target.value)} className={cx(selectClass, state("date") === "check" && "!border-warn")} />
          </div>
          <div className="flex flex-col gap-2">
            <AiLabel htmlFor="r-time" label="Jam" state={state("time")} />
            <input id="r-time" type="time" value={v.time} onChange={(e) => mark("time", e.target.value)} className={selectClass} />
          </div>
        </div>
        {check.date && <p className="-mt-2.5 mb-0 text-xs text-warn">Tanggal di struk kurang jelas, pastikan sudah benar.</p>}

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-2">
            <AiLabel htmlFor="r-cat" label="Kategori" state={state("cat")} />
            <select id="r-cat" value={v.cat} onChange={(e) => mark("cat", e.target.value)} className={selectClass}>
              {categoryNames.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <AiLabel htmlFor="r-pay" label="Pembayaran" state={state("pay")} />
            <select id="r-pay" value={v.pay} onChange={(e) => mark("pay", e.target.value)} className={selectClass}>
              {paymentOptions.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <section className="rounded-[14px] bg-surface px-3 pt-1 pb-3" aria-labelledby="items-h">
          <div className="flex h-11 items-center justify-between">
            <h2 id="items-h" className="m-0 text-[15px] font-semibold">
              Rincian item <span className="font-normal text-muted">({items.length})</span>
            </h2>
            <span className="text-xs text-muted">ketuk untuk edit</span>
          </div>
          <div className="flex flex-col">
            {items.map((it, i) => (
              <div key={it.id} className="flex flex-col gap-1 border-t border-raised py-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    aria-label={`Nama item ${i + 1}`}
                    value={it.name}
                    onChange={(e) => setItem(it.id, { name: e.target.value })}
                    placeholder="Nama item"
                    className={cx(itemBox, "min-w-0 flex-1 border-raised px-2.5 placeholder:text-muted")}
                  />
                  <div className={cx(itemBox, "flex w-28 flex-none items-center gap-1 px-2", it.low ? "border-warn" : "border-raised")}>
                    <span className="text-xs text-muted">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Harga item ${i + 1}`}
                      value={dots(it.price)}
                      onChange={(e) => setItem(it.id, { price: parseAmount(e.target.value), low: false })}
                      className="min-w-0 flex-1 border-0 bg-transparent text-right text-sm text-fg tabular-nums outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((x) => x.id !== it.id))}
                    aria-label={`Hapus item ${i + 1}`}
                    className="flex h-10 w-9 flex-none items-center justify-center border-0 bg-transparent text-muted"
                  >
                    <Icon name="trash" size={18} strokeWidth={2} />
                  </button>
                </div>
                {it.low && <span className="text-xs text-warn">Harga kurang jelas di struk, cek lagi.</span>}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setItems([...items, { id: nextId, name: "", price: 0, low: false }]);
                setNextId(nextId + 1);
              }}
              className="mt-1 flex h-10 items-center justify-center gap-1.5 rounded-lg border border-dashed border-edge bg-transparent text-sm font-medium text-fg"
            >
              <Icon name="plus" size={16} strokeWidth={2.2} className="text-accent" />
              Tambah item
            </button>
            <div className="flex justify-between px-0.5 pt-3 text-[15px] font-semibold">
              <span>Total item</span>
              <span className="tabular-nums">{rp(sum)}</span>
            </div>
          </div>
        </section>

        {mismatch && (
          <div role="status" className="flex flex-col gap-2.5 rounded-xl border border-warn-line bg-warn-soft px-3.5 py-3">
            <p className="m-0 text-sm leading-5">
              Total item <span className="font-semibold">{rp(sum)}</span> berbeda dengan jumlah <span className="font-semibold">{rp(v.amount)}</span>. Mungkin ada diskon, pajak, atau item yang terlewat.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => mark("amount", sum)} className="h-9 rounded-lg border-0 bg-accent px-3 text-[13px] font-semibold text-accent-ink">
                Pakai total item
              </button>
              <button type="button" onClick={() => setKeepAmount(true)} className="h-9 rounded-lg border-0 bg-raised px-3 text-[13px] font-semibold text-fg">
                Biarkan jumlah
              </button>
            </div>
          </div>
        )}
      </div>

      {photo && (
        <div role="dialog" aria-modal="true" aria-label="Foto struk" className="fixed inset-0 z-30 mx-auto box-border flex max-w-[430px] flex-col items-center bg-black/92 pt-14">
          <button
            type="button"
            onClick={() => setPhoto(false)}
            aria-label="Tutup foto"
            className="absolute top-[max(env(safe-area-inset-top),12px)] right-3 flex size-11 items-center justify-center rounded-full border-0 bg-surface text-fg"
          >
            <Icon name="close" size={22} strokeWidth={2} />
          </button>
          {/* TODO: show the uploaded receipt image from Supabase Storage */}
          <ReceiptPaper scale="xl" className="mt-6 h-[520px] max-h-[75dvh] w-[280px] rounded px-[22px] py-[26px]" subtotal={false} />
          <p className="mt-4 mb-0 text-[13px] text-fg-2">Cubit untuk memperbesar</p>
        </div>
      )}
    </Screen>
  );
}
