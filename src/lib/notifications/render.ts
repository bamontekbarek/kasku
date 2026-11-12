/**
 * Notification text is rendered from `type` + `params` at read time (not stored), so it follows the
 * user's current language (ACC-02). Pure: the translator and formatters are passed in.
 */
import type { Database } from "@/types/database";
import { deltaPct, formatPct } from "@/lib/expenses/summary";
import { safePerDay } from "@/lib/budget/status";
import { rp } from "@/lib/format";

export type NotificationType = Database["public"]["Enums"]["notification_type"];

/** NOT-01 filter groups. */
export type NotificationGroup = "budget" | "reminder" | "summary" | "account";

/** Visual style of the tile (icon + colour). */
export type NotificationKind = "over" | "budget" | "remind" | "summary" | "account";

export const GROUP_OF: Record<NotificationType, NotificationGroup> = {
  budget_near: "budget",
  budget_over: "budget",
  daily_reminder: "reminder",
  weekly_summary: "summary",
  monthly_report: "summary",
  security: "account",
};

export const KIND_OF: Record<NotificationType, NotificationKind> = {
  budget_near: "budget",
  budget_over: "over",
  daily_reminder: "remind",
  weekly_summary: "summary",
  monthly_report: "summary",
  security: "account",
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

export type RenderContext = {
  t: Translate;
  locale: string;
  /** "2026-11-02" → "2 Nov" */
  shortDate: (day: string) => string;
  /** "2026-10-01" → "Oktober 2026" */
  monthTitle: (day: string) => string;
};

type Params = Record<string, unknown>;

const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function change(ctx: RenderContext, total: number, prev: number, prevLabel: string): string {
  const d = deltaPct(total, prev);
  if (d === null) return "";
  if (Math.abs(d) < 0.05) return " " + ctx.t("changeSame", { prev: prevLabel });
  return " " + ctx.t(d > 0 ? "changeUp" : "changeDown", { pct: formatPct(d, ctx.locale), prev: prevLabel });
}

export function renderNotification(type: NotificationType, params: Params, ctx: RenderContext): { title: string; body: string } {
  const { t } = ctx;
  switch (type) {
    case "budget_over": {
      const v = { name: s(params.name), used: rp(n(params.used)), limit: rp(n(params.limit)) };
      return { title: params.name ? t("overTitle", v) : t("overTotalTitle"), body: t("overBody", v) };
    }
    case "budget_near": {
      const left = Math.max(0, n(params.limit) - n(params.used));
      const days = n(params.days_left);
      if (!params.name) {
        return {
          title: t("nearTotalTitle", { pct: n(params.pct) }),
          body: t("nearTotalBody", { left: rp(left), days, perDay: rp(safePerDay(left, days)) }),
        };
      }
      return {
        title: t("nearTitle", { name: s(params.name), pct: n(params.threshold) || n(params.pct) }),
        body: t("nearBody", { used: rp(n(params.used)), limit: rp(n(params.limit)), left: rp(left) }),
      };
    }
    case "daily_reminder":
      return { title: t("reminderTitle"), body: t("reminderBody") };
    case "weekly_summary": {
      const range = `${ctx.shortDate(s(params.start))} – ${ctx.shortDate(s(params.end))}`;
      const total = n(params.total);
      return {
        title: t("weeklyTitle"),
        body: t("weeklyBody", { range, total: rp(total), count: n(params.count) }) + change(ctx, total, n(params.prev_total), t("prevWeek")),
      };
    }
    case "monthly_report": {
      const total = n(params.total);
      const top = s(params.top);
      return {
        title: t("monthlyTitle", { month: ctx.monthTitle(s(params.month)) }),
        body:
          t("monthlyBody", { total: rp(total), count: n(params.count) }) +
          change(ctx, total, n(params.prev_total), t("prevMonth")) +
          (top ? " " + t("monthlyTop", { top }) : ""),
      };
    }
    case "security":
      return { title: t("passwordTitle"), body: t("passwordBody") };
  }
}
