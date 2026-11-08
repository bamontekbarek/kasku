import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { syncLocaleFromProfile } from "@/app/actions/locale";
import { RECOVERY_COOKIE, RECOVERY_COOKIE_MAX_AGE, safeNextPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["email", "signup", "recovery", "email_change", "invite", "magiclink"];

/**
 * Target of the links in the verification (AUTH-03) and password-reset (AUTH-07) emails.
 * Verifies the one-time token, which signs the user in, then continues to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const rawType = searchParams.get("type");
  const type = OTP_TYPES.includes(rawType as EmailOtpType) ? (rawType as EmailOtpType) : null;
  const next = safeNextPath(searchParams.get("next"), type === "recovery" ? "/reset-password" : "/dashboard");

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  } else if (code) {
    // PKCE fallback when the default Supabase template ({{ .ConfirmationURL }}) is still in use.
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  const target = request.nextUrl.clone();
  target.search = "";
  if (ok) {
    await syncLocaleFromProfile();
    const [path, query] = next.split("?");
    target.pathname = path;
    if (query) target.search = `?${query}`;
  } else if (type === "recovery" || next.startsWith("/reset-password")) {
    target.pathname = "/reset-password";
    target.searchParams.set("expired", "1");
  } else {
    target.pathname = "/login";
    target.searchParams.set("verify", "failed");
  }
  const response = NextResponse.redirect(target);
  if (ok && type === "recovery") {
    response.cookies.set(RECOVERY_COOKIE, "1", {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/reset-password",
      maxAge: RECOVERY_COOKIE_MAX_AGE,
    });
  }
  return response;
}
