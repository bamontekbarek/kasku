"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { LangToggle } from "@/components/LangToggle";
import { Button, Logo, labelClass } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { AuthScreen } from "../AuthScreen";

const S = {
  id: { title: "Masuk ke akun", sub: "Catat pengeluaran lebih cepat — cukup foto struknya.", email: "Email", pw: "Kata sandi", forgot: "Lupa kata sandi?", cta: "Masuk", noacc: "Belum punya akun?", reg: "Daftar", error: "Email atau kata sandi salah. Periksa lagi, atau pakai Lupa kata sandi.", show: "Tampilkan kata sandi", hide: "Sembunyikan kata sandi" },
  en: { title: "Log in to your account", sub: "Track spending faster — just snap the receipt.", email: "Email", pw: "Password", forgot: "Forgot password?", cta: "Log in", noacc: "Don't have an account?", reg: "Sign up", error: "Incorrect email or password. Check again, or use Forgot password.", show: "Show password", hide: "Hide password" },
};

const boxClass =
  "box-border flex h-[52px] items-center gap-2.5 rounded-[10px] border border-raised bg-surface focus-within:border-accent";

export function LoginForm({ initialError }: { initialError: boolean }) {
  const t = useT(S);
  const router = useRouter();
  const [show, setShow] = useState(false);

  return (
    <AuthScreen
      footer={
        <p className="m-0 text-center text-sm text-muted">
          {t.noacc}{" "}
          <Link href="/register" className="font-semibold no-underline">
            {t.reg}
          </Link>
        </p>
      }
    >
      <div className="flex items-center justify-between">
        <Logo />
        <LangToggle />
      </div>

      <div className="mt-14">
        <h1 className="m-0 text-[30px] leading-[38px] font-bold tracking-[-0.4px]">{t.title}</h1>
        <p className="mt-2.5 mb-0 text-[15px] leading-[22px] text-muted">{t.sub}</p>
      </div>

      {initialError && (
        <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-[10px] border border-danger-line bg-danger-soft px-3.5 py-3 text-sm leading-5">
          <Icon name="alertCircle" size={18} strokeWidth={2} className="mt-px flex-none text-danger" />
          <span>{t.error}</span>
        </div>
      )}

      <form
        className="mt-9 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: supabase.auth.signInWithPassword
          router.push("/dashboard");
        }}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className={labelClass}>
            {t.email}
          </label>
          <div className={`${boxClass} px-3.5`}>
            <Icon name="mail" className="text-muted" />
            <input id="login-email" type="email" autoComplete="email" placeholder="nama@email.com" className="min-w-0 flex-1 border-0 bg-transparent text-base text-fg outline-none placeholder:text-muted" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="login-pw" className={labelClass}>
            {t.pw}
          </label>
          <div className={`${boxClass} pr-1.5 pl-3.5`}>
            <Icon name="lock" className="text-muted" />
            <input
              id="login-pw"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="min-w-0 flex-1 border-0 bg-transparent text-base tracking-[2px] text-fg outline-none"
            />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t.hide : t.show} className="flex size-11 items-center justify-center border-0 bg-transparent text-muted">
              <Icon name="eye" />
            </button>
          </div>
        </div>
        <div className="-mt-1.5 flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium no-underline">
            {t.forgot}
          </Link>
        </div>
        <Button type="submit" className="mt-1">
          {t.cta}
        </Button>
      </form>
    </AuthScreen>
  );
}
