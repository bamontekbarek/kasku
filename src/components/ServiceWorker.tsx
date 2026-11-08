"use client";

import { useEffect } from "react";

/** Registers /sw.js (PWA-01) in production builds. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* install is optional — the app works without it */
    });
  }, []);
  return null;
}
