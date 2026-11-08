import type { Metadata } from "next";
import { ButtonLink, StateIcon, TopBar } from "@/components/ui";
import type { IconName } from "@/components/Icon";

export const metadata: Metadata = { title: "Scan Gagal" };

type Kind = "notReceipt" | "failed" | "tooFast" | "uploadFailed";

const D: Record<Kind, { title: string; body: string; primary: string; href: string; bg: string; fg: string; icon: IconName; quota?: string }> = {
  notReceipt: {
    title: "Ini sepertinya bukan struk",
    body: "AI tidak menemukan total belanja di foto ini. Pastikan yang difoto adalah struk atau nota pembayaran.",
    primary: "Foto ulang", href: "/scan", bg: "var(--color-warn-soft)", fg: "var(--color-warn)", icon: "receiptX",
    quota: "Sisa scan hari ini: 16 dari 20",
  },
  failed: {
    title: "Struk belum bisa dibaca",
    body: "Server AI sedang sibuk atau tidak merespons. Kuota scan kamu tidak terpotong. Coba lagi sebentar lagi.",
    primary: "Coba lagi", href: "/scan/processing", bg: "var(--color-danger-soft)", fg: "var(--color-danger)", icon: "alertCircle",
  },
  tooFast: {
    title: "Tunggu sebentar",
    body: "Kamu baru saja scan beberapa struk. Coba lagi dalam 40 detik.",
    primary: "Kembali ke form", href: "/add", bg: "var(--color-info-soft)", fg: "var(--color-info)", icon: "timer",
    quota: "Sisa scan hari ini: 14 dari 20",
  },
  uploadFailed: {
    title: "Foto gagal terkirim",
    body: "Koneksi internet terputus. Foto sudah tersimpan di HP, jadi tidak perlu memotret lagi.",
    primary: "Kirim ulang foto", href: "/scan/processing", bg: "var(--color-surface)", fg: "var(--color-fg-2)", icon: "wifiOff",
  },
};

/** Scan failure states: `?kind=notReceipt|failed|tooFast|uploadFailed`. */
export default async function ScanErrorPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const d = D[(kind as Kind) in D ? (kind as Kind) : "notReceipt"];

  return (
    <div className="pt-safe pb-safe flex min-h-dvh flex-col bg-bg">
      <TopBar title="Scan Struk" back="/add" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-7 text-center">
        <StateIcon icon={d.icon} bg={d.bg} fg={d.fg} />
        <h2 className="mt-2 mb-0 text-2xl leading-[30px] font-bold" aria-live="polite">{d.title}</h2>
        <p className="m-0 text-[15px] leading-[22px] text-muted">{d.body}</p>
        {d.quota && (
          <span className="mt-1 inline-flex h-7 items-center rounded-full bg-surface px-3 text-[13px] text-fg-2">{d.quota}</span>
        )}
      </div>
      <div className="flex flex-col gap-2.5 px-4 pt-3">
        <ButtonLink href={d.href}>{d.primary}</ButtonLink>
        <ButtonLink href="/add" variant="surface" size="md">Isi manual saja</ButtonLink>
      </div>
    </div>
  );
}
