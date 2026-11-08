import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { initialsOf } = await import("./account");

describe("initialsOf", () => {
  it("uses the first two words", () => {
    expect(initialsOf("Budi Santoso", "b@x.id")).toBe("BS");
    expect(initialsOf("  maria  ", "m@x.id")).toBe("M");
    expect(initialsOf("Yohanes Wenda Kogoya", "y@x.id")).toBe("YW");
  });

  it("falls back to the email", () => {
    expect(initialsOf("", "budi@email.com")).toBe("B");
  });
});
