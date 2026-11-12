"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { pillClass } from "@/components/ui";
import { cx } from "@/lib/format";

/** Month picker pill: a native <select> laid over the pill, navigating to `${path}?month=…`. */
export function MonthPill({ path, month, months, label }: { path: string; month: string; months: Array<{ value: string; label: string }>; label: string }) {
  const router = useRouter();
  return (
    <label className={cx(pillClass, "relative")}>
      <Icon name="calendar" size={16} className="text-muted" />
      {months.find((m) => m.value === month)?.label ?? month}
      <Icon name="chevronDown" size={14} strokeWidth={2} className="text-muted" />
      <select
        aria-label={label}
        value={month}
        onChange={(e) => router.push(`${path}?month=${e.target.value}`)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  );
}
