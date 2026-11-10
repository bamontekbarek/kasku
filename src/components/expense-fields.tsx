"use client";

import { useTranslations } from "next-intl";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/expenses/constants";
import type { Category } from "@/lib/expenses/queries";
import { cx, dots, parseAmount } from "@/lib/format";
import { FieldError } from "./form";
import { AmountInput, Dot, labelClass } from "./ui";

/** Large Rupiah amount input bound to a react-hook-form number field (EXP-01: whole Rupiah). */
export function AmountField<T extends FieldValues>({ control, name, id, label }: { control: Control<T>; name: Path<T>; id: string; label: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id} className={labelClass}>
            {label}
          </label>
          <AmountInput
            id={id}
            placeholder="0"
            autoComplete="off"
            value={field.value ? dots(field.value) : ""}
            onChange={(e) => field.onChange(e.target.value ? parseAmount(e.target.value) : undefined)}
            onBlur={field.onBlur}
            ref={field.ref}
            aria-invalid={fieldState.error ? true : undefined}
            aria-describedby={fieldState.error ? `${id}-error` : undefined}
          />
          <FieldError id={`${id}-error`} message={fieldState.error?.message} />
        </div>
      )}
    />
  );
}

/** Category chips (EXP-01). */
export function CategoryChips({ categories, value, onChange, legend }: { categories: Category[]; value: string; onChange: (id: string) => void; legend: string }) {
  return (
    <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
      <legend className="mb-2.5 p-0 text-sm font-medium text-fg-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const on = c.id === value;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(c.id)}
              className={cx(
                "flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium",
                on ? "border-accent bg-accent-soft text-accent" : "border-raised bg-surface text-fg-2",
              )}
            >
              <Dot color={c.color} size={8} radius={4} />
              {c.name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Five payment methods as a segmented control (EXP-01). */
export function PaymentPicker({ value, onChange, legend }: { value: PaymentMethod; onChange: (p: PaymentMethod) => void; legend: string }) {
  const t = useTranslations("paymentShort");
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2.5 p-0 text-sm font-medium text-fg-2">{legend}</legend>
      <div className="grid grid-cols-5 gap-1 rounded-[10px] bg-surface p-1">
        {PAYMENT_METHODS.map((p) => {
          const on = p === value;
          return (
            <button
              key={p}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(p)}
              className={cx("h-[38px] rounded-lg border-0 px-0.5 text-[13px]", on ? "bg-raised font-semibold text-fg" : "bg-transparent font-medium text-muted")}
            >
              {t(p)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
