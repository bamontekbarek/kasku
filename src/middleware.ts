import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets, the service worker, manifest and icons.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icon.svg|pwa-icon|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
