import type { Database } from "@/types/database";

export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type ExpenseSource = Database["public"]["Enums"]["expense_source"];
export type Period = "day" | "week" | "month" | "year";

/** EXP-01 payment methods, in display order. Labels live in messages `payment.*`. */
export const PAYMENT_METHODS: PaymentMethod[] = ["cash", "debit", "qris", "credit_card", "ewallet"];

export const PERIODS: Period[] = ["day", "week", "month", "year"];

/** CAT-02: the 8 category colours. Labels live in messages `categories.colors.*`. */
export const CATEGORY_COLORS = [
  { hex: "#FCD535", key: "yellow" },
  { hex: "#F5913E", key: "orange" },
  { hex: "#FF5C70", key: "red" },
  { hex: "#F06BA8", key: "pink" },
  { hex: "#A88BFA", key: "purple" },
  { hex: "#4C8DF6", key: "blue" },
  { hex: "#2EBD85", key: "green" },
  { hex: "#5E6673", key: "gray" },
] as const;

export type CategoryColorKey = (typeof CATEGORY_COLORS)[number]["key"];

/** Fallback colour for a category that no longer exists. */
export const NEUTRAL_COLOR = "#5E6673";

/** Upper bound that fits a Postgres bigint and stays a safe JS integer. */
export const MAX_AMOUNT = 999_999_999_999;
