import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "./render";

export type NotificationRow = {
  id: string;
  type: NotificationType;
  params: Record<string, unknown>;
  link: string;
  readAt: string | null;
  createdAt: string;
};

export type NotificationSettings = {
  budgetNear: boolean;
  budgetThreshold: 70 | 80 | 90;
  budgetOver: boolean;
  dailyReminder: boolean;
  /** "HH:MM" */
  reminderTime: string;
  weeklySummary: boolean;
  monthlyReport: boolean;
};

/** DASH-10: unread count for the bell dot. */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** NOT-01: latest notifications (older ones are cleaned up after 120 days). */
export async function getNotifications(limit = 100): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, params, link, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data.map((r) => ({
    id: r.id,
    type: r.type,
    params: (r.params ?? {}) as Record<string, unknown>,
    link: r.link,
    readAt: r.read_at,
    createdAt: r.created_at,
  }));
}

/** NOT-04. The row is created with the account (handle_new_user). */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_settings")
    .select("budget_near, budget_threshold, budget_over, daily_reminder, reminder_time, weekly_summary, monthly_report")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    budgetNear: data?.budget_near ?? true,
    budgetThreshold: ([70, 80, 90].includes(data?.budget_threshold ?? 80) ? data?.budget_threshold ?? 80 : 80) as 70 | 80 | 90,
    budgetOver: data?.budget_over ?? true,
    dailyReminder: data?.daily_reminder ?? true,
    reminderTime: (data?.reminder_time ?? "20:00").slice(0, 5),
    weeklySummary: data?.weekly_summary ?? true,
    monthlyReport: data?.monthly_report ?? true,
  };
}
