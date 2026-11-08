import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/format";
import { Icon, type IconName } from "./Icon";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type Variant = "primary" | "secondary" | "surface" | "danger" | "disabled";
type Size = "lg" | "md" | "sm";

const variantClass: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:text-accent-ink",
  secondary: "bg-raised text-fg hover:text-fg",
  surface: "bg-surface text-fg hover:text-fg",
  danger: "bg-danger text-accent-ink hover:text-accent-ink",
  disabled: "bg-raised text-muted",
};

const sizeClass: Record<Size, string> = {
  lg: "h-[52px] text-base",
  md: "h-12 text-[15px]",
  sm: "h-[46px] text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "lg", extra?: string) {
  return cx(
    "flex items-center justify-center gap-2 rounded-[10px] border-0 font-semibold no-underline",
    variantClass[variant],
    sizeClass[size],
    extra,
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant = "primary", size = "lg", className, type = "button", ...rest }: ButtonProps) {
  const v = rest.disabled ? "disabled" : variant;
  return <button type={type} className={buttonClass(v, size, className)} {...rest} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant = "primary", size = "lg", className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/* ------------------------------------------------------------------ */
/* Form fields                                                         */
/* ------------------------------------------------------------------ */

export const labelClass = "text-sm font-medium text-fg-2";

export const inputClass =
  "box-border h-[50px] rounded-[10px] border border-raised bg-surface px-3.5 text-base text-fg outline-none placeholder:text-muted focus:border-accent";

export const selectClass =
  "box-border h-[50px] w-full min-w-0 rounded-[10px] border border-raised bg-surface px-2.5 text-[15px] text-fg outline-none focus:border-accent";

export function Field({ label, htmlFor, children, gap = "gap-2" }: { label: ReactNode; htmlFor: string; children: ReactNode; gap?: string }) {
  return (
    <div className={cx("flex flex-col", gap)}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** Large "Rp 187.400" amount input with underline. */
export function AmountInput({
  id,
  size = 36,
  ...rest
}: ComponentProps<"input"> & { id: string; size?: 34 | 36 }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-raised pt-1.5 pb-2.5">
      <span className="text-[22px] font-semibold text-muted">Rp</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className={cx(
          "min-w-0 flex-1 border-0 bg-transparent font-bold tracking-[-0.5px] text-fg tabular-nums outline-none placeholder:text-muted",
          size === 36 ? "text-4xl" : "text-[34px]",
        )}
        {...rest}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Headers & layout                                                    */
/* ------------------------------------------------------------------ */

export function IconLink({ href, label, icon, size = 24, strokeWidth = 2, className }: { href: string; label: string; icon: IconName; size?: number; strokeWidth?: number; className?: string }) {
  return (
    <Link href={href} aria-label={label} className={cx("flex size-11 items-center justify-center text-fg hover:text-fg", className)}>
      <Icon name={icon} size={size} strokeWidth={strokeWidth} />
    </Link>
  );
}

/** Centered-title bar used by sub-screens: [back] Title [action]. */
export function TopBar({ title, back, right, bordered, as: Tag = "h1" }: { title: string; back?: string; right?: ReactNode; bordered?: boolean; as?: "h1" | "span" }) {
  return (
    <div className={cx("grid h-[52px] grid-cols-[44px_1fr_44px] items-center px-2", bordered && "border-b border-surface")}>
      {back ? <IconLink href={back} label="Kembali" icon="back" /> : <span />}
      <Tag className="m-0 text-center text-[17px] font-semibold">{title}</Tag>
      {right ?? <span />}
    </div>
  );
}

/** Small rounded pill used in tab headers (Export, month picker). */
export const pillClass =
  "flex h-9 items-center gap-1.5 rounded-full border-0 bg-surface px-3 text-sm font-medium text-fg no-underline hover:text-fg";

/** Left-aligned large title used by tab screens. */
export function TabHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex h-14 items-center justify-between px-4">
      <h1 className="m-0 text-[22px] font-bold">{title}</h1>
      {children}
    </header>
  );
}

/**
 * Full-height screen with a fixed header, scrollable body and an optional
 * footer pinned to the bottom (e.g. the primary save button).
 */
export function Screen({ header, footer, children, className }: { header?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx("pt-safe flex h-dvh flex-col overflow-hidden bg-bg", className)}>
      {header}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer}
    </div>
  );
}

export function Footer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("pb-safe border-t border-surface bg-bg px-4 pt-3", className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

type Tone = "accent" | "success" | "danger" | "warn" | "neutral";

const toneClass: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  warn: "bg-warn-soft text-warn",
  neutral: "bg-raised text-fg-2",
};

