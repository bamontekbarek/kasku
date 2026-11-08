import type { Metadata } from "next";
import { NotifSettings } from "./NotifSettings";

export const metadata: Metadata = { title: "Pengaturan Notifikasi" };

export default function NotifSettingsPage() {
  return <NotifSettings />;
}
