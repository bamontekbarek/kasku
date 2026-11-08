"use client";

import Link from "next/link";
import { cx } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Icon, type IconName } from "./Icon";

type Tab = "home" | "history" | "budget" | "account";

const labels = {
  id: { home: "Beranda", history: "Riwayat", budget: "Anggaran", account: "Akun", add: "Tambah pengeluaran", nav: "Navigasi utama" },
  en: { home: "Home", history: "History", budget: "Budget", account: "Account", add: "Add expense", nav: "Main navigation" },
};

const tabs: Array<{ key: Tab; href: string; icon: IconName }> = [
  { key: "home", href: "/dashboard", icon: "home" },
  { key: "history", href: "/transactions", icon: "receipt" },
  { key: "budget", href: "/budget", icon: "wallet" },
  { key: "account", href: "/settings", icon: "user" },
];

function TabLink({ tab, active, label }: { tab: (typeof tabs)[number]; active: boolean; label: string }) {
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex flex-col items-center gap-1 text-[11px] no-underline",
        active ? "font-semibold text-accent hover:text-accent" : "font-medium text-muted hover:text-fg-2",
      )}
    >
      <Icon name={tab.icon} size={24} />
      {label}
    </Link>
  );
}

/** Bottom tab bar with the raised "+" (add expense) button in the middle. */
export function BottomNav({ active }: { active: Tab }) {
  const t = useT(labels);
  return (
    <nav
      aria-label={t.nav}
      className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-5 items-start border-t border-raised bg-card pt-2 pb-[max(env(safe-area-inset-bottom),12px)] min-h-[84px] box-border"
    >
      <TabLink tab={tabs[0]} active={active === "home"} label={t.home} />
      <TabLink tab={tabs[1]} active={active === "history"} label={t.history} />
      <Link href="/add" aria-label={t.add} className="flex justify-center no-underline">
        <span className="-mt-0.5 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-ink">
          <Icon name="plus" size={26} strokeWidth={2.2} />
        </span>
      </Link>
      <TabLink tab={tabs[2]} active={active === "budget"} label={t.budget} />
      <TabLink tab={tabs[3]} active={active === "account"} label={t.account} />
    </nav>
  );
}

/** Page wrapper for the four tab screens: room at the bottom for the nav. */
export function TabScreen({ active, children }: { active: Tab; children: React.ReactNode }) {
  return (
    <div className="pt-safe min-h-dvh bg-bg pb-[120px]">
      {children}
      <BottomNav active={active} />
    </div>
  );
}
