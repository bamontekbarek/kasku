import type { Metadata } from "next";
import { Settings } from "../Settings";
import { InstallSheet } from "./InstallSheet";

export const metadata: Metadata = { title: "Pasang di Layar Utama" };

export default function InstallPage() {
  return <Settings overlay={<InstallSheet />} />;
}