export function Badge({ tone = "accent", children, size = "md", className }: { tone?: Tone; children: ReactNode; size?: "xs" | "sm" | "md"; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex flex-none items-center font-semibold",
        size === "xs" && "h-[18px] rounded px-1.5 text-[11px]",
        size === "sm" && "h-[22px] rounded-md px-2 text-xs",
        size === "md" && "h-6 rounded-md px-2 text-xs",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ScanBadge() {
  return <Badge size="xs">Scan</Badge>;
}

export function SectionLabel({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="m-0 mb-2 text-[13px] font-semibold tracking-[0.3px] text-muted">
      {children}
    </h2>
  );
}

export function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cx("flex h-7 w-12 flex-none rounded-full border-0 p-[3px] transition-colors", on ? "justify-end bg-accent" : "justify-start bg-edge")}
    >
      <span className="block size-[22px] rounded-full bg-white" />
    </button>
  );
}

/** Segmented control (pill group). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  itemClass = "h-[38px] rounded-lg text-[13px]",
  activeClass = "bg-raised text-fg font-semibold",
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  label?: string;
  className?: string;
  itemClass?: string;
  activeClass?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cx("grid gap-1 rounded-[10px] p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cx("border-0 font-[inherit]", itemClass, on ? activeClass : "bg-transparent font-medium text-muted")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Horizontal scrolling filter pills (history, notifications). */
export function FilterPills({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {options.map((l) => {
        const on = l === value;
        return (
          <button
            key={l}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(l)}
            className={cx("h-[34px] flex-none rounded-lg border-0 px-3.5 text-sm", on ? "bg-raised font-semibold text-fg" : "bg-transparent font-medium text-muted")}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({ pct, color = "var(--color-accent)", height = 8 }: { pct: number; color?: string; height?: number }) {
  return (
    <div className="overflow-hidden bg-raised" style={{ height, borderRadius: height / 2 }} aria-hidden="true">
      <div className="h-full" style={{ width: `${Math.min(pct, 100)}%`, background: color, borderRadius: height / 2 }} />
    </div>
  );
}

export function Notice({ tone, icon, children, role = "status", className }: { tone: "danger" | "warn" | "success" | "accent"; icon?: IconName; children: ReactNode; role?: "status" | "alert"; className?: string }) {
  const tones = {
    danger: "bg-danger-soft border border-danger-line text-danger",
    warn: "bg-warn-soft border border-warn-line text-warn",
    success: "bg-success-soft text-success",
    accent: "bg-accent-soft text-accent",
  } as const;
  return (
    <div role={role} className={cx("flex items-start gap-2.5 rounded-xl px-3.5 py-3", tones[tone], className)}>
      {icon && <Icon name={icon} size={20} strokeWidth={2} className="mt-px flex-none" />}
      <div className="text-sm leading-5 text-fg">{children}</div>
    </div>
  );
}

/** Numbered step list on a surface card. */
export function StepList({ steps, className }: { steps: ReactNode[]; className?: string }) {
  return (
    <ol className={cx("m-0 flex list-none flex-col rounded-[14px] bg-surface px-3.5 py-1", className)}>
      {steps.map((s, i) => (
        <li key={i} className={cx("flex items-start gap-3 py-2.5", i < steps.length - 1 && "border-b border-raised")}>
          <StepNumber n={i + 1} />
          <span className="text-sm leading-[22px]">{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex size-6 flex-none items-center justify-center rounded-full bg-accent text-[13px] font-bold text-accent-ink">{n}</span>
  );
}

/** Round icon tile used on empty / result states. */
export function StateIcon({ icon, bg, fg, size = 88, iconSize = 40, strokeWidth = 1.8 }: { icon: IconName; bg: string; fg: string; size?: number; iconSize?: number; strokeWidth?: number }) {
  return (
    <span className="flex items-center justify-center rounded-full" style={{ width: size, height: size, background: bg, color: fg }}>
      <Icon name={icon} size={iconSize} strokeWidth={strokeWidth} />
    </span>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-[10px] bg-accent text-accent-ink">
        <Icon name="receipt" size={20} strokeWidth={2} />
      </div>
      <span className="text-xl font-bold tracking-[-0.2px]">Kasku</span>
    </div>
  );
}

export function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-raised font-bold text-accent"
      style={{ width: size, height: size, fontSize: size > 40 ? 18 : 14 }}
    >
      {initials}
    </div>
  );
}

/** Color dot / square used for categories. */
export function Dot({ color, size = 10, radius = 3 }: { color: string; size?: number; radius?: number }) {
  return <span className="flex-none" style={{ width: size, height: size, borderRadius: radius, background: color }} />;
}

export function ChevronRight() {
  return <Icon name="chevronRight" size={18} strokeWidth={2} className="flex-none text-muted" />;
}
