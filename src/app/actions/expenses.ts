"use server";

import { revalidatePath } from "next/cache";
import { getAccount } from "@/lib/auth/account";
import { spentAtFor } from "@/lib/expenses/dates";
import { expenseSchema, type ExpenseInput } from "@/lib/expenses/schema";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: "invalid" | "notFound" | "generic" };

/** EXP-01, EXP-05: add (id = null) or update a transaction. RLS keeps it to the signed-in user. */
export async function saveExpense(id: string | null, input: ExpenseInput): Promise<ActionResult> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const [{ timeZone }, supabase] = await Promise.all([getAccount(), createClient()]);
  const { data, error } = await supabase.rpc("save_expense", {
    p_id: id,
    p_amount: v.amount,
    p_merchant: v.merchant,
    p_spent_at: spentAtFor(v.date, v.time, timeZone),
    p_category_id: v.categoryId,
    p_payment_method: v.paymentMethod,
    p_note: v.note,
    p_items: v.items,
  });
  if (error) {
    console.error("save_expense failed", error.code, error.message);
    return { ok: false, error: error.code === "P0002" ? "notFound" : "generic" };
  }

  revalidatePath("/", "layout");
  return { ok: true, id: data };
}

/** EXP-05: delete a transaction; its receipt items go with it (on delete cascade). */
export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error, count } = await supabase.from("expenses").delete({ count: "exact" }).eq("id", id);
  if (error) {
    console.error("delete expense failed", error.code, error.message);
    return { ok: false, error: "generic" };
  }
  revalidatePath("/", "layout");
  return count ? { ok: true } : { ok: false, error: "notFound" };
}
