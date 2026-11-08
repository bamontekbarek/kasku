"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Bottom sheet over a dimmed backdrop. `onClose` closes in place;
 * `closeHref` turns the backdrop into a link (for route-based sheets).
 */
export function Sheet({
  labelledBy,
  onClose,
  closeHref,
  children,
  gap = "gap-[18px]",
}: {
  labelledBy: string;
  onClose?: () => void;
  closeHref?: string;
  children: ReactNode;
  gap?: string;
}) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 mx-auto max-w-[430px]">
      {closeHref ? (
        <Link href={closeHref} aria-label="Tutup" className="absolute inset-0 bg-black/65" />
      ) : (
        <div onClick={onClose} className="absolute inset-0 bg-black/60" aria-hidden="true" />
      )}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`pb-safe absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-y-auto rounded-t-[20px] bg-surface px-4 pt-2.5 ${gap}`}
      >
        <div className="h-1 w-10 flex-none self-center rounded-sm bg-edge" aria-hidden="true" />
        {children}
      </section>
    </div>
  );
}

export function SheetHeader({ id, title, onClose, closeHref }: { id: string; title: string; onClose?: () => void; closeHref?: string }) {
  const cls = "-mr-2.5 flex size-11 items-center justify-center border-0 bg-transparent text-muted hover:text-fg-2";
  return (
    <div className="flex items-center justify-between">
      <h2 id={id} className="m-0 text-lg font-bold">
        {title}
      </h2>
      {closeHref ? (
        <Link href={closeHref} aria-label="Tutup" className={cls}>
          <Icon name="close" size={22} strokeWidth={2} />
        </Link>
      ) : (
        <button type="button" onClick={onClose} aria-label="Tutup" className={cls}>
          <Icon name="close" size={22} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
