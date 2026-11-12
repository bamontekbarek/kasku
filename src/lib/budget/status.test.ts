import { describe, expect, it } from "vitest";
import { budgetLevel, budgetMonths, parseBudgetStatus, safePerDay, unallocated, usedPct } from "./status";

describe("parseBudgetStatus", () => {
  it("maps the RPC json", () => {
    const s = parseBudgetStatus({
      month: "2026-11-01",
      days_left: 18,
      threshold: 90,
      remind: false,
      total: 5000000,
      used: "4286400",
      last_used: 3813000,
      has_any: true,
      categories: [{ id: "a", name: "Makan", color: "#FCD535", is_system: false, limit: null, used: 0, last_used: 1200 }],
    });
    expect(s).toMatchObject({ daysLeft: 18, threshold: 90, remind: false, total: 5000000, used: 4286400, hasAny: true });
    expect(s.categories[0]).toEqual({ id: "a", name: "Makan", color: "#FCD535", isSystem: false, limit: null, used: 0, lastUsed: 1200 });
  });

  it("treats a missing total as no budget", () => {
    const s = parseBudgetStatus({ month: "2026-11-01", total: null, categories: [] });
    expect(s.total).toBeNull();
    expect(s.threshold).toBe(80);
    expect(s.remind).toBe(true);
  });
});

describe("budgetLevel", () => {
  it("follows BUD-04", () => {
    expect(budgetLevel(790, 1000, 80)).toBe("safe");
    expect(budgetLevel(800, 1000, 80)).toBe("near");
    expect(budgetLevel(1000, 1000, 80)).toBe("near");
    expect(budgetLevel(1001, 1000, 80)).toBe("over");
    expect(budgetLevel(850, 1000, 90)).toBe("safe");
  });

  it("floors the percentage", () => {
    expect(usedPct(799, 1000)).toBe(79);
    expect(usedPct(5, 0)).toBe(0);
  });
});

describe("safePerDay", () => {
  it("divides what's left by the days left, rounded down to Rp 100", () => {
    expect(safePerDay(713600, 24)).toBe(29700);
    expect(safePerDay(-5, 10)).toBe(0);
    expect(safePerDay(1000, 0)).toBe(0);
  });
});

describe("unallocated", () => {
  it("reports what is left or over (BUD-02)", () => {
    expect(unallocated(5000, [2000, 3000])).toBe(0);
    expect(unallocated(5000, [2000])).toBe(3000);
    expect(unallocated(5000, [4000, 2000])).toBe(-1000);
  });
});

describe("budgetMonths", () => {
  it("starts at next month and crosses the year boundary", () => {
    const m = budgetMonths("2026-12");
    expect(m[0]).toBe("2027-01");
    expect(m[1]).toBe("2026-12");
    expect(m).toHaveLength(13);
    expect(m.at(-1)).toBe("2026-01");
  });
});
