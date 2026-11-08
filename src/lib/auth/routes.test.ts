import { describe, expect, it } from "vitest";
import { isGuestOnlyPath, isProtectedPath, safeNextPath } from "./routes";

describe("route guards", () => {
  it("protects app screens only", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/settings/password")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/terms")).toBe(false);
    expect(isProtectedPath("/addresses")).toBe(false);
  });

  it("keeps signed-in users away from login/register only", () => {
    expect(isGuestOnlyPath("/login")).toBe(true);
    expect(isGuestOnlyPath("/register")).toBe(true);
    expect(isGuestOnlyPath("/reset-password")).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps same-origin paths", () => {
    expect(safeNextPath("/reset-password")).toBe("/reset-password");
    expect(safeNextPath("/transactions?cat=1")).toBe("/transactions?cat=1");
  });

  it("blocks open redirects", () => {
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
  });
});
