"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { saveScannedExpense } from "@/app/actions/expenses";
import { FieldError, FormAlert } from "@/components/form";
import { Icon } from "@/components/Icon";
import { PhotoViewer } from "@/components/PhotoViewer";
import { AmountInput, Button, ButtonLink, Footer, Screen, TopBar, labelClass, selectClass } from "@/components/ui";
import type { ScanResult } from "@/lib/ai/receipt";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/expenses/constants";
import type { Category } from "@/lib/expenses/queries";
import { expenseSchema } from "@/lib/expenses/schema";
import { cx, dots, parseAmount, rp } from "@/lib/format";
import { scanStore } from "@/lib/scan/store";

type Key = "amount" | "merchant" | "date" | "time" | "categoryId" | "paymentMethod";
type Values = { amount: number; merchant: string; date: string; time: string; categoryId: string; paymentMethod: PaymentMethod };
type Item = { key: number; name: string; price: number; check: boolean };
type Badge = "ai" | "check" | "edited";

/** Field label with the AI / "Cek lagi" / "Diubah" provenance badge (REV-02). */
function AiLabel({ htmlFor, label, state }: { htmlFor: string; label: string; state: Badge }) {
  const t = useTranslations("scan.review");
  const badge = {
    ai: { text: t("badgeAi"), cls: "bg-accent-soft text-accent" },
    check: { text: t("badgeCheck"), cls: "bg-warn-soft text-warn" },
    edited: { text: t("badgeEdited"), cls: "bg-raised text-fg-2" },
  }[state];
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      <span className={cx("inline-flex h-[22px] items-center rounded-md px-2 text-xs font-semibold", badge.cls)}>{badge.text}</span>
    </div>
  );
}

function Legend({ cls, text, children }: { cls: string; text: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cx("rounded px-1.5 py-px font-semibold", cls)}>{text}</span>
      {children}
    </span>
  );
}

const itemBox = "box-border h-10 rounded-lg border bg-bg text-sm text-fg outline-none focus-within:border-accent";

