import type { Metadata } from "next";
import Link from "next/link";
import { ResendButton } from "@/components/ResendButton";
import { ButtonLink, IconLink, StateIcon, StepList } from "@/components/ui";
import { user } from "@/lib/data";
import { AuthScreen } from "../AuthScreen";

export const metadata: Metadata = { title: "Verifikasi Email" };

export default function VerifyEmailPage() {
  const email = user.email;
  return (
    <AuthScreen
      footer={
        <p className="m-0 mt-6 text-center text-[13px] leading-[19px] text-muted">
          Tidak ada di inbox? Cek folder Spam atau Promosi. Salah email?{" "}
          <Link href="/register" className="font-semibold no-underline">
            Daftar ulang
          </Link>
        </p>
      }
    >
      <div className="flex h-12 items-center">
        <IconLink href="/register" label="Kembali" icon="back" className="-ml-2.5" />
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <StateIcon icon="mail" bg="var(--color-accent-soft)" fg="var(--color-accent)" size={96} iconSize={44} strokeWidth={1.6} />
        <h1 className="mt-6 mb-0 text-[28px] leading-9 font-bold">Verifikasi email kamu</h1>
        <p className="mt-2.5 mb-0 text-[15px] leading-[22px] text-muted">
          Akun sudah dibuat. Kami mengirim link verifikasi ke <span className="font-semibold text-fg">{email}</span>. Kamu baru bisa masuk setelah email diverifikasi.
        </p>
      </div>

      <StepList
        className="mt-7"
        steps={[
          <>Buka inbox <span className="font-semibold">{email}</span></>,
          <>Cari email dari <span className="font-semibold">Kasku</span> dengan judul <span className="font-semibold">&quot;Verifikasi akun&quot;</span></>,
          <>Klik link di email, lalu kembali ke sini dan masuk</>,
        ]}
      />

      <div className="mt-5 flex flex-col gap-3">
        <ButtonLink href="/login">Sudah verifikasi, masuk</ButtonLink>
        <ResendButton label="Kirim ulang email verifikasi" size="md" />
      </div>
    </AuthScreen>
  );
}
