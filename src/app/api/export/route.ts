import { getTranslations } from "next-intl/server";
import { exportFileName, toCsv, validRange } from "@/lib/export/csv";
import { getExportRows } from "@/lib/export/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * HIS-04, HIS-05: GET /api/export?from=YYYY-MM-DD&to=YYYY-MM-DD[&category=uuid] → CSV download.
 * Only the signed-in user's rows (RLS). Payment labels follow the current language.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const range = validRange(url.searchParams.get("from"), url.searchParams.get("to"));
  const category = url.searchParams.get("category");
  if (!range || (category && !UUID.test(category))) return new Response("Bad request", { status: 400 });

  try {
    const [rows, tp, ts] = await Promise.all([
      getExportRows({ ...range, categoryId: category }),
      getTranslations("payment"),
      getTranslations("exportSheet"),
    ]);
    const csv = toCsv(
      rows.map((r) => ({
        date: r.date,
        time: r.time,
        merchant: r.merchant,
        category: r.categoryName,
        payment: tp(r.payment),
        amount: r.amount,
        note: r.note,
        source: ts(`source.${r.source}`),
      })),
    );
    const name = exportFileName(range.from, range.to);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("export failed", e instanceof Error ? e.message : e);
    return new Response("Export failed", { status: 500 });
  }
}
