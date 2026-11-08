import type { Metadata } from "next";
import { CameraView } from "./CameraView";

export const metadata: Metadata = { title: "Foto Struk" };

export default function ScanPage() {
  return <CameraView />;
}
