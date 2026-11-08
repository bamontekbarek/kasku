"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { PasswordRules, passwordRules } from "@/components/PasswordRules";
import { Button, ButtonLink, Logo, StateIcon, inputClass, labelClass } from "@/components/ui";
import { cx } from "@/lib/format";
import { user } from "@/lib/data";

export function NewPasswordForm({ expired }: { expired: boolean }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(true);
  const [done, setDone] = useState(false);

  const rules = passwordRules(pw);
  const match = confirm.length > 0 && confirm === pw;
  const canSave = rules.every((r) => r.ok) && match;

  return (
    <div className="pt-safe flex min-h-dvh flex-col bg-bg px-6 pb-8">
      <Logo />

      {expired ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <StateIcon icon="clock" bg="var(--color-warn-soft)" fg="var(--color-warn)" />
            <h1 className="mt-2 mb-0 text-[26px] font-bold">Link sudah tidak berlaku</h1>
            <p className="m-0 text-[15px] leading-[22px] text-muted">
              Link reset hanya berlaku 1 jam dan hanya bisa dipakai sekali. Minta link baru untuk melanjutkan.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <ButtonLink href="/forgot-password">Kirim link baru</ButtonLink>
            <Link href="/login" className="self-center text-sm font-semibold no-underline">
              Kembali masuk
            </Link>
          </div>
        </>
      ) : done ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <StateIcon icon="check" bg="var(--color-success-soft)" fg="var(--color-success)" strokeWidth={2.4} />
            <h1 className="mt-2 mb-0 text-[26px] font-bold">Kata sandi berhasil diubah</h1>
            <p className="m-0 text-[15px] leading-[22px] text-muted">Silakan masuk dengan kata sandi baru.</p>
          </div>
          <ButtonLink href="/login">Masuk</ButtonLink>
        </>
      ) : (
        <>
          <div className="mt-10">
            <h1 className="m-0 text-[30px] leading-[38px] font-bold tracking-[-0.4px]">Buat kata sandi baru</h1>
            <p className="mt-2.5 mb-0 text-[15px] leading-[22px] text-muted">
              Untuk akun <span className="font-semibold text-fg">{user.email}</span>. Setelah disimpan, kamu akan keluar dari semua perangkat lain.
            </p>
          </div>
          <form
            className="mt-7 flex flex-col gap-[18px]"
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: supabase.auth.updateUser({ password })
              if (canSave) setDone(true);
            }}
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="np-new" className={labelClass}>Kata sandi baru</label>
              <div className="box-border flex h-[52px] items-center rounded-[10px] border border-raised bg-surface pr-1 pl-3.5 focus-within:border-accent">
                <input id="np-new" type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="min-w-0 flex-1 border-0 bg-transparent text-base text-fg outline-none" />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="flex size-11 items-center justify-center border-0 bg-transparent text-muted">
                  <Icon name="eye" />
                </button>
              </div>
              <PasswordRules rules={rules} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="np-confirm" className={labelClass}>Ulangi kata sandi baru</label>
              <input id="np-confirm" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Ketik ulang kata sandi" className={cx(inputClass, "h-[52px]")} />
              {confirm.length > 0 && !match && <span className="text-[13px] text-danger">Kata sandi belum sama</span>}
            </div>
            <Button type="submit" disabled={!canSave}>
              Simpan kata sandi
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
