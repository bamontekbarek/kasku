"use client";

import type { AuthError } from "@supabase/supabase-js";

/**
 * Lazily loads supabase-js (~85 KB gzip) only when an auth action runs, keeping it out of the
 * initial JS of the auth screens (JS awal < 200 KB, slow networks in Papua).
 */
export async function getSupabase() {
  const { createClient } = await import("@/lib/supabase/client");
  return createClient();
}

/**
 * Where links in auth emails land: /auth/confirm on the current origin (localhost, preview, production).
 * Supabase must allow it in additional_redirect_urls. `recovery` marks the password-reset flow.
 */
export function emailRedirect(flow: "signup" | "recovery"): string {
  const url = new URL("/auth/confirm", window.location.origin);
  url.searchParams.set("next", flow === "recovery" ? "/reset-password" : "/dashboard");
  if (flow === "recovery") url.searchParams.set("flow", "recovery");
  return url.toString();
}

export type AuthFailure = "invalidCredentials" | "unverified" | "rateLimited" | "generic";

/** Map Supabase auth errors to the few cases the UI distinguishes (AUTH-04: no account enumeration). */
export function classifyAuthError(error: AuthError | null): AuthFailure | null {
  if (!error) return null;
  if (error.code === "email_not_confirmed") return "unverified";
  if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return "rateLimited";
  }
  if (error.code === "invalid_credentials" || error.status === 400) return "invalidCredentials";
  return "generic";
}

export async function resendVerification(email: string): Promise<boolean> {
  const { error } = await (await getSupabase()).auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: emailRedirect("signup") },
  });
  return !error;
}

/** AUTH-05: always resolves "sent" for unknown emails; only network/rate-limit errors return false. */
export async function sendPasswordReset(email: string): Promise<boolean> {
  const { error } = await (await getSupabase()).auth.resetPasswordForEmail(email, { redirectTo: emailRedirect("recovery") });
  return !error;
}
