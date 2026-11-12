/** HIS-04: CSV export. Pure helpers so the format is unit-tested. */

export const CSV_HEADER = ["tanggal", "jam", "toko", "kategori", "metode_bayar", "jumlah", "catatan", "sumber"] as const;

export type CsvRow = {
  /** "2026-11-06" (user's time zone) */
  date: string;
  /** "19:42" */
  time: string;
  merchant: string;
  category: string;
  payment: string;
  amount: number;
  note: string;
  source: string;
};

/**
 * Quote when needed, and neutralise spreadsheet formulas (CSV injection): text starting with
 * = + - @ or a tab/CR gets a leading apostrophe, which Excel / Sheets show as plain text.
 */
export function csvCell(value: string): string {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  if (/[",\r\n]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** UTF-8 with BOM (Excel opens Indonesian text correctly), CRLF line endings, amount as a plain number. */
export function toCsv(rows: CsvRow[]): string {
  const lines = [CSV_HEADER.join(",")];
  for (const r of rows) {
    lines.push(
      [csvCell(r.date), csvCell(r.time), csvCell(r.merchant), csvCell(r.category), csvCell(r.payment), String(Math.round(r.amount)), csvCell(r.note), csvCell(r.source)].join(","),
    );
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** "kasku_2026-11.csv" for a whole calendar month, otherwise "kasku_2026-11-01_2026-11-06.csv". */
export function exportFileName(from: string, to: string): string {
  const [y, m] = from.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  if (from.endsWith("-01") && to === `${from.slice(0, 8)}${String(lastDay).padStart(2, "0")}`) return `kasku_${from.slice(0, 7)}.csv`;
  return `kasku_${from}_${to}.csv`;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Validates an inclusive date range ("YYYY-MM-DD"), at most `maxDays` long. */
export function validRange(from: string | null, to: string | null, maxDays = 366): { from: string; to: string } | null {
  if (!from || !to || !DAY.test(from) || !DAY.test(to)) return null;
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  if ((b - a) / 86_400_000 + 1 > maxDays) return null;
  return { from, to };
}
