"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { FilterPills, IconLink, StateIcon, TopBar } from "@/components/ui";
import { notificationKinds, notifications } from "@/lib/data";
import { cx } from "@/lib/format";

const filters = ["Semua", "Anggaran", "Pengingat", "Ringkasan", "Akun"];
const groups = ["Hari ini", "Kemarin", "Sebelumnya"] as const;

export function NotificationsList() {
  const [filter, setFilter] = useState("Semua");
  const [read, setRead] = useState<Record<number, boolean>>({});

  const isUnread = (n: (typeof notifications)[number]) => n.unread && !read[n.id];
  const list = notifications.filter((n) => filter === "Semua" || notificationKinds[n.kind].type === filter);
  const unread = notifications.filter(isUnread).length;

  return (
    <div className="pt-safe flex h-dvh flex-col bg-bg">
      <TopBar title="Notifikasi" back="/dashboard" right={<IconLink href="/settings/notifications" label="Pengaturan notifikasi" icon="settings" size={22} strokeWidth={1.8} />} />

      <div className="flex flex-col gap-3 px-4 pt-1">
        <FilterPills options={filters} value={filter} onChange={setFilter} />
        <div className="flex h-8 items-center justify-between">
          <span className="text-[13px] text-muted" aria-live="polite">
            {unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}
          </span>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => setRead(Object.fromEntries(notifications.map((n) => [n.id, true])))}
              className="h-8 border-0 bg-transparent p-0 text-[13px] font-semibold text-accent"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        {groups.map((g) => {
          const rows = list.filter((n) => n.group === g);
          if (!rows.length) return null;
          return (
            <section key={g} className="mt-2">
              <h2 className="m-0 flex h-8 items-center text-[13px] font-semibold text-fg-2">{g}</h2>
              <ul className="m-0 list-none overflow-hidden rounded-[14px] bg-card p-0">
                {rows.map((n, i) => {
                  const u = isUnread(n);
                  const k = notificationKinds[n.kind];
                  return (
                    <li key={n.id} className={i < rows.length - 1 ? "border-b border-surface" : undefined}>
                      <Link
                        href={n.href}
                        onClick={() => setRead({ ...read, [n.id]: true })}
                        className={cx("flex gap-3 p-3.5 text-fg no-underline hover:text-fg", u ? "bg-[#1A1D23]" : "bg-transparent")}
                      >
                        <span className="flex size-10 flex-none items-center justify-center rounded-xl" style={{ background: k.tile, color: k.fg }}>
                          <Icon name={k.icon} strokeWidth={n.kind === "over" ? 2 : 1.8} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className={cx("text-[15px] leading-5", u ? "font-semibold" : "font-medium")}>{n.title}</span>
                            <span className="flex flex-none items-center gap-1.5 text-xs leading-5 text-muted">
                              {n.time}
                              {u && <span className="size-2 rounded-full bg-accent" aria-label="Belum dibaca" />}
                            </span>
                          </span>
                          <span className="mt-[3px] block text-[13px] leading-[19px] text-fg-2">{n.body}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        {list.length === 0 && (
          <div className="flex flex-col items-center gap-2.5 px-6 pt-[72px] text-center">
            <StateIcon icon="bell" bg="var(--color-surface)" fg="var(--color-muted)" size={64} iconSize={28} />
            <span className="text-base font-semibold">Belum ada notifikasi</span>
            <span className="text-[13px] text-muted">Notifikasi untuk kategori ini akan muncul di sini.</span>
          </div>
        )}
      </div>
    </div>
  );
}
