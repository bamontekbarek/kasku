import type { Metadata } from "next";
import { DeleteAccountForm } from "./DeleteAccountForm";

export const metadata: Metadata = { title: "Hapus Akun" };

export default function DeleteAccountPage() {
  return <DeleteAccountForm />;
}
