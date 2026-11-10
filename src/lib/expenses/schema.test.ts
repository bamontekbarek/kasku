import { describe, expect, it } from "vitest";
import { categorySchema, expenseSchema } from "./schema";

const base = {
  amount: 50000,
  merchant: " Makan siang ",
  date: "2026-11-06",
  time: "",
  categoryId: "3f1c2a3b-1d2e-4f5a-8b6c-7d8e9f0a1b2c",
  paymentMethod: "qris" as const,
  note: "",
  items: null,
};

describe("expenseSchema (EXP-02)", () => {
  it("accepts a manual expense and trims text", () => {
    const r = expenseSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data?.merchant).toBe("Makan siang");
  });

  it("requires amount > 0 and a date", () => {
    expect(expenseSchema.safeParse({ ...base, amount: 0 }).error?.issues[0]?.message).toBe("amountPositive");
    expect(expenseSchema.safeParse({ ...base, amount: 1.5 }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...base, date: "" }).error?.issues[0]?.message).toBe("dateRequired");
  });

  it("rejects unknown payment methods and long notes", () => {
    expect(expenseSchema.safeParse({ ...base, paymentMethod: "bitcoin" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...base, note: "x".repeat(501) }).success).toBe(false);
  });

  it("validates receipt items", () => {
    expect(expenseSchema.safeParse({ ...base, items: [{ name: "Beras", price: 74500 }] }).success).toBe(true);
    expect(expenseSchema.safeParse({ ...base, items: [{ name: " ", price: 1 }] }).success).toBe(false);
  });
});

describe("categorySchema (CAT-02)", () => {
  it("limits names to 24 characters and the 8 colours", () => {
    expect(categorySchema.safeParse({ name: "Pendidikan", color: "#4C8DF6" }).success).toBe(true);
    expect(categorySchema.safeParse({ name: "x".repeat(25), color: "#4C8DF6" }).error?.issues[0]?.message).toBe("categoryNameTooLong");
    expect(categorySchema.safeParse({ name: "Pendidikan", color: "#123456" }).success).toBe(false);
  });
});
