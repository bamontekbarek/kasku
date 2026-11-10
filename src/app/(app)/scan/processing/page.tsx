import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Processing } from "./Processing";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("processing") };
}

export default function ProcessingPage() {
  return <Processing />;
}
