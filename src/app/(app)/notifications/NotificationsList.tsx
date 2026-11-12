"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { markNotificationsRead } from "@/app/actions/notifications";
import { Icon, type IconName } from "@/components/Icon";
import { IconLink, StateIcon, TopBar } from "@/components/ui";
import type { NotificationGroup, NotificationKind } from "@/lib/notifications/render";
import { cx } from "@/lib/format";

export type NotificationItem = {
  id: string;
  group: "today" | "yesterday" | "earlier";
  filter: NotificationGroup;
  kind: NotificationKind;
  time: string;
  unread: boolean;
  href: string;
  title: string;
  body: string;
};

const KINDS: Record<NotificationKind, { tile: string; fg: string; icon: IconName }> = {
  over: { tile: "#2A1519", fg: "#FF5C70", icon: "alertTriangle" },
  budget: { tile: "#2E2A12", fg: "#FCD535", icon: "wallet" },
  remind: { tile: "#14233D", fg: "#4C8DF6", icon: "receiptAdd" },
  summary: { tile: "#12291F", fg: "#2EBD85", icon: "chart" },
  account: { tile: "#241D3A", fg: "#A88BFA", icon: "lock" },
};

const FILTERS = ["all", "budget", "reminder", "summary", "account"] as const;
const GROUPS = ["today", "yesterday", "earlier"] as const;

export function NotificationsList({ items }: { items: NotificationItem[] }) {
  const t = useTranslations("notifications");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [read, setRead] = useState<Record<string, boolean>>({});

  const isUnread = (n: NotificationItem) => n.unread && !read[n.id];
  const list = items.filter((n) => filter === "all" || n.filter === filter);
  const unread = items.filter(isUnread).length;

  const markAll = () => {
    setRead(Object.fromEntries(items.map((n) => [n.id, true])));
    void markNotificationsRead();
  };

  const open = (n: NotificationItem) => {
    if (!isUnread(n)) return;
    setRead((r) => ({ ...r, [n.id]: true }));
    void markNotificationsRead([n.id]);
  };

  return (
    <div className="pt-safe flex h-dvh flex-col bg-bg">
      <TopBar title={t("title")} back="/dashboard" right={<IconLink href="/settings/notifications" label={t("settings")} icon="settings" size={22} strokeWidth={1.8} />} />

      <div className="flex flex-col gap-3 px-4 pt-1">
        <div role="group" aria-label={t("filtersLabel")} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((f) => {
            const on = f === filter;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f)}
                className={cx("h-[34px] flex-none rounded-lg border-0 px-3.5 text-sm", on ? "bg-raised font-semibold text-fg" : "bg-transparent font-medium text-muted")}
              >
                {t(`filter.${f}`)}
              </button>
            );
          })}
        </div>
        <div className="flex h-8 items-center justify-between">
          <span className="text-[13px] text-muted" aria-live="polite">
            {unread > 0 ? t("unread", { count: unread }) : t("allRead")}
          </span>
          {unread > 0 && (
            <button type="button" onClick={markAll} className="h-8 border-0 bg-transparent p-0 text-[13px] font-semibold text-accent">
              {t("markAll")}
            </button>
          )}
        </div>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        {GROUPS.map((g) => {
          const rows = list.filter((n) => n.group === g);
          if (!rows.length) return null;
          return (
            <section key={g} className="mt-2">
              <h2 className="m-0 flex h-8 items-center text-[13px] font-semibold text-fg-2">{t(g)}</h2>
              <ul className="m-0 list-none overflow-hidden rounded-[14px] bg-card p-0">
                {rows.map((n, i) => {
                  const u = isUnread(n);
                  const k = KINDS[n.kind];
                  return (
                    <li key={n.id} className={i < rows.length - 1 ? "border-b border-surface" : undefined}>
                      <Link
                        href={n.href}
                        onClick={() => open(n)}
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
                              {u && (
                                <span className="size-2 rounded-full bg-accent">
                                  <span className="sr-only">{t("unreadDot")}</span>
                                </span>
                              )}
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
            <span className="text-base font-semibold">{t("emptyTitle")}</span>
            <span className="text-[13px] text-muted">{filter === "all" ? t("emptyAll") : t("emptyFilter")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
