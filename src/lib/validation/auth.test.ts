import { describe, expect, it } from "vitest";
import { changePasswordSchema, checkPassword, loginSchema, passwordScore, registerSchema } from "./auth";

describe("checkPassword (AUTH-02)", () => {
  it("flags each rule independently", () => {
    expect(checkPassword("abc")).toEqual({ length: false, mixedCase: false, digit: false });
    expect(checkPassword("abcdefgh")).toEqual({ length: true, mixedCase: false, digit: false });
    expect(checkPassword("Abcdefg1")).toEqual({ length: true, mixedCase: true, digit: true });
  });

  it("scores 0–4", () => {
    expect(passwordScore("")).toBe(0);
    expect(passwordScore("Abcdefg1")).toBe(3);
    expect(passwordScore("Abcdefghijk1")).toBe(4);
    expect(passwordScore("abcdefghijklmn")).toBe(1);
  });
});

describe("registerSchema (AUTH-01)", () => {
  const valid = { fullName: "Budi", email: "budi@email.com", password: "Rahasia123", confirm: "Rahasia123", agree: true };

  it("accepts a valid form", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("requires matching passwords and consent", () => {
    const r = registerSchema.safeParse({ ...valid, confirm: "Rahasia124", agree: false });
    expect(r.success).toBe(false);
    const messages = r.error!.issues.map((i) => `${i.path.join(".")}:${i.message}`);
    expect(messages).toContain("confirm:passwordMismatch");
    expect(messages).toContain("agree:agreeRequired");
  });

  it("rejects weak passwords and bad emails", () => {
    const r = registerSchema.safeParse({ ...valid, email: "budi", password: "rahasia", confirm: "rahasia" });
    const messages = r.error!.issues.map((i) => i.message);
    expect(messages).toContain("emailInvalid");
    expect(messages).toContain("passwordRules");
  });
});

describe("loginSchema (AUTH-04)", () => {
  it("trims email", () => {
    const r = loginSchema.parse({ email: "  budi@email.com ", password: "x" });
    expect(r.email).toBe("budi@email.com");
  });
});

describe("changePasswordSchema (AUTH-08)", () => {
  it("rejects reusing the current password", () => {
    const r = changePasswordSchema.safeParse({ current: "Rahasia123", password: "Rahasia123", confirm: "Rahasia123" });
    expect(r.error!.issues.map((i) => i.message)).toContain("passwordSameAsOld");
  });
});
