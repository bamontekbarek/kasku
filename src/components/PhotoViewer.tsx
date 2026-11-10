"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Icon } from "./Icon";

const MAX_SCALE = 5;

/** REV-06: full-screen receipt photo with pinch-zoom, drag to pan and double-tap to zoom. */
export function PhotoViewer({ src, onClose }: { src: string; onClose: () => void }) {
  const t = useTranslations("scan.review");
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const lastTap = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const down = (e: PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) pinch.current = { dist: distance(), scale: view.scale };
    if (pointers.current.size === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) setView((v) => (v.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 }));
      lastTap.current = now;
    }
  };

  const move = (e: PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const scale = Math.min(MAX_SCALE, Math.max(1, (pinch.current.scale * distance()) / pinch.current.dist));
      setView((v) => (scale === 1 ? { scale, x: 0, y: 0 } : { ...v, scale }));
    } else if (pointers.current.size === 1) {
      setView((v) => (v.scale > 1 ? { ...v, x: v.x + e.clientX - prev.x, y: v.y + e.clientY - prev.y } : v));
    }
  };

  const up = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={t("photoTitle")} className="fixed inset-0 z-30 mx-auto box-border flex max-w-[430px] flex-col bg-black/95 pt-14">
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t("closePhoto")}
        className="absolute top-[max(env(safe-area-inset-top),12px)] right-3 z-10 flex size-11 items-center justify-center rounded-full border-0 bg-surface text-fg"
      >
        <Icon name="close" size={22} strokeWidth={2} />
      </button>
      <div className="flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {/* eslint-disable-next-line @next/next/no-img-element -- signed Storage URL, not optimisable */}
        <img
          src={src}
          alt={t("photoTitle")}
          draggable={false}
          className="max-h-full max-w-full select-none"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transition: pinch.current ? "none" : "transform 120ms" }}
        />
      </div>
      <p className="pb-safe m-0 py-4 text-center text-[13px] text-fg-2">{t("pinch")}</p>
    </div>
  );
}
