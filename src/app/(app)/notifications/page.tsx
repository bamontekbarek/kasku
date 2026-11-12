import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getAccount } from "@/lib/auth/account";
import { localParts, todayIn } from "@/lib/expenses/dates";
import { intlLocale, monthTitle, shortDate } from "@/lib/expenses/summary";
import { getNotifications } from "@/lib/notifications/queries";
import { GROUP_OF, KIND_OF, renderNotification } from "@/lib/notifications/render";
import { NotificationsList, type NotificationItem } from "./NotificationsList";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("notifications") };
}

/** NOT-01, NOT-02: in-app notifications grouped Today / Yesterday / Earlier. Text follows the current language. */
export default async function NotificationsPage() {
  const [account, locale, t, rows] = await Promise.all([getAccount(), getLocale(), getTranslations("notifications"), getNotifications()]);
  const today = todayIn(account.timeZone);
  const yesterday = localParts(new Date(Date.parse(`${today}T12:00:00Z`) - 86_400_000), "UTC").date;
  const weekday = new Intl.DateTimeFormat(intlLocale(locale), { timeZone: account.timeZone, weekday: "short" });

  const ctx = {
    t: (key: string, values?: Record<string, string | number>) => t(key as never, values as never),
    locale,
    shortDate: (d: string) => shortDate(d, locale),
    monthTitle: (d: string) => monthTitle(d, locale),
  };

  const items: NotificationItem[] = rows.map((n) => {
    const local = localParts(n.createdAt, account.timeZone);
    const group = local.date === today ? "today" : local.date === yesterday ? "yesterday" : "earlier";
    return {
      id: n.id,
      group,
      filter: GROUP_OF[n.type],
      kind: KIND_OF[n.type],
      time: group === "earlier" ? `${weekday.format(new Date(n.createdAt))}, ${shortDate(local.date, locale)}` : local.time,
      unread: n.readAt === null,
      href: n.link.startsWith("/") ? n.link : "/dashboard",
      ...renderNotification(n.type, n.params, ctx),
    };
  });

  return <NotificationsList items={items} />;
}
