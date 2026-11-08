import type { ReactNode } from "react";
import { cx } from "@/lib/format";

/** Full-height auth layout: content on top, footer link pinned to the bottom. */
export function AuthScreen({ children, footer, className }: { children: ReactNode; footer?: ReactNode; className?: string }) {
  return (
    <div className={cx("pt-safe flex min-h-dvh flex-col bg-bg px-6 pb-8", className)}>
      {children}
      <div className="flex-1" />
      {footer}
    </div>
  );
}
