import { z } from "zod";
import { MAX_AMOUNT } from "@/lib/expenses/constants";

/** BUD-01: total is required; a category limit of 0 means "no limit". Messages are keys under `validation.*`. */
export const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  total: z.number().int().min(1, "budgetTotalRequired").max(MAX_AMOUNT, "amountTooLarge"),
  categories: z
    .array(z.object({ categoryId: z.uuid(), amount: z.number().int().min(0).max(MAX_AMOUNT, "amountTooLarge") }))
    .max(200),
  remind: z.boolean(),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
