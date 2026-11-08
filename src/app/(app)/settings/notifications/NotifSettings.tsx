"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { Badge, Button, Screen, SectionLabel, Segmented, Switch, TopBar } from "@/components/ui";

function ToggleRow({ title, sub, on, onToggle, last, children }: { title: string; sub: string; on?: boolean; onToggle?: () => void; last?: boolean; children?: ReactNode }) {
  return (
    <div className={`flex min-h-16 items-center justify-between gap-3 ${last ? "" : "border-b border-surface"}`}>
      <span>
        <span className="block text-[15px]">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{sub}</span>
      </span>
      {children ?? <Switch on={!!on} onToggle={onToggle!} label={title} />}
    </div>
  );
}

function Group({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <SectionLabel id={id}>{label}</SectionLabel>
      <div className="rounded-[14px] bg-card px-3.5">{children}</div>
    </section>
  );
}

export function NotifSettings() {
  const [push, setPush] = useState(false);
  const [s, set] = useState({ near: true, over: true, daily: true, weekly: true, monthly: true });
  const [threshold, setThreshold] = useState<"70" | "80" | "90">("80");
  const toggle = (k: keyof typeof s) => () => set({ ...s, [k]: !s[k] });

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") setPush(true);
  }, []);

  const enablePush = async () => {
    // TODO: subscribe the service worker to Web Push and store the subscription
    if (typeof Notification === "undefined") return setPush(true);
    const result = await Notification.requestPermission();
    if (result === "granted") setPush(true);
  };

  return (
    <Screen header={<TopBar title="Pengaturan Notifikasi" back="/notifications" />}>
      <div className="flex flex-col gap-5 px-4 pt-3 pb-8">
        {push ? (
          <div role="status" className="flex items-center gap-2.5 rounded-xl bg-success-soft px-3.5 py-3 text-sm font-medium text-success">
            <Icon name="check" size={18} strokeWidth={2.4} />
            Notifikasi ke HP aktif di perangkat ini
          </div>
        ) : (
          <section className="flex flex-col gap-3 rounded-[14px] border border-accent-line bg-surface p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <Icon name="bell" />
              </span>
              <div>
                <h2 className="m-0 text-[15px] font-semibold">Notifikasi ke HP belum aktif</h2>
                <p className="mt-1 mb-0 text-[13px] leading-[19px] text-fg-2">Notifikasi tetap tampil di dalam aplikasi. Aktifkan agar juga muncul di layar HP.</p>
              </div>
            </div>
            <Button size="sm" className="h-11" onClick={enablePush}>
              Aktifkan notifikasi
            </Button>
            <p className="m-0 text-xs leading-[17px] text-muted">Di iPhone: pasang Kasku ke layar utama dulu lewat menu Bagikan › Tambah ke Layar Utama.</p>
          </section>
        )}

        <Group id="ns-budget" label="ANGGARAN">
          <ToggleRow title="Hampir habis" sub="Saat pemakaian kategori mencapai batas di bawah" on={s.near} onToggle={toggle("near")} />
          {s.near && (
            <div className="flex min-h-14 items-center justify-between border-b border-surface">
              <span className="text-sm text-fg-2">Ingatkan di</span>
              <Segmented
                label="Batas peringatan"
                className="!p-[3px] rounded-lg bg-surface"
                itemClass="h-8 rounded-md px-3 text-[13px]"
                activeClass="bg-raised text-accent font-semibold"
                options={["70", "80", "90"].map((v) => ({ value: v as "70" | "80" | "90", label: `${v}%` }))}
                value={threshold}
                onChange={setThreshold}
              />
            </div>
          )}
          <ToggleRow title="Lewat batas" sub="Saat pengeluaran melebihi anggaran" on={s.over} onToggle={toggle("over")} last />
        </Group>

        <Group id="ns-remind" label="PENGINGAT">
          <ToggleRow title="Pengingat harian" sub="Hanya dikirim jika belum ada catatan hari itu" on={s.daily} onToggle={toggle("daily")} last={!s.daily} />
          {s.daily && (
            <div className="flex min-h-14 items-center justify-between">
              <label htmlFor="ns-time" className="text-sm text-fg-2">Jam pengingat</label>
              <input id="ns-time" type="time" defaultValue="20:00" className="h-9 rounded-lg border border-raised bg-surface px-2.5 text-[15px] text-fg outline-none focus:border-accent" />
            </div>
          )}
        </Group>

        <Group id="ns-summary" label="RINGKASAN">
          <ToggleRow title="Ringkasan mingguan" sub="Setiap Senin pukul 08.00" on={s.weekly} onToggle={toggle("weekly")} />
          <ToggleRow title="Laporan bulanan" sub="Setiap tanggal 1 pukul 08.00" on={s.monthly} onToggle={toggle("monthly")} last />
        </Group>

        <Group id="ns-acc" label="AKUN & KEAMANAN">
          <ToggleRow title="Perubahan kata sandi & login baru" sub="Demi keamanan, selalu dikirim" last>
            <Badge tone="neutral">Selalu aktif</Badge>
          </ToggleRow>
        </Group>
      </div>
    </Screen>
  );
}
