"use server";

import { validRange } from "@/lib/export/csv";
import { getExportRows } from "@/lib/export/queries";

export type ExportSummary = { ok: true; count: number; total: number } | { ok: false };

/** HIS-05: count + total of what the export will contain, shown before downloading. */
export async function getExportSummary(from: string, to: string, categoryId: string | null): Promise<ExportSummary> {
  const range = validRange(from, to);
  if (!range || (categoryId && !/^[0-9a-f-]{36}$/i.test(categoryId))) return { ok: false };
  try {
    const rows = await getExportRows({ ...range, categoryId });
    return { ok: true, count: rows.length, total: rows.reduce((a, r) => a + r.amount, 0) };
  } catch (e) {
    console.error("export summary failed", e instanceof Error ? e.message : e);
    return { ok: false };
  }
}
