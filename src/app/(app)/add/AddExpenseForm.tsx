"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useAppRouter } from "@/components/NavProgress";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { saveExpense } from "@/app/actions/expenses";
import { AmountField, CategoryChips, PaymentPicker } from "@/components/expense-fields";
import { FieldError, FormAlert } from "@/components/form";
import { Icon } from "@/components/Icon";
import { Button, ButtonLink, Field, Footer, Screen, TopBar, inputClass } from "@/components/ui";
import type { Category } from "@/lib/expenses/queries";
import { expenseSchema, type ExpenseInput } from "@/lib/expenses/schema";
import { cx } from "@/lib/format";
import { usePickPhoto } from "@/lib/scan/usePickPhoto";

/** EXP-01 – EXP-04: manual entry with the "fill in from a receipt" card on top. */
export function AddExpenseForm({ categories, today, quotaLeft, quotaTotal }: { categories: Category[]; today: string; quotaLeft: number; quotaTotal: number }) {
  const t = useTranslations("expense");
  const tc = useTranslations("common");
  const router = useAppRouter();
  const pick = usePickPhoto();
  const [failure, setFailure] = useState<string | null>(null);
  // Saved and on the way to the Dashboard: keep the button locked until the page changes.
  const [leaving, setLeaving] = useState(false);
  const firstCategory = categories.find((c) => !c.isSystem) ?? categories[0];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      merchant: "",
      date: today,
      time: "",
      categoryId: firstCategory?.id ?? "",
      paymentMethod: "qris",
      note: "",
      items: [],
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    const result = await saveExpense(null, values);
    if (!result.ok) {
      setFailure(tc("genericError"));
      return;
    }
    setLeaving(true);
    router.push("/dashboard");
  });

  return (
    <Screen
      header={<TopBar title={t("addTitle")} back="/dashboard" />}
      footer={
        <Footer>
          <Button type="submit" form="add-expense" loading={isSubmitting || leaving}>
            {isSubmitting || leaving ? tc("saving") : t("save")}
          </Button>
        </Footer>
      }
    >
      <form id="add-expense" onSubmit={onSubmit} noValidate className="flex flex-col gap-5 px-4 pt-3 pb-6">
        <section className="flex flex-col gap-3.5 rounded-[14px] border border-accent-line bg-surface p-4" aria-labelledby="ai-title">
          <div className="flex items-start gap-3">
            <div className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-accent-soft text-accent">
              <Icon name="sparkles" size={22} />
            </div>
            <div>
              <h2 id="ai-title" className="m-0 text-base font-semibold">
                {t("aiTitle")}
              </h2>
              <p className="mt-1 mb-0 text-[13px] leading-[19px] text-muted">{t("aiBody")}</p>
            </div>
          </div>
          {quotaLeft > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <ButtonLink href="/scan" size="sm">
                  <Icon name="camera" strokeWidth={2} />
                  {t("camera")}
                </ButtonLink>
                <label className="flex h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-raised text-[15px] font-semibold text-fg">
                  <Icon name="image" strokeWidth={2} />
                  {t("gallery")}
                  <input type="file" accept="image/*" className="sr-only" onChange={pick} />
                </label>
              </div>
              <p className="m-0 text-center text-xs text-muted tabular-nums">
                {t.rich("quotaLeft", { left: quotaLeft, total: quotaTotal, b: (c) => <span className="font-semibold text-fg">{c}</span> })}
              </p>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <Button disabled size="sm">
                  {t("camera")}
                </Button>
                <Button disabled size="sm">
                  {t("gallery")}
                </Button>
              </div>
              <p role="status" className="m-0 text-[13px] leading-[19px] text-warn">
                {t("quotaOut", { total: quotaTotal })}
              </p>
            </>
          )}
        </section>

        <div className="flex items-center gap-3 text-xs font-medium text-faint" aria-hidden="true">
          <div className="h-px flex-1 bg-raised" />
          {t("orManual")}
          <div className="h-px flex-1 bg-raised" />
        </div>

        {failure && <FormAlert>{failure}</FormAlert>}

        <AmountField control={control} name="amount" id="amt" label={t("amount")} />

        <Field label={t("merchant")} htmlFor="merchant">
          <input id="merchant" type="text" maxLength={80} placeholder={t("merchantPlaceholder")} className={inputClass} {...register("merchant")} />
          <FieldError id="merchant-error" message={errors.merchant?.message} />
        </Field>

        <Field label={t("date")} htmlFor="date">
          <div className="relative">
            <Icon name="calendar" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
            <input id="date" type="date" max={today} className={cx(inputClass, "w-full pl-11")} {...register("date")} />
          </div>
          <FieldError id="date-error" message={errors.date?.message} />
        </Field>

        <Controller
          control={control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <div>
              <CategoryChips categories={categories} value={field.value} onChange={field.onChange} legend={t("category")} />
              <FieldError id="cat-error" message={fieldState.error?.message} />
            </div>
          )}
        />

        <Controller
          control={control}
          name="paymentMethod"
          render={({ field }) => <PaymentPicker value={field.value} onChange={field.onChange} legend={t("payment")} />}
        />

        <Field label={<>{t("note")} <span className="font-normal text-muted">{tc("optional")}</span></>} htmlFor="note">
          <textarea id="note" rows={2} maxLength={500} placeholder={t("notePlaceholder")} className={cx(inputClass, "h-auto resize-none py-3")} {...register("note")} />
          <FieldError id="note-error" message={errors.note?.message} />
        </Field>
      </form>
    </Screen>
  );
}
