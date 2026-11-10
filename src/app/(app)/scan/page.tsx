import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CameraView } from "./CameraView";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("camera") };
}

export default function ScanPage() {
  return <CameraView />;
}
