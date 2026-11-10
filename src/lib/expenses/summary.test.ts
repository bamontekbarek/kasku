import { describe, expect, it } from "vitest";
import { deltaPct, formatPct, monthTitle, parseSummary, seriesLabel, shortAmount, weekdayDate } from "./summary";

describe("dashboard summary helpers", () => {
  it("parses the RPC payload", () => {
    const s = parseSummary({ start: "2026-11-01", total: 10, count: 2, max: 7, prev_total: 5, series: [{ start: "2026-10-01", total: 5 }] }, "month");
    expect(s.prevTotal).toBe(5);
    expect(s.series).toHaveLength(1);
    expect(parseSummary(null, "day").series).toEqual([]);
  });

  it("computes deltas (DASH-02)", () => {
    expect(deltaPct(4286400, 3813000)).toBeCloseTo(12.415, 2);
    expect(deltaPct(100, 0)).toBeNull();
    expect(formatPct(12.415, "id")).toBe("12,4%");
    expect(formatPct(-8.2, "en")).toBe("8.2%");
  });

  it("labels chart bars per period", () => {
    expect(seriesLabel("day", "2026-11-06", "id")).toBe("6/11");
    expect(seriesLabel("week", "2026-11-02", "id")).toBe("2 Nov");
    expect(seriesLabel("month", "2026-08-01", "id")).toBe("Agu");
    expect(seriesLabel("month", "2026-08-01", "en")).toBe("Aug");
    expect(seriesLabel("year", "2026-01-01", "en")).toBe("2026");
  });

  it("formats dates in Indonesian and English", () => {
    expect(monthTitle("2026-11-01", "id")).toBe("November 2026");
    expect(monthTitle("2026-11", "en")).toBe("November 2026");
    expect(weekdayDate("2026-11-06", "id")).toBe("Jumat, 6 Nov");
  });

  it("shortens chart amounts", () => {
    expect(shortAmount(1_250_000, "id")).toBe("1,3jt");
    expect(shortAmount(312_900, "id")).toBe("313rb");
    expect(shortAmount(312_900, "en")).toBe("313K");
    expect(shortAmount(0, "id")).toBe("0");
  });
});
