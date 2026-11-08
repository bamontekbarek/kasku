import { describe, expect, it } from "vitest";
import { dots, parseAmount, rp } from "./format";

describe("Rupiah formatting (PWA-04)", () => {
  it("uses dot thousands separators without decimals", () => {
    expect(rp(4286400)).toBe("Rp 4.286.400");
    expect(dots(999)).toBe("999");
    expect(rp(0)).toBe("Rp 0");
  });

  it("parses typed amounts", () => {
    expect(parseAmount("Rp 187.400")).toBe(187400);
    expect(parseAmount("")).toBe(0);
  });
});
