import "server-only";
import { getAccount } from "@/lib/auth/account";
import { rawReceiptSchema, normalizeReceipt, type ScanResult } from "@/lib/ai/receipt";
import { todayIn } from "@/lib/expenses/dates";
import { getCategories } from "@/lib/expenses/queries";
import { createClient } from "@/lib/supabase/server";
import { scanConfig } from "./config";

const PHOTO_TTL = 60 * 10;

/** SCAN-06: scans left today, for the "Isi otomatis dari struk" card. */
export async function getScanQuota(): Promise<{ left: number; total: number }> {
  const [{ timeZone }, supabase] = await Promise.all([getAccount(), createClient()]);
  const total = scanConfig().dailyLimit;
  const { data } = await supabase.from("scan_usage").select("count").eq("day", todayIn(timeZone)).maybeSingle();
  return { left: Math.max(0, total - (data?.count ?? 0)), total };
}

/** Short-lived signed URL for a receipt photo the user owns (bucket stays private). */
export async function receiptPhotoUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage.from("receipts").createSignedUrl(storagePath, PHOTO_TTL);
  return data?.signedUrl ?? null;
}

export type ScanReview = { id: string; result: ScanResult; photoUrl: string | null; savedExpenseId: string | null };

/** REV-01: AI result of one finished scan, mapped onto the user's categories, ready to edit. */
export async function getScanReview(id: string): Promise<ScanReview | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [account, supabase, categories] = await Promise.all([getAccount(), createClient(), getCategories()]);
  const { data: receipt } = await supabase.from("receipts").select("id, status, ai_result, storage_path").eq("id", id).maybeSingle();
  if (!receipt || receipt.status !== "done") return null;

  const raw = rawReceiptSchema.safeParse(receipt.ai_result);
  if (!raw.success) return null;

  const [{ data: saved }, photoUrl] = await Promise.all([
    supabase.from("expenses").select("id").eq("receipt_id", id).maybeSingle(),
    receiptPhotoUrl(receipt.storage_path),
  ]);

  return {
    id: receipt.id,
    result: normalizeReceipt(raw.data, { categories, today: todayIn(account.timeZone) }),
    photoUrl,
    savedExpenseId: saved?.id ?? null,
  };
}
