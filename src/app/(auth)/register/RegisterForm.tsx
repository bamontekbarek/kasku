"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { LangToggle } from "@/components/LangToggle";
import { Button, IconLink, inputClass, labelClass } from "@/components/ui";
import { cx } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { AuthScreen } from "../AuthScreen";

const S = {
  id: {
    title: "Buat akun", sub: "Gratis. Semua catatanmu tersimpan aman dan tersinkron di semua perangkat.",
    name: "Nama lengkap", namePh: "Nama kamu", email: "Email", pw: "Kata sandi", pwPh: "Minimal 8 karakter",
    pw2: "Ulangi kata sandi", pw2Ph: "Ketik ulang kata sandi", rules: ["8+ karakter", "Huruf besar & kecil", "Angka"],
    agree: "Saya setuju dengan", terms: "Syarat & Ketentuan", and: "dan", privacy: "Kebijakan Privasi",
    cta: "Daftar", hint: "Kami akan mengirim link verifikasi ke email kamu.", have: "Sudah punya akun?", login: "Masuk",
  },
  en: {
    title: "Create account", sub: "Free. All your records stay safe and synced across devices.",
    name: "Full name", namePh: "Your name", email: "Email", pw: "Password", pwPh: "At least 8 characters",
    pw2: "Repeat password", pw2Ph: "Type the password again", rules: ["8+ characters", "Upper & lower case", "Number"],
    agree: "I agree to the", terms: "Terms & Conditions", and: "and", privacy: "Privacy Policy",
    cta: "Sign up", hint: "We'll send a verification link to your email.", have: "Already have an account?", login: "Log in",
  },
};

export function RegisterForm() {
  const t = useT(S);
  const router = useRouter();
  const [pw, setPw] = useState("");

  const checks = [pw.length >= 8, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw)];
  const score = pw ? checks.filter(Boolean).length + (pw.length >= 12 ? 1 : 0) : 0;

  return (
    <AuthScreen
      footer={
        <p className="m-0 mt-6 text-center text-sm text-muted">
          {t.have}{" "}
          <Link href="/login" className="font-semibold no-underline">
            {t.login}
          </Link>
        </p>
      }
    >
      <div className="flex h-12 items-center justify-between">
        <IconLink href="/login" label="Kembali" icon="back" className="-ml-2.5" />
        <LangToggle />
      </div>

      <div className="mt-4">
        <h1 className="m-0 text-[30px] leading-[38px] font-bold tracking-[-0.4px]">{t.title}</h1>
        <p className="mt-2 mb-0 text-[15px] leading-[22px] text-muted">{t.sub}</p>
      </div>

      <form
        className="mt-5 flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: supabase.auth.signUp
          router.push("/verify-email");
        }}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="reg-name" className={labelClass}>{t.name}</label>
          <input id="reg-name" type="text" autoComplete="name" placeholder={t.namePh} className={cx(inputClass, "h-[52px]")} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="reg-email" className={labelClass}>{t.email}</label>
          <input id="reg-email" type="email" autoComplete="email" placeholder="nama@email.com" className={cx(inputClass, "h-[52px]")} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="reg-pw" className={labelClass}>{t.pw}</label>
          <input id="reg-pw" type="password" autoComplete="new-password" placeholder={t.pwPh} value={pw} onChange={(e) => setPw(e.target.value)} className={cx(inputClass, "h-[52px]")} />
          <div className="mt-0.5 flex gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cx("h-1 flex-1 rounded-sm", i < score ? "bg-success" : "bg-raised")} />
            ))}
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Syarat kata sandi">
            {t.rules.map((label, i) => (
              <li key={label} className={cx("flex h-6 items-center gap-1 rounded-md bg-surface px-2 text-xs", checks[i] ? "text-fg-2" : "text-muted")}>
                {checks[i] ? (
                  <Icon name="check" size={12} strokeWidth={3} className="text-success" />
                ) : (
                  <Icon name="circle" size={12} strokeWidth={2.4} className="text-muted" />
                )}
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="reg-pw2" className={labelClass}>{t.pw2}</label>
          <input id="reg-pw2" type="password" autoComplete="new-password" placeholder={t.pw2Ph} className={cx(inputClass, "h-[52px]")} />
        </div>
        <label htmlFor="reg-terms" className="flex cursor-pointer items-start gap-2.5 text-sm leading-5 text-fg-2">
          <input id="reg-terms" type="checkbox" required className="m-0 size-5 flex-none accent-accent" />
          <span>
            {t.agree}{" "}
            <Link href="/terms" className="no-underline">{t.terms}</Link> {t.and}{" "}
            <Link href="/privacy" className="no-underline">{t.privacy}</Link>
          </span>
        </label>
        <Button type="submit">{t.cta}</Button>
        <p className="m-0 -mt-1 text-center text-[13px] leading-[18px] text-muted">{t.hint}</p>
      </form>
    </AuthScreen>
  );
}
