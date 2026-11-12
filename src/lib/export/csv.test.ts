import { describe, expect, it } from "vitest";
import { csvCell, exportFileName, toCsv, validRange } from "./csv";

describe("toCsv", () => {
  it("writes BOM, header and plain-number amounts", () => {
    const csv = toCsv([
      { date: "2026-11-06", time: "19:42", merchant: "Toko Maju, Jaya", category: "Belanja Harian", payment: "Debit", amount: 187400, note: 'kata "promo"', source: "scan" },
    ]);
    expect(csv.startsWith("﻿tanggal,jam,toko,kategori,metode_bayar,jumlah,catatan,sumber\r\n")).toBe(true);
    expect(csv).toContain('2026-11-06,19:42,"Toko Maju, Jaya",Belanja Harian,Debit,187400,"kata ""promo""",scan\r\n');
  });

  it("only has the header when empty", () => {
    expect(toCsv([])).toBe("﻿tanggal,jam,toko,kategori,metode_bayar,jumlah,catatan,sumber\r\n");
  });
});

describe("csvCell", () => {
  it("neutralises formulas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+62")).toBe("'+62");
    expect(csvCell("@x")).toBe("'@x");
    expect(csvCell("Warung")).toBe("Warung");
  });

  it("quotes newlines", () => {
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });
});

describe("exportFileName", () => {
  it("names whole months by month", () => {
    expect(exportFileName("2026-11-01", "2026-11-30")).toBe("kasku_2026-11.csv");
    expect(exportFileName("2026-02-01", "2026-02-28")).toBe("kasku_2026-02.csv");
  });

  it("names other ranges by both dates", () => {
    expect(exportFileName("2026-11-01", "2026-11-06")).toBe("kasku_2026-11-01_2026-11-06.csv");
  });
});

describe("validRange", () => {
  it("accepts ordered ranges up to a year", () => {
    expect(validRange("2026-11-01", "2026-11-01")).toEqual({ from: "2026-11-01", to: "2026-11-01" });
    expect(validRange("2026-11-06", "2026-11-01")).toBeNull();
    expect(validRange("2025-01-01", "2026-11-01")).toBeNull();
    expect(validRange("2026-11-1", "2026-11-02")).toBeNull();
    expect(validRange(null, "2026-11-02")).toBeNull();
  });
});
