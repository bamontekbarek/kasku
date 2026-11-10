import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CropView } from "./CropView";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("crop") };
}

export default function CropPage() {
  return <CropView />;
}