/** REV-01 – REV-07: check and edit everything the AI read, then save as one expense. */
export function ReviewForm({
  receiptId,
  result,
  photoUrl,
  savedExpenseId,
  categories,
}: {
  receiptId: string;
  result: ScanResult;
  photoUrl: string | null;
  savedExpenseId: string | null;
  categories: Category[];
}) {
  const t = useTranslations("scan.review");
  const te = useTranslations("expense");
  const tp = useTranslations("payment");
  const tc = useTranslations("common");
  const router = useRouter();

  const [v, setV] = useState<Values>({
    amount: result.amount.value,
    merchant: result.merchant.value,
    date: result.date.value,
    time: result.time.value,
    categoryId: result.categoryId.value,
    paymentMethod: result.paymentMethod.value,
  });
  const [edited, setEdited] = useState<Partial<Record<Key, boolean>>>({});
  const [items, setItems] = useState<Item[]>(result.items.map((it, i) => ({ ...it, key: i })));
  const [nextKey, setNextKey] = useState(result.items.length);
  const [keepAmount, setKeepAmount] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<ReactNode>(null);
  const [amountError, setAmountError] = useState<string | undefined>();

  const state = (k: Key): Badge => (edited[k] ? "edited" : result[k].check ? "check" : "ai");
  const mark = <K extends Key>(k: K, value: Values[K]) => {
    setV((cur) => ({ ...cur, [k]: value }));
    setEdited((e) => ({ ...e, [k]: true }));
    if (k === "amount") {
      setKeepAmount(false);
      setAmountError(undefined);
    }
  };
  const setItem = (key: number, patch: Partial<Item>) => setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  const sum = items.reduce((a, it) => a + it.price, 0);
  const fields: Key[] = ["amount", "merchant", "date", "time", "categoryId", "paymentMethod"];
  const checks = fields.filter((k) => state(k) === "check").length + items.filter((it) => it.check).length;
  const mismatch = items.length > 0 && sum !== v.amount && !keepAmount;

  const save = async () => {
    const parsed = expenseSchema.safeParse({
      ...v,
      note: "",
      items: items.filter((it) => it.name.trim()).map((it) => ({ name: it.name.trim(), price: it.price })),
    });
    if (!parsed.success) {
      const amountIssue = parsed.error.issues.find((i) => i.path[0] === "amount");
      setAmountError(amountIssue?.message);
      if (!amountIssue) setFailure(tc("genericError"));
      return;
    }
    setSaving(true);
    setFailure(null);
    const res = await saveScannedExpense(receiptId, parsed.data);
    if (res.ok) {
      scanStore.clear();
      router.push("/dashboard");
      return;
    }
    setSaving(false);
    setFailure(res.error === "alreadySaved" ? t("alreadySaved") : tc("genericError"));
  };

  return (
    <Screen
      header={<TopBar title={t("title")} back="/add" />}
      footer={
        <Footer className="grid grid-cols-[1fr_2fr] gap-2.5">
          <ButtonLink href="/scan" variant="surface" className="text-[15px]" onClick={() => scanStore.clear()}>
            {t("rescan")}
          </ButtonLink>
          <Button onClick={save} disabled={saving || Boolean(savedExpenseId)}>
            {saving ? tc("saving") : t("save")}
          </Button>
        </Footer>
      }
    >
      <div className="flex flex-col gap-[18px] px-4 pt-3 pb-6">
        {savedExpenseId && (
          <FormAlert tone="success">
            {t("alreadySaved")}{" "}
            <Link href={`/transactions/${savedExpenseId}`} className="font-semibold">
              {t("openHistory")}
            </Link>
          </FormAlert>
        )}

        <div className="flex items-center gap-3 rounded-[14px] bg-surface p-3">
          {photoUrl && (
            <button type="button" onClick={() => setPhoto(true)} aria-label={t("viewPhoto")} className="h-[84px] w-16 flex-none overflow-hidden rounded-lg border-0 bg-bg p-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- signed Storage URL */}
              <img src={photoUrl} alt="" className="size-full object-cover object-top" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {checks > 0 ? (
              <div className="text-sm font-semibold text-warn">{t("needsCheck", { count: checks })}</div>
            ) : (
              <div className="text-sm font-semibold text-success">{t("ready")}</div>
            )}
            <p className="mt-1 mb-0 text-[13px] leading-[18px] text-fg-2">{t("intro")}</p>
            {photoUrl && (
              <button type="button" onClick={() => setPhoto(true)} className="mt-1 border-0 bg-transparent p-0 text-[13px] font-semibold text-accent">
                {t("viewPhoto")}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted" aria-label={t("legendLabel")}>
          <Legend cls="bg-accent-soft text-accent" text={t("badgeAi")}>
            {t("legendAi")}
          </Legend>
          <Legend cls="bg-warn-soft text-warn" text={t("badgeCheck")}>
            {t("legendCheck")}
          </Legend>
          <Legend cls="bg-raised text-fg-2" text={t("badgeEdited")}>
            {t("legendEdited")}
          </Legend>
        </div>

        {failure && <FormAlert>{failure}</FormAlert>}

        <div className="flex flex-col gap-1.5">
          <AiLabel htmlFor="r-amt" label={te("amount")} state={state("amount")} />
          <AmountInput
            id="r-amt"
            value={v.amount ? dots(v.amount) : ""}
            placeholder="0"
            onChange={(e) => mark("amount", parseAmount(e.target.value))}
            aria-invalid={amountError ? true : undefined}
            aria-describedby={amountError ? "r-amt-error" : undefined}
          />
          <FieldError id="r-amt-error" message={amountError} />
        </div>

        <div className="flex flex-col gap-2">
          <AiLabel htmlFor="r-merchant" label={t("merchant")} state={state("merchant")} />
          <input
            id="r-merchant"
            type="text"
            maxLength={80}
            value={v.merchant}
            onChange={(e) => mark("merchant", e.target.value)}
            className={cx(
              "box-border h-[50px] rounded-[10px] border bg-surface px-3.5 text-base text-fg outline-none focus:border-accent",
              state("merchant") === "check" ? "border-warn" : "border-raised",
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-2">
            <AiLabel htmlFor="r-date" label={te("date")} state={state("date")} />
            <input id="r-date" type="date" value={v.date} onChange={(e) => mark("date", e.target.value)} className={cx(selectClass, state("date") === "check" && "!border-warn")} />
          </div>
          <div className="flex flex-col gap-2">
            <AiLabel htmlFor="r-time" label={te("time")} state={state("time")} />
            <input id="r-time" type="time" value={v.time} onChange={(e) => mark("time", e.target.value)} className={cx(selectClass, state("time") === "check" && "!border-warn")} />
          </div>
        </div>
        {state("date") === "check" && <p className="-mt-2.5 mb-0 text-xs text-warn">{t("dateCheck")}</p>}

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-2">
            <AiLabel htmlFor="r-cat" label={te("category")} state={state("categoryId")} />
            <select id="r-cat" value={v.categoryId} onChange={(e) => mark("categoryId", e.target.value)} className={cx(selectClass, state("categoryId") === "check" && "!border-warn")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <AiLabel htmlFor="r-pay" label={te("paymentShort")} state={state("paymentMethod")} />
            <select
              id="r-pay"
              value={v.paymentMethod}
              onChange={(e) => mark("paymentMethod", e.target.value as PaymentMethod)}
              className={cx(selectClass, state("paymentMethod") === "check" && "!border-warn")}
            >
              {PAYMENT_METHODS.map((p) => (
                <option key={p} value={p}>
                  {tp(p)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="rounded-[14px] bg-surface px-3 pt-1 pb-3" aria-labelledby="items-h">
          <div className="flex h-11 items-center justify-between">
            <h2 id="items-h" className="m-0 text-[15px] font-semibold">
              {t("items")} <span className="font-normal text-muted">({items.length})</span>
            </h2>
            <span className="text-xs text-muted">{t("tapToEdit")}</span>
          </div>
          <div className="flex flex-col">
            {items.map((it, i) => (
              <div key={it.key} className="flex flex-col gap-1 border-t border-raised py-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={80}
                    aria-label={te("itemName", { n: i + 1 })}
                    value={it.name}
                    onChange={(e) => setItem(it.key, { name: e.target.value })}
                    placeholder={t("itemPlaceholder")}
                    className={cx(itemBox, "min-w-0 flex-1 border-raised px-2.5 placeholder:text-muted")}
                  />
                  <div className={cx(itemBox, "flex w-28 flex-none items-center gap-1 px-2", it.check ? "border-warn" : "border-raised")}>
                    <span className="text-xs text-muted">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={te("itemPrice", { n: i + 1 })}
                      value={dots(it.price)}
                      onChange={(e) => setItem(it.key, { price: parseAmount(e.target.value), check: false })}
                      className="min-w-0 flex-1 border-0 bg-transparent text-right text-sm text-fg tabular-nums outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((x) => x.key !== it.key))}
                    aria-label={te("removeItem", { n: i + 1 })}
                    className="flex h-10 w-9 flex-none items-center justify-center border-0 bg-transparent text-muted"
                  >
                    <Icon name="trash" size={18} strokeWidth={2} />
                  </button>
                </div>
                {it.check && <span className="text-xs text-warn">{t("priceCheck")}</span>}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setItems([...items, { key: nextKey, name: "", price: 0, check: false }]);
                setNextKey(nextKey + 1);
              }}
              className="mt-1 flex h-11 items-center justify-center gap-1.5 rounded-lg border border-dashed border-edge bg-transparent text-sm font-medium text-fg"
            >
              <Icon name="plus" size={16} strokeWidth={2.2} className="text-accent" />
              {te("addItem")}
            </button>
            <div className="flex justify-between px-0.5 pt-3 text-[15px] font-semibold">
              <span>{t("itemsTotal")}</span>
              <span className="tabular-nums">{rp(sum)}</span>
            </div>
          </div>
        </section>

        {mismatch && (
          <div role="status" className="flex flex-col gap-2.5 rounded-xl border border-warn-line bg-warn-soft px-3.5 py-3">
            <p className="m-0 text-sm leading-5">
              {t.rich("mismatch", { items: rp(sum), amount: rp(v.amount), b: (c) => <span className="font-semibold">{c}</span> })}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => mark("amount", sum)} className="h-11 rounded-lg border-0 bg-accent px-3 text-[13px] font-semibold text-accent-ink">
                {t("useItems")}
              </button>
              <button type="button" onClick={() => setKeepAmount(true)} className="h-11 rounded-lg border-0 bg-raised px-3 text-[13px] font-semibold text-fg">
                {t("keepAmount")}
              </button>
            </div>
          </div>
        )}
      </div>

      {photo && photoUrl && <PhotoViewer src={photoUrl} onClose={() => setPhoto(false)} />}
    </Screen>
  );
}
