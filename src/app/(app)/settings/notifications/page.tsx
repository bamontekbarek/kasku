import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getNotificationSettings } from "@/lib/notifications/queries";
import { NotifSettings } from "./NotifSettings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("notifSettings") };
}

/** NOT-04: per-type settings + daily reminder time. Push to the phone (NOT-05) is phase 2. */
export default async function NotifSettingsPage() {
  return <NotifSettings initial={await getNotificationSettings()} />;
}
