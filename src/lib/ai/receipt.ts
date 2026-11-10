import { z } from "zod";
import type { PaymentMethod } from "@/lib/expenses/constants";
import { daysBetween } from "@/lib/expenses/dates";

/** Below this the model is "unsure" → label Cek lagi (REV-02). */
export const LOW_CONFIDENCE = 0.7;
export const MAX_ITEMS = 40;

/** "187.400", "Rp 187,400", 187400 → 187400 */
const money = z.preprocess((v) => {
  if (typeof v === "number") return Math.round(v);
  if (typeof v === "string") {
    const digits = v.replace(/[^\d]/g, "");
    return digits ? Number(digits) : null;
  }
  return null;
}, z.number().int().nonnegative().nullable());

const confidence = z.number().min(0).max(1).catch(0.5);

function field<T extends z.ZodType>(value: T) {
  return z
    .object({ value: value.nullable().catch(null), confidence })
    .nullable()
    .catch(null)
    .optional();
}

/** What we ask the model for (PRD 7). Lenient: bad pieces become null instead of failing the scan. */
export const rawReceiptSchema = z.object({
  is_receipt: z.boolean(),
  merchant: field(z.string()),
  date: field(z.string()),
  time: field(z.string()),
  total: field(money),
  payment_method: field(z.string()),
  category: field(z.string()),
  items: z
    .array(z.object({ name: z.string().catch(""), price: money.catch(null), confidence }).catch({ name: "", price: null, confidence: 0 }))
    .catch([])
    .optional(),
});

export type RawReceipt = z.infer<typeof rawReceiptSchema>;

export type Checked<T> = { value: T; check: boolean };

/** Prefill for the review screen. `check` = show "Cek lagi" (REV-02). */
export type ScanResult = {
  amount: Checked<number>;
  merchant: Checked<string>;
  date: Checked<string>;
  time: Checked<string>;
  categoryId: Checked<string>;
  paymentMethod: Checked<PaymentMethod>;
  items: Array<{ name: string; price: number; check: boolean }>;
};

const PAYMENT_WORDS: Array<[PaymentMethod, RegExp]> = [
  ["qris", /qris|qr/i],
  ["credit_card", /credit|kredit|visa|master|cc\b/i],
  ["ewallet", /e-?wallet|gopay|ovo|dana|shopee|linkaja|wallet/i],
  ["debit", /debit|atm|edc|bca|bri|bni|mandiri|card|kartu/i],
  ["cash", /cash|tunai|kontan|uang/i],
];

export function matchPayment(value: string | null | undefined): PaymentMethod | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (["cash", "debit", "qris", "credit_card", "ewallet"].includes(v)) return v as PaymentMethod;
  return PAYMENT_WORDS.find(([, re]) => re.test(v))?.[0] ?? null;
}

export function matchCategory(value: string | null | undefined, categories: Array<{ id: string; name: string }>): string | null {
  if (!value) return null;
  const v = value.trim().toLocaleLowerCase();
  if (!v) return null;
  const exact = categories.find((c) => c.name.toLocaleLowerCase() === v);
  if (exact) return exact.id;
  const loose = categories.find((c) => {
    const n = c.name.toLocaleLowerCase();
    return n.includes(v) || v.includes(n);
  });
  return loose?.id ?? null;
}

const low = (f: { confidence: number } | null | undefined) => !f || f.confidence < LOW_CONFIDENCE;

/**
 * Turn the model's JSON into form values + "Cek lagi" flags. Besides the model's own confidence,
 * fixed rules (PRD 7) flag: date in the future or > 60 days ago, empty total, items ≠ total,
 * unknown payment method or category.
 */
export function normalizeReceipt(
  raw: RawReceipt,
  ctx: { categories: Array<{ id: string; name: string; isSystem: boolean }>; today: string },
): ScanResult {
  const fallbackCategory = ctx.categories.find((c) => c.isSystem) ?? ctx.categories[0];

  const items = (raw.items ?? [])
    .map((it) => ({ name: it.name.trim().slice(0, 80), price: it.price ?? 0, check: it.price === null || it.confidence < LOW_CONFIDENCE }))
    .filter((it) => it.name.length > 0)
    .slice(0, MAX_ITEMS);

  const total = raw.total?.value ?? 0;
  const itemsSum = items.reduce((a, it) => a + it.price, 0);

  const rawDate = raw.date?.value?.trim() ?? "";
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && !Number.isNaN(Date.parse(`${rawDate}T00:00:00Z`));
  const age = validDate ? daysBetween(rawDate, ctx.today) : null;
  const dateOk = validDate && age !== null && age >= 0 && age <= 60;

  const rawTime = raw.time?.value?.trim() ?? "";
  const timeMatch = /^(\d{1,2})[:.](\d{2})/.exec(rawTime);
  const time = timeMatch && Number(timeMatch[1]) < 24 && Number(timeMatch[2]) < 60 ? `${timeMatch[1]!.padStart(2, "0")}:${timeMatch[2]}` : "";

  const payment = matchPayment(raw.payment_method?.value);
  const categoryId = matchCategory(raw.category?.value, ctx.categories);

  return {
    amount: { value: total, check: total <= 0 || low(raw.total) || (items.length > 0 && itemsSum !== total) },
    merchant: { value: (raw.merchant?.value ?? "").trim().slice(0, 80), check: !raw.merchant?.value?.trim() || low(raw.merchant) },
    date: { value: dateOk ? rawDate : ctx.today, check: !dateOk || low(raw.date) },
    time: { value: time, check: Boolean(rawTime) && (!time || low(raw.time)) },
    categoryId: { value: categoryId ?? fallbackCategory?.id ?? "", check: !categoryId || low(raw.category) },
    paymentMethod: { value: payment ?? "cash", check: !payment || low(raw.payment_method) },
    items,
  };
}
