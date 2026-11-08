"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Button, ButtonLink, Footer, Screen, SectionLabel, StateIcon, TopBar, inputClass, labelClass } from "@/components/ui";
import { user } from "@/lib/data";
import { cx } from "@/lib/format";

const toDelete: Array<[string, string]> = [
  ["Transaksi", "248"],
  ["Foto struk", "96"],
  ["Anggaran dan kategori", "semua"],
  ["Notifikasi dan pengaturan", "semua"],
];

export function DeleteAccountForm() {
  const [pw, setPw] = useState("");
  const [word, setWord] = useState("");
  const [deleted, setDeleted] = useState(false);
  const ok = pw.length > 0 && word.trim().toUpperCase() === "HAPUS";

  if (deleted) {
    return (
      <div className="pt-safe pb-safe flex min-h-dvh flex-col bg-bg">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <StateIcon icon="check" bg="var(--color-surface)" fg="var(--color-fg-2)" />
          <h1 className="mt-2 mb-0 text-2xl font-bold">Akun sudah dihapus</h1>
          <p className="m-0 text-[15px] leading-[22px] text-muted">Terima kasih sudah memakai Kasku. Kamu bisa membuat akun baru kapan saja.</p>
        </div>
        <div className="px-4">
          <ButtonLink href="/login" variant="secondary">Ke halaman masuk</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <Screen
      header={<TopBar title="Hapus Akun" back="/settings" />}
      footer={
        <Footer>
          {/* TODO: verify password, then call the delete-account endpoint */}
          <Button variant="danger" disabled={!ok} onClick={() => setDeleted(true)} className="w-full">
            Hapus akun permanen
          </Button>
        </Footer>
      }
    >
      <div className="flex flex-col gap-[18px] px-4 pt-3 pb-6">
        <div className="flex items-start gap-3 rounded-[14px] border border-danger-line bg-danger-soft p-3.5">
          <Icon name="alertTriangle" size={22} strokeWidth={2} className="flex-none text-danger" />
          <div>
            <h2 className="m-0 text-[15px] font-semibold">Tindakan ini tidak bisa dibatalkan</h2>
            <p className="mt-1 mb-0 text-[13px] leading-[19px] text-fg-2">
              Semua data di akun <span className="font-semibold text-fg">{user.email}</span> akan dihapus permanen dalam [X] hari.
            </p>
          </div>
        </div>

        <section aria-labelledby="del-what">
          <SectionLabel id="del-what">YANG AKAN DIHAPUS</SectionLabel>
          <ul className="m-0 list-none rounded-[14px] bg-card px-3.5 py-0">
            {toDelete.map(([label, value], i) => (
              <li key={label} className={cx("flex min-h-12 items-center justify-between text-[15px]", i < toDelete.length - 1 && "border-b border-surface")}>
                <span>{label}</span>
                <span className="text-fg-2 tabular-nums">{value}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex items-center justify-between gap-3 rounded-[14px] bg-surface p-3.5">
          <span>
            <span className="block text-[15px] font-semibold">Simpan datamu dulu?</span>
            <span className="mt-0.5 block text-[13px] text-muted">Unduh semua transaksi sebagai CSV</span>
          </span>
          <Link href="/transactions/export" className="flex h-9 flex-none items-center rounded-lg bg-raised px-3.5 text-sm font-semibold text-fg no-underline hover:text-fg">
            Export
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="del-pw" className={labelClass}>Kata sandi</label>
          <input id="del-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Masukkan kata sandi" className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="del-confirm" className={labelClass}>
            Ketik <span className="font-bold text-fg">HAPUS</span> untuk konfirmasi
          </label>
          <input
            id="del-confirm"
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="HAPUS"
            className={cx(inputClass, "tracking-[1px]")}
          />
        </div>
      </div>
    </Screen>
  );
}
