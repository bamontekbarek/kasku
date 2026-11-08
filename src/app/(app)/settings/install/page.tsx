import type { Metadata } from "next";
import { getAccount } from "@/lib/auth/account";
import { Settings } from "../Settings";
import { InstallSheet } from "./InstallSheet";

export const metadata: Metadata = { title: "Pasang di Layar Utama" };

export default async function InstallPage() {
  return <Settings account={await getAccount()} overlay={<InstallSheet />} />;
}
