import { describe, expect, it } from "vitest";
import { renderNotification, type RenderContext } from "./render";

const messages: Record<string, string> = {
  overTitle: "{name} lewat batas",
  overTotalTitle: "Total anggaran lewat batas",
  overBody: "Terpakai {used} dari batas {limit} bulan ini.",
  nearTitle: "{name} sudah lewat {pct}%",
  nearBody: "Terpakai {used} dari {limit}. Sisa {left}.",
  nearTotalTitle: "Anggaran bulan ini sudah {pct}%",
  nearTotalBody: "Sisa {left} untuk {days} hari, sekitar {perDay} per hari.",
  weeklyTitle: "Ringkasan minggu lalu",
  weeklyBody: "{range}: {total} dari {count} transaksi.",
  monthlyTitle: "Laporan {month} siap",
  monthlyBody: "Total {total} dari {count} transaksi.",
  monthlyTop: "Terbesar: {top}.",
  changeUp: "Naik {pct} dari {prev}.",
  changeDown: "Turun {pct} dari {prev}.",
  changeSame: "Sama dengan {prev}.",
  prevWeek: "minggu sebelumnya",
  prevMonth: "bulan sebelumnya",
};

const ctx: RenderContext = {
  t: (key, values = {}) => (messages[key] ?? key).replace(/\{(\w+)\}/g, (_, k: string) => String(values[k])),
  locale: "id",
  shortDate: (d) => d.slice(5),
  monthTitle: (d) => d.slice(0, 7),
};

describe("renderNotification", () => {
  it("category over budget", () => {
    expect(renderNotification("budget_over", { name: "Makan", used: 1542300, limit: 1500000 }, ctx)).toEqual({
      title: "Makan lewat batas",
      body: "Terpakai Rp 1.542.300 dari batas Rp 1.500.000 bulan ini.",
    });
  });

  it("total nearly used up, with a safe daily amount", () => {
    const r = renderNotification("budget_near", { name: null, used: 4286400, limit: 5000000, pct: 85, days_left: 24, threshold: 80 }, ctx);
    expect(r.title).toBe("Anggaran bulan ini sudah 85%");
    expect(r.body).toBe("Sisa Rp 713.600 untuk 24 hari, sekitar Rp 29.700 per hari.");
  });

  it("category near uses the threshold in the title", () => {
    const r = renderNotification("budget_near", { name: "Transportasi", used: 618400, limit: 700000, pct: 88, threshold: 80 }, ctx);
    expect(r.title).toBe("Transportasi sudah lewat 80%");
    expect(r.body).toBe("Terpakai Rp 618.400 dari Rp 700.000. Sisa Rp 81.600.");
  });

  it("weekly summary with change", () => {
    const r = renderNotification("weekly_summary", { start: "2026-10-26", end: "2026-11-01", total: 1150000, prev_total: 1000000, count: 9 }, ctx);
    expect(r.body).toBe("10-26 – 11-01: Rp 1.150.000 dari 9 transaksi. Naik 15,0% dari minggu sebelumnya.");
  });

  it("monthly report without a previous month", () => {
    const r = renderNotification("monthly_report", { month: "2026-10-01", total: 3813000, prev_total: 0, count: 58, top: "Makan" }, ctx);
    expect(r).toEqual({ title: "Laporan 2026-10 siap", body: "Total Rp 3.813.000 dari 58 transaksi. Terbesar: Makan." });
  });
});
