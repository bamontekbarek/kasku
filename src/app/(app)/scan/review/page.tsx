import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCategories } from "@/lib/expenses/queries";
import { getScanReview } from "@/lib/scan/queries";
import { ReviewForm } from "./ReviewForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("review") };
}

/** REV-01 – REV-07 for `?id=<receipt>`. Rendered on the server, so a reload doesn't lose the result. */
export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [review, categories] = await Promise.all([id ? getScanReview(id) : null, getCategories()]);
  if (!review) redirect("/add");
  return <ReviewForm receiptId={review.id} result={review.result} photoUrl={review.photoUrl} savedExpenseId={review.savedExpenseId} categories={categories} />;
}
