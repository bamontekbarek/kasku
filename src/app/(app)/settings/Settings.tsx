"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { TabScreen } from "@/components/BottomNav";
import { Icon, type IconName } from "@/components/Icon";
import { Avatar, Badge, ChevronRight, SectionLabel, Segmented, buttonClass } from "@/components/ui";
import { user } from "@/lib/data";
import { useLang, useT } from "@/lib/i18n";

const S = {
  id: {
    title: "Akun", verified: "Terverifikasi", pref: "PREFERENSI", lang: "Bahasa", currency: "Mata uang", cats: "Kelola kategori", app: "APLIKASI",
    install: "Pasang di layar utama", installSub: "Buka seperti aplikasi, tanpa app store", installBtn: "Pasang", remind: "Notifikasi", pw: "Ubah kata sandi",
    logout: "Keluar", deleteAcc: "Hapus akun", terms: "Syarat & Ketentuan", privacy: "Kebijakan Privasi",
  },
  en: {
    title: "Account", verified: "Verified", pref: "PREFERENCES", lang: "Language", currency: "Currency", cats: "Manage categories", app: "APP",
    install: "Add to home screen", installSub: "Open like an app, no app store needed", installBtn: "Install", remind: "Notifications", pw: "Change password",
    logout: "Log out", deleteAcc: "Delete account", terms: "Terms & Conditions", privacy: "Privacy Policy",
  },
};

function Row({ icon, children, href, last, right }: { icon: IconName; children: ReactNode; href?: string; last?: boolean; right?: ReactNode }) {
  const cls = `flex min-h-[60px] items-center justify-between gap-3 text-fg no-underline hover:text-fg ${last ? "" : "border-b border-surface"}`;
  const body = (
    <>
      <span className="flex items-center gap-3 text-[15px]">
        <Icon name={icon} className="text-fg-2" />
        {children}
      </span>
      {right ?? (href ? <ChevronRight /> : null)}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Account & settings tab. `overlay` renders a sheet on top (install guide). */
export function Settings({ overlay }: { overlay?: ReactNode }) {
  const t = useT(S);
  const { lang, setLang } = useLang();

  return (
    <TabScreen active="account">
      <header className="flex h-14 items-center px-4">
        <h1 className="m-0 text-[22px] font-bold">{t.title}</h1>
      </header>

      <div className="flex flex-col gap-5 px-4 pt-2">
        <div className="flex items-center gap-3.5 rounded-[14px] bg-surface p-4">
          <Avatar initials={user.initials} size={52} />
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-semibold">{user.name}</div>
            <div className="mt-0.5 text-sm text-muted">{user.email}</div>
          </div>
          <Badge tone="success">{t.verified}</Badge>
        </div>

        <section aria-labelledby="pref-h">
          <SectionLabel id="pref-h">{t.pref}</SectionLabel>
          <div className="rounded-[14px] bg-card px-3.5">
            <Row
              icon="globe"
              right={
                <Segmented
                  label="Bahasa"
                  className="!gap-0 rounded-lg bg-surface !p-[3px]"
                  itemClass="h-8 rounded-md px-3 text-[13px]"
                  activeClass="bg-raised text-accent font-semibold"
                  options={[
                    { value: "id", label: "Indonesia" },
                    { value: "en", label: "English" },
                  ]}
                  value={lang}
                  onChange={setLang}
                />
              }
            >
              {t.lang}
            </Row>
            <Row icon="cash" right={<span className="text-sm text-muted">Rupiah (IDR)</span>}>
              {t.currency}
            </Row>
            <Row icon="tag" href="/settings/categories" last>
              {t.cats}
            </Row>
          </div>
        </section>

        <section aria-labelledby="app-h">
          <SectionLabel id="app-h">{t.app}</SectionLabel>
          <div className="rounded-[14px] bg-card px-3.5">
            <Link href="/settings/install" className="flex min-h-16 items-center justify-between gap-3 border-b border-surface text-fg no-underline hover:text-fg">
              <span className="flex items-center gap-3">
                <Icon name="phoneDownload" className="text-accent" />
                <span>
                  <span className="block text-[15px]">{t.install}</span>
                  <span className="mt-0.5 block text-xs text-muted">{t.installSub}</span>
                </span>
              </span>
              <span className="inline-flex h-[30px] flex-none items-center rounded-lg bg-accent px-3 text-[13px] font-semibold text-accent-ink">{t.installBtn}</span>
            </Link>
            <Row icon="bell" href="/settings/notifications">
              {t.remind}
            </Row>
            <Row icon="lock" href="/settings/password" last>
              {t.pw}
            </Row>
          </div>
        </section>

        {/* TODO: supabase.auth.signOut() before redirecting */}
        <Link href="/login" className={buttonClass("surface", "lg", "h-[50px] text-[15px] !text-danger")}>
          {t.logout}
        </Link>
        <Link href="/settings/delete-account" className="-mt-2 self-center px-3 py-2.5 text-[13px] text-muted no-underline hover:text-fg-2">
          {t.deleteAcc}
        </Link>
        <p className="-mt-1.5 mb-0 text-center text-xs text-muted">
          <Link href="/terms" className="text-fg-2 no-underline">{t.terms}</Link> ·{" "}
          <Link href="/privacy" className="text-fg-2 no-underline">{t.privacy}</Link> · Kasku v1.0.0
        </p>
      </div>
      {overlay}
    </TabScreen>
  );
}
