import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath, isGuestOnlyPath } from "@/lib/auth/routes";
import { supabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase session cookie on every request and guards routes:
 * signed-out users are sent to /login, signed-in users skip the login/register screens.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = supabasePublicEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Do not run code between createServerClient and getUser(): it validates and refreshes the token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const target = request.nextUrl.clone();
    target.pathname = path;
    target.search = "";
    for (const [k, v] of Object.entries(params ?? {})) target.searchParams.set(k, v);
    const res = NextResponse.redirect(target);
    // Keep refreshed auth cookies on the redirect.
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user && isProtectedPath(pathname)) {
    return redirectTo("/login", { next: pathname + search });
  }
  if (user && isGuestOnlyPath(pathname)) {
    return redirectTo("/dashboard");
  }
  return response;
}
