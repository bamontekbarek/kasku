/** Screens that need a signed-in user (the (app) route group). */
const PROTECTED_PREFIXES = ["/dashboard", "/welcome", "/transactions", "/add", "/scan", "/budget", "/notifications", "/settings"];

/** Screens only for signed-out users. Password reset pages stay open to both. */
const GUEST_ONLY = ["/login", "/register"];

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => matches(pathname, p));
}

export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY.some((p) => matches(pathname, p));
}

/**
 * Only allow same-origin relative paths as post-login / email-link destinations
 * (prevents open redirects such as `?next=//evil.com`).
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  try {
    const url = new URL(next, "http://x");
    if (url.origin !== "http://x") return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}

/**
 * Set by /auth/confirm after a password-reset link was verified. /reset-password requires it, so a
 * normal signed-in session cannot set a new password without the old one (AUTH-08 stays the only path).
 */
export const RECOVERY_COOKIE = "kasku_recovery";
export const RECOVERY_COOKIE_MAX_AGE = 15 * 60;
