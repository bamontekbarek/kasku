import { z } from "zod";
import { CATEGORY_COLORS, MAX_AMOUNT, PAYMENT_METHODS } from "./constants";

/** Messages are translation keys under `validation.*`. */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateRequired");

export const expenseItemSchema = z.object({
  name: z.string().trim().min(1, "itemNameRequired").max(80, "itemNameTooLong"),
  price: z.number().int().min(0).max(MAX_AMOUNT, "amountTooLarge"),
});

/** EXP-01, EXP-02: amount and date are required, amount > 0. */
export const expenseSchema = z.object({
  amount: z
    .number({ error: "amountRequired" })
    .int("amountRequired")
    .min(1, "amountPositive")
    .max(MAX_AMOUNT, "amountTooLarge"),
  merchant: z.string().trim().max(80, "merchantTooLong"),
  date: isoDate,
  /** "HH:MM"; empty = keep the current time of day (manual add). */
  time: z.union([z.literal(""), z.string().regex(/^\d{2}:\d{2}$/, "timeInvalid")]),
  categoryId: z.uuid("categoryRequired"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  note: z.string().trim().max(500, "noteTooLong"),
  /** null = leave the receipt items as they are. */
  items: z.array(expenseItemSchema).max(100).nullable(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

const colorHexes = CATEGORY_COLORS.map((c) => c.hex) as [string, ...string[]];

/** CAT-02: name up to 24 characters, one of 8 colours. */
export const categorySchema = z.object({
  name: z.string().trim().min(1, "categoryNameRequired").max(24, "categoryNameTooLong"),
  color: z.enum(colorHexes),
});

export type CategoryInput = z.infer<typeof categorySchema>;
