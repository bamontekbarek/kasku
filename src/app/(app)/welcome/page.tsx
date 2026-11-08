import type { Metadata } from "next";
import Link from "next/link";
import { TabScreen } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Avatar, ButtonLink, ChevronRight, ProgressBar } from "@/components/ui";
import { user } from "@/lib/data";

export const metadata: Metadata = { title: "Selamat Datang" };

const steps = [
  { label: "Catat pengeluaran pertama", href: "/add" },
  { label: "Atur anggaran bulanan", href: "/budget/edit" },
  { label: "Pasang Kasku di layar utama", href: "/settings/install" },
];

/** Dashboard for a brand-new user with no transactions yet. */
export default function WelcomePage() {
  return (
    <TabScreen active="home">
      <header className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <Avatar initials={user.initials} />
          <div>
            <div className="text-xs text-muted">Selamat datang</div>
            <div className="text-base font-semibold">{user.name}</div>
          </div>
        </div>
        <Link href="/notifications" aria-label="Notifikasi" className="flex size-11 items-center justify-center text-fg hover:text-fg">
          <Icon name="bell" size={22} />
        </Link>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-2">
        <section className="flex flex-col gap-3.5 rounded-2xl border border-accent-line bg-surface p-[18px]">
          <div className="flex items-center gap-3.5">
            <span className="flex size-[52px] flex-none items-center justify-center rounded-[14px] bg-accent-soft text-accent">
              <Icon name="receipt" size={28} />
            </span>
            <div>
              <h1 className="m-0 text-lg leading-6 font-bold">Catat pengeluaran pertamamu</h1>
              <p className="mt-1 mb-0 text-[13px] leading-[19px] text-fg-2">Cukup foto struknya, AI yang mengisi form.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <ButtonLink href="/scan" size="md">
              <Icon name="scan" strokeWidth={2} />
              Scan struk
            </ButtonLink>
            <ButtonLink href="/add" variant="secondary" size="md">
              <Icon name="plus" strokeWidth={2} />
              Input manual
            </ButtonLink>
          </div>
        </section>

        <section className="flex flex-col gap-1" aria-label="Ringkasan">
          <div className="text-sm text-muted">Total pengeluaran · November 2026</div>
          <div className="text-[34px] leading-10 font-bold text-faint tabular-nums">Rp 0</div>
          <div className="text-[13px] text-muted">Grafik dan kategori muncul setelah ada transaksi.</div>
        </section>

        <section aria-labelledby="start-h" className="rounded-[14px] bg-card px-3.5 py-1">
          <div className="flex h-12 items-center justify-between">
            <h2 id="start-h" className="m-0 text-[15px] font-semibold">Langkah awal</h2>
            <span className="text-[13px] text-muted">1 dari 4 selesai</span>
          </div>
          <div className="mb-1.5">
            <ProgressBar pct={25} height={4} />
          </div>
          <ul className="m-0 list-none p-0">
            <li className="flex min-h-[52px] items-center gap-3 border-b border-surface">
              <span className="flex size-6 flex-none items-center justify-center rounded-full bg-success text-bg">
                <Icon name="check" size={14} strokeWidth={3} />
              </span>
              <span className="flex-1 text-[15px] text-muted line-through">Buat akun</span>
            </li>
            {steps.map((s, i) => (
              <li key={s.href} className={i < steps.length - 1 ? "border-b border-surface" : undefined}>
                <Link href={s.href} className="flex min-h-[52px] items-center gap-3 text-fg no-underline hover:text-fg">
                  <span className="box-border size-6 flex-none rounded-full border-2 border-edge" aria-hidden="true" />
                  <span className="flex-1 text-[15px]">{s.label}</span>
                  <ChevronRight />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </TabScreen>
  );
}
