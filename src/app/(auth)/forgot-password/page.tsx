import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Button, IconLink, labelClass } from "@/components/ui";
import { AuthScreen } from "../AuthScreen";

export const metadata: Metadata = { title: "Lupa Kata Sandi" };

export default function ForgotPasswordPage() {
  return (
    <AuthScreen
      footer={
        <p className="m-0 text-center text-sm text-muted">
          Sudah ingat?{" "}
          <Link href="/login" className="font-semibold no-underline">
            Kembali masuk
          </Link>
        </p>
      }
    >
      <div className="flex h-12 items-center">
        <IconLink href="/login" label="Kembali" icon="back" className="-ml-2.5" />
      </div>

      <div className="mt-5">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Icon name="lockOpen" size={28} />
        </div>
        <h1 className="mt-5 mb-0 text-[30px] leading-[38px] font-bold tracking-[-0.4px]">Lupa kata sandi?</h1>
        <p className="mt-2.5 mb-0 text-[15px] leading-[22px] text-muted">
          Masukkan email akunmu. Kami akan mengirim link untuk membuat kata sandi baru.
        </p>
      </div>

      {/* TODO: supabase.auth.resetPasswordForEmail, then go to /forgot-password/sent */}
      <form action="/forgot-password/sent" className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="fp-email" className={labelClass}>
            Email
          </label>
          <div className="box-border flex h-[52px] items-center gap-2.5 rounded-[10px] border border-raised bg-surface px-3.5 focus-within:border-accent">
            <Icon name="mail" className="text-muted" />
            <input id="fp-email" name="email" type="email" required autoComplete="email" placeholder="nama@email.com" className="min-w-0 flex-1 border-0 bg-transparent text-base text-fg outline-none placeholder:text-muted" />
          </div>
        </div>
        <Button type="submit">Kirim link reset</Button>
      </form>
    </AuthScreen>
  );
}
