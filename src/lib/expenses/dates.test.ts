import { describe, expect, it } from "vitest";
import { daysBetween, localParts, monthBounds, parseMonth, recentMonths, spentAtFor, todayIn, zonedToIso } from "./dates";

const WIT = "Asia/Jayapura";

describe("time zone helpers (WIT = UTC+9)", () => {
  it("converts local wall-clock time to UTC", () => {
    expect(zonedToIso("2026-11-06", "19:42", WIT)).toBe("2026-11-06T10:42:00.000Z");
    expect(zonedToIso("2026-11-06", "03:00", WIT)).toBe("2026-11-05T18:00:00.000Z");
  });

  it("reads local date and time back", () => {
    expect(localParts("2026-11-05T18:00:00.000Z", WIT)).toEqual({ date: "2026-11-06", time: "03:00" });
  });

  it("uses the user's calendar day, not the server's (UTC)", () => {
    // 16:30 UTC on the 5th is already 01:30 on the 6th in Papua.
    expect(todayIn(WIT, new Date("2026-11-05T16:30:00Z"))).toBe("2026-11-06");
  });

  it("handles a zone with DST", () => {
    expect(zonedToIso("2026-07-01", "12:00", "Europe/Amsterdam")).toBe("2026-07-01T10:00:00.000Z");
    expect(zonedToIso("2026-01-01", "12:00", "Europe/Amsterdam")).toBe("2026-01-01T11:00:00.000Z");
  });

  it("manual add without time: today = now, other day = same time of day", () => {
    const now = new Date("2026-11-06T10:42:00.000Z"); // 19:42 WIT
    expect(spentAtFor("2026-11-06", "", WIT, now)).toBe(now.toISOString());
    expect(spentAtFor("2026-11-04", "", WIT, now)).toBe("2026-11-04T10:42:00.000Z");
    expect(spentAtFor("2026-11-04", "08:00", WIT, now)).toBe("2026-11-03T23:00:00.000Z");
  });

  it("computes month bounds in local time", () => {
    expect(monthBounds("2026-12", WIT)).toEqual({ from: "2026-11-30T15:00:00.000Z", to: "2026-12-31T15:00:00.000Z" });
  });

  it("parses and lists months", () => {
    expect(parseMonth("2026-11")).toBe("2026-11");
    expect(parseMonth("2026-13")).toBeNull();
    expect(parseMonth(undefined)).toBeNull();
    expect(recentMonths("2026-02", 3)).toEqual(["2026-02", "2026-01", "2025-12"]);
    expect(daysBetween("2026-11-04", "2026-11-06")).toBe(2);
  });
});
