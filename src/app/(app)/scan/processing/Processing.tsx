"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ReceiptPaper } from "@/components/Receipt";
import { ButtonLink, TopBar } from "@/components/ui";

const steps = ["Gambar diunggah", "Mengenali teks di struk", "Menyusun data pengeluaran", "Mengisi form otomatis"];

/**
 * AI receipt-reading progress. In production this follows the real pipeline:
 * upload to Supabase Storage → API route → AI model → JSON → prefill form.
 */
export function Processing() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (step >= steps.length) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), 1400);
    return () => window.clearTimeout(id);
  }, [step]);

  const finished = step >= steps.length;

  return (
    <div className="pt-safe pb-safe flex min-h-dvh flex-col bg-bg">
      <TopBar title="Membaca Struk" back="/add" />

      <div className="flex justify-center pt-6">
        <div className="relative box-border h-[290px] w-[190px] overflow-hidden rounded-[14px] bg-surface p-3.5">
          <ReceiptPaper scale="md" className="size-full rounded px-3.5 py-4" />
          {!finished && (
            <div className="absolute right-2 left-2 h-[3px] animate-kscan rounded-sm bg-accent shadow-[0_0_16px_4px_rgba(252,213,53,0.55)]" aria-hidden="true" />
          )}
        </div>
      </div>

      <div className="px-6 pt-7 text-center">
        <div className="inline-flex h-7 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-[13px] font-semibold text-accent">
          <Icon name="sparkle" size={14} strokeWidth={2} />
          Ditenagai AI
        </div>
        <h2 className="mt-3 mb-0 text-[22px] font-bold" aria-live="polite">
          {finished ? "Struk berhasil dibaca" : "AI sedang membaca struk…"}
        </h2>
        <p className="mt-1.5 mb-0 text-sm leading-5 text-muted">Total, nama toko, tanggal, dan item belanja akan langsung diisi ke form.</p>
      </div>

      <ol className="mx-4 mt-6 mb-0 flex list-none flex-col rounded-[14px] bg-surface px-4 py-1">
        {steps.map((label, i) => (
          <li key={label} className="flex h-12 items-center gap-3 text-[15px]">
            {i < step ? (
              <>
                <span className="flex size-6 flex-none items-center justify-center rounded-full bg-success text-bg">
                  <Icon name="check" size={14} strokeWidth={3} />
                </span>
                <span className="text-fg">{label}</span>
              </>
            ) : i === step ? (
              <>
                <span className="box-border size-6 flex-none animate-kspin rounded-full border-[3px] border-raised border-t-accent" aria-hidden="true" />
                <span className="font-semibold text-accent">{label}</span>
              </>
            ) : (
              <>
                <span className="box-border size-6 flex-none rounded-full border-2 border-raised" aria-hidden="true" />
                <span className="text-muted">{label}</span>
              </>
            )}
          </li>
        ))}
      </ol>

      <div className="flex-1" />
      <div className="flex flex-col gap-2.5 px-4 pt-3">
        {finished && <ButtonLink href="/scan/review">Lihat hasil</ButtonLink>}
        <ButtonLink href="/add" variant="surface" size="md">
          Batal, isi manual
        </ButtonLink>
      </div>
    </div>
  );
}
