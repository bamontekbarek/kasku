"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { PasswordRules, passwordRules } from "@/components/PasswordRules";
import { Button, Footer, Screen, TopBar, inputClass, labelClass } from "@/components/ui";
import { cx } from "@/lib/format";

export function ChangePasswordForm() {
  const router = useRouter();
  const [old, setOld] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(true);

  const rules = [...passwordRules(pw), { label: "Berbeda dari kata sandi lama", ok: pw.length > 0 && pw !== old }];
  const score = rules.filter((r) => r.ok).length;
  const color = score <= 1 ? "var(--color-danger)" : score <= 3 ? "var(--color-accent)" : "var(--color-success)";
  const strength = pw.length === 0 ? "" : score <= 1 ? "Lemah" : score <= 3 ? "Cukup" : "Kuat";
  const match = confirm.length > 0 && confirm === pw;
  const canSave = score === 4 && match && old.length > 0;

  return (
    <Screen
      header={<TopBar title="Ubah Kata Sandi" back="/settings" />}
      footer={
        <Footer className="flex flex-col gap-2.5">
          <p className="m-0 text-center text-xs text-muted">Kamu tetap masuk di perangkat ini. Perangkat lain akan diminta login ulang.</p>
          {/* TODO: verify old password, then supabase.auth.updateUser */}
          <Button disabled={!canSave} onClick={() => router.push("/settings")}>
            Simpan kata sandi
          </Button>
        </Footer>
      }
    >
      <form className="flex flex-col gap-5 px-4 pt-4 pb-6" onSubmit={(e) => e.preventDefault()}>
        <p className="m-0 text-sm leading-5 text-muted">Demi keamanan, masukkan kata sandi lama sebelum membuat yang baru.</p>

        <div className="flex flex-col gap-2">
          <label htmlFor="cp-old" className={labelClass}>Kata sandi saat ini</label>
          <input id="cp-old" type="password" autoComplete="current-password" value={old} onChange={(e) => setOld(e.target.value)} className={cx(inputClass, "h-[52px] tracking-[2px]")} />
          <Link href="/forgot-password" className="self-end text-[13px] font-medium no-underline">
            Lupa? Kirim link reset ke email
          </Link>
        </div>

        <div className="h-px bg-surface" aria-hidden="true" />

        <div className="flex flex-col gap-2">
          <label htmlFor="cp-new" className={labelClass}>Kata sandi baru</label>
          <div className="box-border flex h-[52px] items-center rounded-[10px] border border-raised bg-surface pr-1 pl-3.5 focus-within:border-accent">
            <input id="cp-new" type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="min-w-0 flex-1 border-0 bg-transparent text-base text-fg outline-none" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="flex size-11 items-center justify-center border-0 bg-transparent text-muted">
              <Icon name="eye" />
            </button>
          </div>
          <div className="mt-0.5 flex items-center gap-2.5">
            <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-1 rounded-sm" style={{ background: i < score ? color : "var(--color-raised)" }} />
              ))}
            </div>
            <span className="w-[52px] text-right text-[13px] font-semibold" style={{ color }} aria-live="polite">
              {strength}
            </span>
          </div>
          <PasswordRules rules={rules} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="cp-confirm" className={labelClass}>Ulangi kata sandi baru</label>
          <input id="cp-confirm" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={cx(inputClass, "h-[52px]")} />
          {match && <span className="text-[13px] text-success">Kata sandi cocok</span>}
          {confirm.length > 0 && !match && <span className="text-[13px] text-danger">Kata sandi belum sama</span>}
        </div>
      </form>
    </Screen>
  );
}
