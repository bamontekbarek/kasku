import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "./RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("register") };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
