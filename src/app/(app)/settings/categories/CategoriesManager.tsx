"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { createCategory, deleteCategory, updateCategory, type CategoryResult } from "@/app/actions/categories";
import { FieldError, FormAlert } from "@/components/form";
import { Icon } from "@/components/Icon";
import { Sheet, SheetHeader } from "@/components/Sheet";
import { Badge, Button, ChevronRight, Dot, TopBar, labelClass, Spinner } from "@/components/ui";
import { CATEGORY_COLORS } from "@/lib/expenses/constants";
import type { CategoryTotal } from "@/lib/expenses/queries";
import { categorySchema } from "@/lib/expenses/schema";
import { cx } from "@/lib/format";

type Editing = { id: string | null; name: string; color: string };

/** CAT-01 – CAT-04: list, add, rename/recolour, delete (transactions move to the system category). */
export function CategoriesManager({ categories }: { categories: CategoryTotal[] }) {
  const t = useTranslations("categories");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const current = editing?.id ? categories.find((c) => c.id === editing.id) : undefined;
  const other = categories.find((c) => c.isSystem);
  const check = editing ? categorySchema.safeParse({ name: editing.name, color: editing.color }) : null;
  const nameError = editing && editing.name.length > 0 && !check?.success ? check?.error.issues.find((i) => i.path[0] === "name")?.message : undefined;

  const open = (next: Editing) => {
    setFailure(null);
    setConfirmDelete(false);
    setEditing(next);
  };
  const close = () => setEditing(null);

  const finish = (result: CategoryResult) => {
    setBusy(false);
    if (result.ok) return close();
    setFailure(result.error === "duplicate" ? t("duplicate") : result.error === "locked" ? t("locked") : tc("genericError"));
  };

  const save = async () => {
    if (!editing || !check?.success) return;
    setBusy(true);
    setFailure(null);
    finish(editing.id ? await updateCategory(editing.id, check.data) : await createCategory(check.data));
  };

  const remove = async () => {
    if (!current || current.isSystem) return;
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy(true);
    setFailure(null);
    finish(await deleteCategory(current.id));
  };

  const openNew = () => open({ id: null, name: "", color: "#4C8DF6" });

  return (
    <div className="pt-safe min-h-dvh bg-bg pb-10">
      <TopBar
        title={t("title")}
        back="/settings"
        right={
          <button type="button" onClick={openNew} aria-label={t("add")} className="flex size-11 items-center justify-center border-0 bg-transparent text-accent">
            <Icon name="plus" size={24} strokeWidth={2} />
          </button>
        }
      />

      <div className="flex flex-col gap-3.5 px-4 pt-3">
        <p className="m-0 text-sm leading-5 text-muted">{t("intro")}</p>

        <ul className="m-0 list-none rounded-[14px] bg-card px-3.5 py-0">
          {categories.map((c, i) => (
            <li key={c.id} className={i < categories.length - 1 ? "border-b border-surface" : undefined}>
              <button
                type="button"
                onClick={() => open({ id: c.id, name: c.name, color: c.color })}
                className="flex min-h-16 w-full items-center gap-3 border-0 bg-transparent p-0 text-left text-fg"
              >
                <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-surface">
                  <Dot color={c.color} size={12} radius={4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[15px] font-medium">
                    {c.name}
                    {c.isSystem && (
                      <Badge tone="neutral" size="xs">
                        {t("system")}
                      </Badge>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted">{t("monthCount", { count: c.count })}</span>
                </span>
                <ChevronRight />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={openNew}
          className="flex h-[50px] items-center justify-center gap-2 rounded-[10px] border border-dashed border-edge bg-transparent text-[15px] font-semibold text-fg"
        >
          <Icon name="plus" size={18} strokeWidth={2.2} className="text-accent" />
          {t("add")}
        </button>
      </div>

      {editing && (
        <Sheet labelledBy="sheet-h" onClose={close}>
          <SheetHeader id="sheet-h" title={editing.id ? t("editTitle") : t("newTitle")} onClose={close} />

          <div className="flex items-center gap-3 rounded-xl bg-bg p-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-surface">
              <Dot color={editing.color} size={14} radius={4} />
            </span>
            <span className="text-[15px] font-medium">{editing.name || t("preview")}</span>
          </div>

          {failure && <FormAlert>{failure}</FormAlert>}

          <div className="flex flex-col gap-2">
            <label htmlFor="cat-name" className={labelClass}>
              {t("name")}
            </label>
            <input
              id="cat-name"
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder={t("namePlaceholder")}
              maxLength={24}
              disabled={current?.isSystem}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={current?.isSystem ? "cat-name-note" : nameError ? "cat-name-error" : undefined}
              className="box-border h-[50px] rounded-[10px] border border-raised bg-bg px-3.5 text-base text-fg outline-none placeholder:text-muted focus:border-accent disabled:text-muted"
            />
            {current?.isSystem && (
              <span id="cat-name-note" className="text-[13px] text-muted">
                {t("systemNote")}
              </span>
            )}
            <FieldError id="cat-name-error" message={nameError} />
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2.5 p-0 text-sm font-medium text-fg-2">{t("color")}</legend>
            <div className="grid grid-cols-8 gap-2">
              {CATEGORY_COLORS.map(({ hex, key }) => {
                const on = editing.color === hex;
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setEditing({ ...editing, color: hex })}
                    aria-label={t(`colors.${key}`)}
                    aria-pressed={on}
                    className={cx("h-11 rounded-[10px] border-2", on ? "border-fg" : "border-transparent")}
                    style={{ background: hex }}
                  />
                );
              })}
            </div>
          </fieldset>

          {current && !current.isSystem && (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                aria-busy={(busy && confirmDelete) || undefined}
                className={cx("flex h-11 items-center justify-center gap-2 rounded-[10px] border-0 text-[15px] font-semibold", confirmDelete ? "bg-danger text-accent-ink" : "bg-danger-soft text-danger")}
              >
                {busy && confirmDelete && <Spinner />}
                {confirmDelete ? t("deleteConfirm") : t("delete")}
              </button>
              <span className="text-center text-xs text-muted" role={confirmDelete ? "status" : undefined}>
                {t("deleteHint", { count: current.count, other: other?.name ?? "" })}
              </span>
            </div>
          )}

          <Button onClick={save} loading={busy && !confirmDelete} disabled={!check?.success || busy}>
            {busy ? tc("saving") : editing.id ? t("save") : t("add")}
          </Button>
        </Sheet>
      )}
    </div>
  );
}
