"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, type ReactNode } from "react";
import { updateNotificationSettings } from "@/app/actions/notifications";
import { Icon } from "@/components/Icon";
import { Badge, Notice, Screen, SectionLabel, Segmented, Switch, TopBar } from "@/components/ui";
import type { NotificationSettings } from "@/lib/notifications/queries";

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

type Toggle = "budgetNear" | "budgetOver" | "dailyReminder" | "weeklySummary" | "monthlyReport";

/** Each change saves right away; on failure the switch flips back and an error shows. */
export function NotifSettings({ initial }: { initial: NotificationSettings }) {
  const t = useTranslations("notifSettings");
  const tc = useTranslations("common");
  const [s, setS] = useState(initial);
  const [error, setError] = useState(false);
  const timeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = async (patch: Partial<NotificationSettings>, prev: NotificationSettings) => {
    setError(false);
    const res = await updateNotificationSettings(patch);
    if (!res.ok) {
      setS(prev);
      setError(true);
    }
  };

  const change = (patch: Partial<NotificationSettings>) => {
    const prev = s;
    setS({ ...s, ...patch });
    void save(patch, prev);
  };

  const toggle = (k: Toggle) => () => change({ [k]: !s[k] });

  const changeTime = (value: string) => {
    if (!/^\d{2}:\d{2}$/.test(value)) return;
    const prev = s;
    setS({ ...s, reminderTime: value });
    if (timeTimer.current) clearTimeout(timeTimer.current);
    timeTimer.current = setTimeout(() => void save({ reminderTime: value }, prev), 600);
  };

  return (
    <Screen header={<TopBar title={t("title")} back="/notifications" />}>
      <div className="flex flex-col gap-5 px-4 pt-3 pb-8">
        <section className="flex flex-col gap-2 rounded-[14px] border border-raised bg-surface p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-accent-soft text-accent">
              <Icon name="bell" />
            </span>
            <div>
              <h2 className="m-0 flex items-center gap-2 text-[15px] font-semibold">
                {t("pushTitle")} <Badge tone="neutral" size="xs">{t("soon")}</Badge>
              </h2>
              <p className="mt-1 mb-0 text-[13px] leading-[19px] text-fg-2">{t("pushBody")}</p>
            </div>
          </div>
          <p className="m-0 text-xs leading-[17px] text-muted">{t("pushIos")}</p>
        </section>

        {error && (
          <Notice tone="danger" icon="alertTriangle" role="alert">
            {tc("genericError")}
          </Notice>
        )}

        <Group id="ns-budget" label={t("budget")}>
          <ToggleRow title={t("near")} sub={t("nearSub")} on={s.budgetNear} onToggle={toggle("budgetNear")} />
          {s.budgetNear && (
            <div className="flex min-h-14 items-center justify-between border-b border-surface">
              <span className="text-sm text-fg-2">{t("remindAt")}</span>
              <Segmented
                label={t("threshold")}
                className="!p-[3px] rounded-lg bg-surface"
                itemClass="h-8 rounded-md px-3 text-[13px]"
                activeClass="bg-raised text-accent font-semibold"
                options={(["70", "80", "90"] as const).map((v) => ({ value: v, label: `${v}%` }))}
                value={String(s.budgetThreshold) as "70" | "80" | "90"}
                onChange={(v) => change({ budgetThreshold: Number(v) as 70 | 80 | 90 })}
              />
            </div>
          )}
          <ToggleRow title={t("over")} sub={t("overSub")} on={s.budgetOver} onToggle={toggle("budgetOver")} last />
        </Group>

        <Group id="ns-remind" label={t("reminders")}>
          <ToggleRow title={t("daily")} sub={t("dailySub")} on={s.dailyReminder} onToggle={toggle("dailyReminder")} last={!s.dailyReminder} />
          {s.dailyReminder && (
            <div className="flex min-h-14 items-center justify-between">
              <label htmlFor="ns-time" className="text-sm text-fg-2">
                {t("time")}
              </label>
              <input
                id="ns-time"
                type="time"
                value={s.reminderTime}
                onChange={(e) => changeTime(e.target.value)}
                className="h-11 rounded-lg border border-raised bg-surface px-2.5 text-[15px] text-fg outline-none focus:border-accent"
              />
            </div>
          )}
        </Group>

        <Group id="ns-summary" label={t("summaries")}>
          <ToggleRow title={t("weekly")} sub={t("weeklySub")} on={s.weeklySummary} onToggle={toggle("weeklySummary")} />
          <ToggleRow title={t("monthly")} sub={t("monthlySub")} on={s.monthlyReport} onToggle={toggle("monthlyReport")} last />
        </Group>

        <Group id="ns-acc" label={t("account")}>
          <ToggleRow title={t("security")} sub={t("securitySub")} last>
            <Badge tone="neutral">{t("alwaysOn")}</Badge>
          </ToggleRow>
        </Group>
      </div>
    </Screen>
  );
}
