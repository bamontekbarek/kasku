import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ResendButton } from "@/components/ResendButton";
import { IconLink, StepList } from "@/components/ui";
import { AuthScreen } from "../../AuthScreen";

export const metadata: Metadata = { title: "Link Reset Terkirim" };

export default async function ForgotSentPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "budi@email.com" } = await searchParams;
  return (
    <AuthScreen
      footer={
        <Link href="/login" className="mt-6 self-center text-sm font-semibold no-underline">
          Kembali ke halaman masuk
        </Link>
      }
    >
      <div className="flex h-12 items-center">
        <IconLink href="/forgot-password" label="Kembali" icon="back" className="-ml-2.5" />
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <div className="relative flex size-24 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon name="mail" size={44} strokeWidth={1.6} />
          <span className="absolute right-0.5 bottom-0.5 flex size-[30px] items-center justify-center rounded-full border-[3px] border-bg bg-success text-bg">
            <Icon name="check" size={14} strokeWidth={3} />
          </span>
        </div>
        <h1 className="mt-6 mb-0 text-[28px] leading-9 font-bold">Cek email kamu</h1>
        <p className="mt-2.5 mb-0 text-[15px] leading-[22px] text-muted">
          Jika <span className="font-semibold text-fg">{email}</span> terdaftar, kami sudah mengirim link untuk membuat kata sandi baru.
        </p>
      </div>

      <StepList
        className="mt-7"
        steps={[
          <>Buka inbox email <span className="font-semibold">{email}</span></>,
          <>Cari email dari <span className="font-semibold">Kasku</span> dengan judul <span className="font-semibold">&quot;Reset kata sandi&quot;</span></>,
          <>Klik link di email itu dalam <span className="font-semibold">1 jam</span>, lalu buat kata sandi baru</>,
        ]}
      />

      <div className="mt-5 flex flex-col gap-3">
        <ResendButton label="Kirim ulang link" />
      </div>

      <div className="mt-4 flex gap-2.5 rounded-xl bg-surface px-3.5 py-3">
        <Icon name="info" size={18} className="mt-px flex-none text-muted" />
        <p className="m-0 text-[13px] leading-[19px] text-fg-2">
          Tidak ada di kotak masuk? Cek folder Spam atau Promosi. Salah ketik email?{" "}
          <Link href="/forgot-password" className="font-semibold no-underline">
            Ubah email
          </Link>
        </p>
      </div>
    </AuthScreen>
  );
}
