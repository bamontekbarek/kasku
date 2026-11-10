import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Welcome } from "./Welcome";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("welcome") };
}

/** Preview of the new-user dashboard; /dashboard shows it by itself while there are no transactions. */
export default function WelcomePage() {
  return <Welcome />;
}
