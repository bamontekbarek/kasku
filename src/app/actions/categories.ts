"use server";

import { revalidatePath } from "next/cache";
import { getAccount } from "@/lib/auth/account";
import { categorySchema, type CategoryInput } from "@/lib/expenses/schema";
import { createClient } from "@/lib/supabase/server";

export type CategoryResult = { ok: true; id: string } | { ok: false; error: "invalid" | "duplicate" | "locked" | "generic" };

function failure(error: { code?: string; message: string }): CategoryResult {
  if (error.code === "23505") return { ok: false, error: "duplicate" };
  if (error.code === "42501") return { ok: false, error: "locked" };
  console.error("category action failed", error.code, error.message);
  return { ok: false, error: "generic" };
}

/** CAT-02: new category, placed after the existing ones (the system "Lainnya" stays last). */
export async function createCategory(input: CategoryInput): Promise<CategoryResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [{ id: userId }, supabase] = await Promise.all([getAccount(), createClient()]);
  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("is_system", false)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("categories")
    .insert({ user_id: userId, name: parsed.data.name, color: parsed.data.color, sort_order: Math.min((last?.sort_order ?? 0) + 1, 98) })
    .select("id")
    .single();
  if (error) return failure(error);

  revalidatePath("/", "layout");
  return { ok: true, id: data.id };
}

/** CAT-02: rename / recolour. The system category keeps its name. */
export async function updateCategory(id: string, input: CategoryInput): Promise<CategoryResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data: current, error: readError } = await supabase.from("categories").select("is_system, name").eq("id", id).maybeSingle();
  if (readError) return failure(readError);
  if (!current) return { ok: false, error: "generic" };

  const name = current.is_system ? current.name : parsed.data.name;
  const { error } = await supabase.from("categories").update({ name, color: parsed.data.color }).eq("id", id);
  if (error) return failure(error);

  revalidatePath("/", "layout");
  return { ok: true, id };
}

/** CAT-03: transactions move to "Lainnya"; "Lainnya" itself can't be deleted. */
export async function deleteCategory(id: string): Promise<CategoryResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_category", { p_id: id });
  if (error) return failure(error);
  revalidatePath("/", "layout");
  return { ok: true, id };
}
