"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getExportSummary } from "@/app/actions/export";
import { Icon } from "@/components/Icon";
import { Sheet, SheetHeader } from "@/components/Sheet";
import { Badge, Button, ButtonLink, Notice, Segmented } from "@/components/ui";
import { exportFileName, validRange } from "@/lib/export/csv";
import { rp } from "@/lib/format";

type P = "now" | "last" | "custom";
type Month = { value: string; label: string };

const dateClass =
  "box-border h-11 w-full min-w-0 rounded-lg border border-raised bg-bg px-2.5 text-sm text-fg outline-none focus:border-accent";

function lastDayOf(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${month}-${String(new Date(Date.UTC(y!, m!, 0)).getUTCDate()).padStart(2, "0")}`;
}

/** iPhone/iPad (incl. iPadOS that reports as Mac): save through the share sheet (HIS-05). */
function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** HIS-04, HIS-05: pick a period (this month, last month, custom), follow History's category filter, export CSV. */
export function ExportSheet({
  closeHref,
  today,
  thisMonth,
  lastMonth,
  category,
}: {
  closeHref: string;
  today: string;
  thisMonth: Month;
  lastMonth: Month;
  category: { id: string; name: string } | null;
}) {
  const t = useTranslations("exportSheet");
  const tc = useTranslations("common");
  const [p, setP] = useState<P>("now");
  const [customFrom, setCustomFrom] = useState(`${thisMonth.value}-01`);
  const [customTo, setCustomTo] = useState(today);
  const [summary, setSummary] = useState<{ count: number; total: number } | null>(null);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<File | null>(null);
  const [done, setDone] = useState(false);

  const range =
    p === "now"
      ? { from: `${thisMonth.value}-01`, to: lastDayOf(thisMonth.value) }
      : p === "last"
        ? { from: `${lastMonth.value}-01`, to: lastDayOf(lastMonth.value) }
        : validRange(customFrom, customTo);
  const fileName = range ? exportFileName(range.from, range.to) : "";
  const label = p === "now" ? thisMonth.label : p === "last" ? lastMonth.label : range ? `${range.from} – ${range.to}` : "";

  useEffect(() => {
    setSummary(null);
    setSummaryFailed(false);
    if (!range) return;
    let live = true;
    const timer = setTimeout(async () => {
      const res = await getExportSummary(range.from, range.to, category?.id ?? null);
      if (!live) return;
      if (res.ok) setSummary({ count: res.count, total: res.total });
      else setSummaryFailed(true);
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- range is derived from these
  }, [p, customFrom, customTo, category?.id]);

  const reset = () => {
    setDone(false);
    setReady(null);
    setError(null);
  };

  const run = async () => {
    if (!range) return;
    setBusy(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ from: range.from, to: range.to });
      if (category) qs.set("category", category.id);
      const res = await fetch(`/api/export?${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const file = new File([await res.blob()], fileName, { type: "text/csv" });
      if (isIos() && navigator.canShare?.({ files: [file] })) {
        // Sharing needs a fresh tap, so the share button appears in the done state.
        setReady(file);
      } else {
        download(file);
      }
      setDone(true);
    } catch {
      setError(tc("genericError"));
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!ready) return;
    try {
      await navigator.share({ files: [ready], title: ready.name });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      download(ready);
    }
  };

  return (
    <Sheet labelledBy="ex-h" closeHref={closeHref}>
      <div className="-mt-1.5">
        <SheetHeader id="ex-h" title={t("title")} closeHref={closeHref} />
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2.5 p-0 text-sm font-medium text-fg-2">{t("period")}</legend>
        <Segmented
          className="bg-bg"
          options={(["now", "last", "custom"] as const).map((k) => ({ value: k, label: t(`periods.${k}`) }))}
          value={p}
          onChange={(k) => {
            setP(k);
            reset();
          }}
        />
        {p === "custom" && (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ex-from" className="text-xs text-muted">
                {t("from")}
              </label>
              <input
                id="ex-from"
                type="date"
                value={customFrom}
                max={today}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  reset();
                }}
                className={dateClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ex-to" className="text-xs text-muted">
                {t("to")}
              </label>
              <input
                id="ex-to"
                type="date"
                value={customTo}
                min={customFrom}
                max={today}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  reset();
                }}
                className={dateClass}
              />
            </div>
          </div>
        )}
      </fieldset>

      <div className="flex items-center justify-between gap-3 rounded-[10px] bg-bg px-3.5 py-3">
        <span className="text-sm text-fg-2">{t("category")}</span>
        <span className="min-w-0 truncate text-right text-sm font-medium">
          {category ? category.name : t("allCategories")} <span className="font-normal text-muted">{t("followsHistory")}</span>
        </span>
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2.5 p-0 text-sm font-medium text-fg-2">{t("format")}</legend>
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" aria-pressed="true" className="rounded-xl border-2 border-accent bg-accent-soft p-3 text-left text-fg">
            <span className="block text-[15px] font-bold">CSV</span>
            <span className="mt-0.5 block text-xs leading-[17px] text-fg-2">{t("csvSub")}</span>
          </button>
          <button type="button" disabled aria-pressed="false" className="rounded-xl border border-raised bg-transparent p-3 text-left text-muted">
            <span className="flex items-center gap-1.5 text-[15px] font-bold">
              PDF <Badge tone="neutral" size="xs">{t("soon")}</Badge>
            </span>
            <span className="mt-0.5 block text-xs leading-[17px]">{t("pdfSub")}</span>
          </button>
        </div>
      </fieldset>

      {error && (
        <Notice tone="danger" icon="alertTriangle" role="alert">
          {error}
        </Notice>
      )}

      {done ? (
        <>
          <div role="status" className="flex items-start gap-2.5 rounded-xl bg-success-soft px-3.5 py-3">
            <Icon name="check" size={20} strokeWidth={2.4} className="mt-px flex-none text-success" />
            <span className="text-sm leading-5">
              {t.rich(ready ? "readyIos" : "downloaded", { file: fileName, b: (c) => <span className="font-semibold">{c}</span> })}
            </span>
          </div>
          {ready && <Button onClick={share}>{t("share")}</Button>}
          <ButtonLink href={closeHref} variant="secondary">
            {t("done")}
          </ButtonLink>
        </>
      ) : (
        <>
          <p className="m-0 min-h-5 text-center text-sm text-fg-2 tabular-nums" aria-live="polite">
            {!range
              ? t("invalidRange")
              : summaryFailed
                ? t("summaryFailed")
                : summary
                  ? t("summary", { label, count: summary.count, total: rp(summary.total) })
                  : t("counting")}
          </p>
          <Button onClick={run} loading={busy} disabled={!range || summary?.count === 0}>
            {busy ? t("preparing") : summary?.count === 0 ? t("nothing") : t("export")}
          </Button>
        </>
      )}
    </Sheet>
  );
}
