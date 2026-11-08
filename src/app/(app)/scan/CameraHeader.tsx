import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

/** Header for the black camera-style screens: round close button, title, round action. */
export function CameraHeader({ title, closeHref, closeLabel, action }: { title: string; closeHref: string; closeLabel: string; action: ReactNode }) {
  return (
    <div className="grid h-[52px] grid-cols-[44px_1fr_44px] items-center px-3">
      <Link href={closeHref} aria-label={closeLabel} className="flex size-11 items-center justify-center rounded-full bg-surface text-fg hover:text-fg">
        <Icon name="close" size={22} strokeWidth={2} />
      </Link>
      <h1 className="m-0 text-center text-[17px] font-semibold">{title}</h1>
      {action}
    </div>
  );
}

export const roundAction = "flex size-11 items-center justify-center rounded-full border-0 bg-surface";
