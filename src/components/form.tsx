"use client";

import { useTranslations } from "next-intl";
import { useState, type ComponentProps, type ReactNode } from "react";
import { cx } from "@/lib/format";
import { Icon, type IconName } from "./Icon";
import { labelClass } from "./ui";

/** Shows a Zod validation key (e.g. "passwordMismatch") as translated text. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  const t = useTranslations("validation");
  if (!message) return null;
  const known = t.has(message as Parameters<typeof t>[0]);
  return (
    <span id={id} role="alert" className="text-[13px] text-danger">
      {known ? t(message as Parameters<typeof t>[0]) : message}
    </span>
  );
}

const boxClass =
  "box-border flex h-[52px] items-center gap-2.5 rounded-[10px] border bg-surface focus-within:border-accent";

/** Labelled input with optional leading icon and error text. Works with react-hook-form `register`. */
export function TextField({
  id,
  label,
  icon,
  error,
  trailing,
  className,
  ...input
}: ComponentProps<"input"> & { id: string; label: ReactNode; icon?: IconName; error?: string; trailing?: ReactNode }) {
  const errorId = `${id}-error`;
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className={cx(boxClass, "pl-3.5", trailing ? "pr-1" : "pr-3.5", error ? "border-danger" : "border-raised")}>
        {icon && <Icon name={icon} className="flex-none text-muted" />}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 border-0 bg-transparent text-base text-fg outline-none placeholder:text-muted"
          {...input}
        />
        {trailing}
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

/** Password field with show/hide toggle. */
export function PasswordField({
  defaultVisible = false,
  ...props
}: Omit<ComponentProps<typeof TextField>, "type" | "trailing"> & { defaultVisible?: boolean }) {
  const t = useTranslations("common");
  const [show, setShow] = useState(defaultVisible);
  return (
    <TextField
      {...props}
      type={show ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? t("hidePassword") : t("showPassword")}
          aria-pressed={show}
          className="flex size-11 flex-none items-center justify-center border-0 bg-transparent text-muted"
        >
          <Icon name="eye" />
        </button>
      }
    />
  );
}

/** Red alert box above a form (e.g. wrong email or password). */
export function FormAlert({ children, tone = "danger" }: { children: ReactNode; tone?: "danger" | "success" }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx(
        "flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-sm leading-5",
        tone === "danger" ? "border-danger-line bg-danger-soft" : "border-transparent bg-success-soft",
      )}
    >
      <Icon
        name={tone === "danger" ? "alertCircle" : "check"}
        size={18}
        strokeWidth={2}
        className={cx("mt-px flex-none", tone === "danger" ? "text-danger" : "text-success")}
      />
      <span>{children}</span>
    </div>
  );
}

/** Four-segment strength bar (AUTH-02). */
export function StrengthBar({ score }: { score: number }) {
  const t = useTranslations("password");
  const color = score <= 1 ? "var(--color-danger)" : score <= 3 ? "var(--color-accent)" : "var(--color-success)";
  const label = score === 0 ? "" : score <= 1 ? t("weak") : score <= 3 ? t("fair") : t("strong");
  return (
    <div className="mt-0.5 flex items-center gap-2.5">
      <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1 rounded-sm" style={{ background: i < score ? color : "var(--color-raised)" }} />
        ))}
      </div>
      <span className="w-[52px] text-right text-[13px] font-semibold" style={{ color }} aria-live="polite">
        {label}
      </span>
    </div>
  );
}
