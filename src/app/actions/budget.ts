"use server";

import { revalidatePath } from "next/cache";
import { budgetSchema, type BudgetInput } from "@/lib/budget/schema";
import { createClient } from "@/lib/supabase/server";

export type BudgetResult = { ok: true } | { ok: false; error: "invalid" | "generic" };

/** BUD-01: replace one month's total + category limits; also stores the "remind me" toggle (NOT-04). */
export async function saveBudget(input: BudgetInput): Promise<BudgetResult> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_budget", {
    p_month: `${v.month}-01`,
    p_total: v.total,
    p_categories: v.categories.map((c) => ({ category_id: c.categoryId, amount: c.amount })),
    p_remind: v.remind,
  });
  if (error) {
    console.error("save_budget failed", error.code, error.message);
    return { ok: false, error: error.code === "22023" ? "invalid" : "generic" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
