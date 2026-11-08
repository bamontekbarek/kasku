import type { Metadata } from "next";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = { title: "Periksa Hasil Scan" };

export default function ReviewPage() {
  return <ReviewForm />;
}
