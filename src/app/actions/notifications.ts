"use server";

import { revalidatePath } from "next/cache";
import { notificationSettingsSchema, type NotificationSettingsPatch } from "@/lib/notifications/schema";
import { getAccount } from "@/lib/auth/account";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type NotificationResult = { ok: true } | { ok: false };

/** NOT-02: mark some (ids) or all (no ids) notifications as read. Only read_at changes. */
export async function markNotificationsRead(ids?: string[]): Promise<NotificationResult> {
  const valid = ids?.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (ids && !valid?.length) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notifications_read", { p_ids: valid ?? null });
  if (error) {
    console.error("mark_notifications_read failed", error.code, error.message);
    return { ok: false };
  }
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { ok: true };
}

/** NOT-04: save changed settings. */
export async function updateNotificationSettings(patch: NotificationSettingsPatch): Promise<NotificationResult> {
  const parsed = notificationSettingsSchema.safeParse(patch);
  if (!parsed.success) return { ok: false };
  const v = parsed.data;
  const row: Database["public"]["Tables"]["notification_settings"]["Update"] = {
    budget_near: v.budgetNear,
    budget_threshold: v.budgetThreshold,
    budget_over: v.budgetOver,
    daily_reminder: v.dailyReminder,
    reminder_time: v.reminderTime,
    weekly_summary: v.weeklySummary,
    monthly_report: v.monthlyReport,
  };
  if (Object.values(row).every((val) => val === undefined)) return { ok: true };

  const [{ id }, supabase] = await Promise.all([getAccount(), createClient()]);
  const { error } = await supabase.from("notification_settings").update(row).eq("user_id", id);
  if (error) {
    console.error("notification settings update failed", error.code, error.message);
    return { ok: false };
  }
  revalidatePath("/settings/notifications");
  revalidatePath("/budget", "layout");
  return { ok: true };
}
