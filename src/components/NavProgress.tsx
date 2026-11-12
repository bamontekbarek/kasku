"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

/**
 * Navigation feedback: a thin yellow bar at the top while the next screen is loading, and the
 * tapped link marked busy (dimmed, not tappable again) so users don't tap repeatedly on a slow
 * connection. Starts on taps on internal links and on `navigate()` (router.push/replace via
 * `useAppRouter`); ends when the URL changes, or after a safety timeout.
 */

const EVENT = "kasku:navigate";
const SHOW_DELAY = 80; // ms; fast navigations don't flash the bar
const SAFETY = 15_000;

/** Start the indicator for a programmatic navigation. */
export function startNavigation() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

function isInternalNav(a: HTMLAnchorElement, e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (a.target && a.target !== "_self") return false;
  if (a.hasAttribute("download")) return false;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  // Same page (only the hash differs) → no server round trip.
  return url.pathname + url.search !== location.pathname + location.search;
}

function Bar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const busyEl = useRef<HTMLElement | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const release = useCallback(() => {
    busyEl.current?.removeAttribute("aria-busy");
    busyEl.current = null;
  }, []);

  const start = useCallback(() => {
    clearTimers();
    timers.current.push(window.setTimeout(() => setState("loading"), SHOW_DELAY));
    timers.current.push(
      window.setTimeout(() => {
        release();
        setState("idle");
      }, SAFETY),
    );
  }, [release]);

  // URL changed → the new screen is rendered (also covers back/forward).
  useEffect(() => {
    clearTimers();
    release();
    setState((s) => (s === "loading" ? "done" : "idle"));
    timers.current.push(window.setTimeout(() => setState("idle"), 450));
  }, [pathname, search, release]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !isInternalNav(a, e)) return;
      release();
      a.setAttribute("aria-busy", "true");
      busyEl.current = a;
      start();
    };
    window.addEventListener(EVENT, start);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener(EVENT, start);
      document.removeEventListener("click", onClick);
      clearTimers();
    };
  }, [start, release]);

  if (state === "idle") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto h-[3px] max-w-[430px]" role="progressbar" aria-hidden="true">
      <div className="nav-progress h-full bg-accent shadow-[0_0_8px_var(--color-accent)]" data-done={state === "done"} />
    </div>
  );
}

export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}

/** `useRouter` that also shows the navigation indicator for push/replace/back. */
export function useAppRouter() {
  const router = useRouter();
  const ref = useRef(router);
  ref.current = router;
  const [api] = useState(() => ({
    push: (href: string, options?: Parameters<typeof router.push>[1]) => {
      if (href !== location.pathname + location.search) startNavigation();
      ref.current.push(href, options);
    },
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => {
      if (href !== location.pathname + location.search) startNavigation();
      ref.current.replace(href, options);
    },
    back: () => {
      startNavigation();
      ref.current.back();
    },
    refresh: () => ref.current.refresh(),
    prefetch: (href: string) => ref.current.prefetch(href),
  }));
  return api;
}
