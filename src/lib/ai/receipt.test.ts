import { describe, expect, it } from "vitest";
import { matchCategory, matchPayment, normalizeReceipt, rawReceiptSchema } from "./receipt";

const categories = [
  { id: "food", name: "Makanan & Minuman", isSystem: false },
  { id: "groceries", name: "Belanja Harian", isSystem: false },
  { id: "other", name: "Lainnya", isSystem: true },
];
const today = "2026-11-06";

const sample = {
  is_receipt: true,
  merchant: { value: "Toko Maju Jaya", confidence: 0.95 },
  date: { value: "2026-11-06", confidence: 0.9 },
  time: { value: "19:42", confidence: 0.9 },
  total: { value: 100000, confidence: 0.97 },
  payment_method: { value: "debit", confidence: 0.8 },
  category: { value: "Belanja Harian", confidence: 0.85 },
  items: [
    { name: "Beras 5 kg", price: 74500, confidence: 0.93 },
    { name: "Sabun", price: 25500, confidence: 0.5 },
  ],
};

const run = (overrides: object = {}) => normalizeReceipt(rawReceiptSchema.parse({ ...sample, ...overrides }), { categories, today });

describe("AI receipt normalisation (SCAN-04, REV-02)", () => {
  it("maps a clean receipt to form values", () => {
    const r = run();
    expect(r.amount).toEqual({ value: 100000, check: false });
    expect(r.categoryId).toEqual({ value: "groceries", check: false });
    expect(r.paymentMethod).toEqual({ value: "debit", check: false });
    expect(r.time.value).toBe("19:42");
    expect(r.items[1]).toEqual({ name: "Sabun", price: 25500, check: true });
  });

  it("flags dates in the future or older than 60 days and falls back to today", () => {
    expect(run({ date: { value: "2026-11-07", confidence: 1 } }).date).toEqual({ value: today, check: true });
    expect(run({ date: { value: "2026-08-01", confidence: 1 } }).date.check).toBe(true);
    expect(run({ date: { value: "06/11/2026", confidence: 1 } }).date.check).toBe(true);
    expect(run({ date: { value: "2026-11-06", confidence: 0.55 } }).date.check).toBe(true);
  });

  it("flags a missing total and an items/total mismatch", () => {
    expect(run({ total: { value: null, confidence: 0.9 } }).amount).toEqual({ value: 0, check: true });
    expect(run({ total: { value: 99000, confidence: 0.99 } }).amount.check).toBe(true);
  });

  it("parses money strings and drops nameless items", () => {
    const r = run({ total: { value: "Rp 100.000", confidence: 0.9 }, items: [{ name: " ", price: 1 }, { name: "Beras", price: "100.000", confidence: 0.9 }] });
    expect(r.amount.value).toBe(100000);
    expect(r.items).toEqual([{ name: "Beras", price: 100000, check: false }]);
  });

  it("falls back to the system category and cash with Cek lagi", () => {
    const r = run({ category: { value: "Elektronik", confidence: 0.9 }, payment_method: { value: "bitcoin", confidence: 0.9 } });
    expect(r.categoryId).toEqual({ value: "other", check: true });
    expect(r.paymentMethod).toEqual({ value: "cash", check: true });
  });

  it("survives missing fields", () => {
    const r = normalizeReceipt(rawReceiptSchema.parse({ is_receipt: true }), { categories, today });
    expect(r.merchant.check).toBe(true);
    expect(r.items).toEqual([]);
  });

  it("matches payment words and categories loosely", () => {
    expect(matchPayment("GoPay")).toBe("ewallet");
    expect(matchPayment("QRIS BCA")).toBe("qris");
    expect(matchPayment("Tunai")).toBe("cash");
    expect(matchCategory("makanan", categories)).toBe("food");
    expect(matchCategory("", categories)).toBeNull();
  });
});
