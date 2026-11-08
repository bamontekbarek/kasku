import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return <RegisterForm />;
}
