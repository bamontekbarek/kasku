"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useAppRouter } from "@/components/NavProgress";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { deleteExpense, saveExpense } from "@/app/actions/expenses";
import { AmountField } from "@/components/expense-fields";
import { FieldError, FormAlert } from "@/components/form";
import { Icon } from "@/components/Icon";
import { PhotoViewer } from "@/components/PhotoViewer";
import { Button, Field, Footer, ScanBadge, Screen, TopBar, inputClass, selectClass } from "@/components/ui";
import { PAYMENT_METHODS } from "@/lib/expenses/constants";
import type { Category } from "@/lib/expenses/queries";
import { expenseSchema, type ExpenseInput } from "@/lib/expenses/schema";
import { cx, dots, parseAmount, rp } from "@/lib/format";

export type EditableExpense = {
  id: string;
  values: ExpenseInput;
  scanned: boolean;
  photoUrl: string | null;
  /** "6 Nov 2026 · 19:42" */
  recordedAt: string;
};

const itemInput = "box-border h-10 rounded-lg border border-raised bg-bg px-2.5 text-sm text-fg outline-none focus:border-accent";

/** EXP-05: edit or delete one transaction, including its receipt items. */
export function EditExpenseForm({ expense, categories }: { expense: EditableExpense; categories: Category[] }) {
  const t = useTranslations("expense");
  const tc = useTranslations("common");
  const tp = useTranslations("payment");
  const ts = useTranslations("scan.review");
  const router = useAppRouter();
  const hasItems = (expense.values.items?.length ?? 0) > 0;
  const [itemsOpen, setItemsOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseInput>({ resolver: zodResolver(expenseSchema), defaultValues: expense.values });
  const items = useFieldArray({ control, name: "items" });

  const [amount, itemValues] = watch(["amount", "items"]);
  const itemsTotal = (itemValues ?? []).reduce((a, it) => a + (Number(it?.price) || 0), 0);
  const mismatch = hasItems && itemsTotal > 0 && itemsTotal !== amount;

  const fail = (error: string) => setFailure(error === "notFound" ? t("notFound") : tc("genericError"));

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    const result = await saveExpense(expense.id, { ...values, items: hasItems ? values.items : null });
    if (!result.ok) return fail(result.error);
    setLeaving(true);
    router.push("/transactions");
  });

  const onDelete = async () => {
    setDeleting(true);
    const result = await deleteExpense(expense.id);
    if (!result.ok && result.error !== "notFound") {
      setDeleting(false);
      setConfirm(false);
      return fail(result.error);
    }
    router.push("/transactions");
  };

  const name = expense.values.merchant || categories.find((c) => c.id === expense.values.categoryId)?.name || "";

  return (
    <Screen
      header={
        <TopBar
          title={t("editTitle")}
          back="/transactions"
          right={
            <button type="button" onClick={() => setConfirm(true)} aria-label={t("delete")} className="flex size-11 items-center justify-center border-0 bg-transparent text-danger">
              <Icon name="trash" size={22} />
            </button>
          }
        />
      }
      footer={
        <Footer>
          <Button type="submit" form="edit-expense" loading={isSubmitting || leaving} disabled={deleting}>
            {isSubmitting || leaving ? tc("saving") : t("saveChanges")}
          </Button>
        </Footer>
      }
    >
      <form id="edit-expense" onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px] px-4 pt-3 pb-6">
        {expense.scanned && (
          <div className="flex items-center gap-3 rounded-[14px] bg-surface p-3">
            {expense.photoUrl ? (
              <button type="button" onClick={() => setPhoto(true)} aria-label={ts("viewPhoto")} className="h-[68px] w-12 flex-none overflow-hidden rounded-lg border-0 bg-bg p-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- signed Storage URL */}
                <img src={expense.photoUrl} alt="" className="size-full object-cover object-top" />
              </button>
            ) : (
              <span className="flex size-11 flex-none items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <Icon name="receipt" size={22} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <ScanBadge />
                {t("fromReceipt")}
              </div>
              <div className="mt-0.5 text-[13px] text-muted">{expense.recordedAt}</div>
              {expense.photoUrl && (
                <button type="button" onClick={() => setPhoto(true)} className="mt-0.5 border-0 bg-transparent p-0 text-[13px] font-semibold text-accent">
                  {ts("viewPhoto")}
                </button>
              )}
            </div>
          </div>
        )}

        {failure && <FormAlert>{failure}</FormAlert>}

        <AmountField control={control} name="amount" id="e-amt" label={t("amount")} />

        <Field label={t("merchant")} htmlFor="e-merchant">
          <input id="e-merchant" type="text" maxLength={80} placeholder={t("merchantPlaceholder")} className={inputClass} {...register("merchant")} />
          <FieldError id="e-merchant-error" message={errors.merchant?.message} />
        </Field>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t("date")} htmlFor="e-date">
            <input id="e-date" type="date" className={selectClass} {...register("date")} />
            <FieldError id="e-date-error" message={errors.date?.message} />
          </Field>
          <Field label={t("time")} htmlFor="e-time">
            <input id="e-time" type="time" className={selectClass} {...register("time")} />
            <FieldError id="e-time-error" message={errors.time?.message} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t("category")} htmlFor="e-cat">
            <select id="e-cat" className={selectClass} {...register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("paymentShort")} htmlFor="e-pay">
            <select id="e-pay" className={selectClass} {...register("paymentMethod")}>
              {PAYMENT_METHODS.map((p) => (
                <option key={p} value={p}>
                  {tp(p)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {hasItems && (
          <section className="rounded-[14px] bg-surface px-3">
            <button
              type="button"
              onClick={() => setItemsOpen(!itemsOpen)}
              aria-expanded={itemsOpen}
              aria-controls="items-panel"
              className="flex h-12 w-full items-center justify-between border-0 bg-transparent p-0 text-[15px] font-semibold text-fg"
            >
              <span>
                {t("items")} <span className="font-normal text-muted">({items.fields.length})</span>
              </span>
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
                {itemsOpen ? tc("close") : itemsTotal ? t("itemsTotal", { amount: rp(itemsTotal) }) : t("showItems")}
                <Icon name={itemsOpen ? "chevronUp" : "chevronDown"} size={16} strokeWidth={2} />
              </span>
            </button>
            {itemsOpen && (
              <div id="items-panel" className="flex flex-col pb-3">
                {items.fields.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-1.5 border-t border-raised py-2">
                    <input
                      type="text"
                      maxLength={80}
                      aria-label={t("itemName", { n: i + 1 })}
                      aria-invalid={errors.items?.[i]?.name ? true : undefined}
                      className={cx(itemInput, "min-w-0 flex-1", errors.items?.[i]?.name && "border-danger")}
                      {...register(`items.${i}.name` as const)}
                    />
                    <Controller
                      control={control}
                      name={`items.${i}.price` as const}
                      render={({ field }) => (
                        <input
                          type="text"
                          inputMode="numeric"
                          aria-label={t("itemPrice", { n: i + 1 })}
                          value={field.value ? dots(field.value) : ""}
                          onChange={(e) => field.onChange(parseAmount(e.target.value))}
                          onBlur={field.onBlur}
                          className={cx(itemInput, "w-[100px] text-right tabular-nums")}
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => items.remove(i)}
                      aria-label={t("removeItem", { n: i + 1 })}
                      className="flex size-10 flex-none items-center justify-center border-0 bg-transparent text-muted"
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => items.append({ name: "", price: 0 })}
                  className="mt-1 flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-edge bg-transparent text-sm font-semibold text-fg"
                >
                  <Icon name="plus" size={16} strokeWidth={2.2} className="text-accent" />
                  {t("addItem")}
                </button>
                {mismatch && (
                  <div role="status" className="mt-2 flex flex-col gap-2 rounded-lg bg-warn-soft px-3 py-2.5 text-[13px] text-fg">
                    {t("itemsMismatch", { items: rp(itemsTotal), amount: rp(amount || 0) })}
                    <button
                      type="button"
                      onClick={() => setValue("amount", itemsTotal, { shouldValidate: true, shouldDirty: true })}
                      className="self-start border-0 bg-transparent p-0 text-[13px] font-semibold text-accent"
                    >
                      {t("useItemsTotal")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <Field label={<>{t("note")} <span className="font-normal text-muted">{tc("optional")}</span></>} htmlFor="e-note">
          <textarea id="e-note" rows={2} maxLength={500} placeholder={t("notePlaceholder")} className={cx(inputClass, "h-auto resize-none py-3")} {...register("note")} />
          <FieldError id="e-note-error" message={errors.note?.message} />
        </Field>
      </form>

      {photo && expense.photoUrl && <PhotoViewer src={expense.photoUrl} onClose={() => setPhoto(false)} />}

      {confirm && (
        <div className="fixed inset-0 z-30 mx-auto max-w-[430px]">
          <div onClick={() => setConfirm(false)} className="absolute inset-0 bg-black/65" aria-hidden="true" />
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="del-h"
            aria-describedby="del-p"
            className="absolute top-1/2 right-6 left-6 flex -translate-y-1/2 flex-col gap-3 rounded-2xl bg-surface p-5"
          >
            <h2 id="del-h" className="m-0 text-lg font-bold">
              {t("deleteTitle")}
            </h2>
            <p id="del-p" className="m-0 text-sm leading-5 text-fg-2">
              {t.rich(expense.photoUrl ? "deleteBodyPhoto" : hasItems ? "deleteBodyItems" : "deleteBody", {
                name,
                amount: rp(expense.values.amount),
                b: (c) => <span className="font-semibold text-fg">{c}</span>,
              })}
            </p>
            <div className="mt-1 grid grid-cols-2 gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setConfirm(false)} disabled={deleting} autoFocus>
                {tc("cancel")}
              </Button>
              <Button variant="danger" size="sm" onClick={onDelete} loading={deleting}>
                {deleting ? t("deleting") : t("confirmDelete")}
              </Button>
            </div>
          </section>
        </div>
      )}
    </Screen>
  );
}
