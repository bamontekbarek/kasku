import { z } from "zod";

/**
 * Validation messages are translation keys under `validation.*` in messages/{id,en}.json,
 * so the same schema serves both languages.
 */

/** AUTH-02 password rules, in display order. */
export const passwordChecks = {
  length: (p: string) => p.length >= 8,
  mixedCase: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p),
  digit: (p: string) => /\d/.test(p),
} as const;

export type PasswordCheck = keyof typeof passwordChecks;

export function checkPassword(p: string): Record<PasswordCheck, boolean> {
  return {
    length: passwordChecks.length(p),
    mixedCase: passwordChecks.mixedCase(p),
    digit: passwordChecks.digit(p),
  };
}

/** 0–4 strength score: one point per rule met, plus one for 12+ characters. */
export function passwordScore(p: string): number {
  if (!p) return 0;
  const met = Object.values(checkPassword(p)).filter(Boolean).length;
  return met + (met === 3 && p.length >= 12 ? 1 : 0);
}

export const emailSchema = z.string().trim().min(1, "emailRequired").pipe(z.email("emailInvalid"));

export const passwordSchema = z
  .string()
  .refine((p) => Object.values(checkPassword(p)).every(Boolean), "passwordRules");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "passwordRequired"),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "nameRequired").max(80, "nameTooLong"),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
    agree: z.boolean().refine((v) => v, "agreeRequired"),
  })
  .refine((v) => v.confirm === v.password, { path: ["confirm"], message: "passwordMismatch" });

export const forgotSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.confirm === v.password, { path: ["confirm"], message: "passwordMismatch" });

export const changePasswordSchema = z
  .object({ current: z.string().min(1, "passwordRequired"), password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password !== v.current, { path: ["password"], message: "passwordSameAsOld" })
  .refine((v) => v.confirm === v.password, { path: ["confirm"], message: "passwordMismatch" });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotInput = z.infer<typeof forgotSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
