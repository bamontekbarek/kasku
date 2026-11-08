"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Sheet } from "@/components/Sheet";
import { Button, ButtonLink, Segmented, StepNumber } from "@/components/ui";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

export function InstallSheet() {
  const [os, setOs] = useState<"ios" | "android">("ios");
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (/android/i.test(navigator.userAgent)) setOs("android");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return (
    <Sheet labelledBy="ig-h" closeHref="/settings" gap="gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-[52px] flex-none items-center justify-center rounded-xl bg-accent text-accent-ink">
          <Icon name="receipt" size={28} strokeWidth={2} />
        </span>
        <div>
          <h2 id="ig-h" className="m-0 text-lg font-bold">Pasang Kasku di layar utama</h2>
          <p className="mt-0.5 mb-0 text-[13px] text-fg-2">Buka seperti aplikasi, tanpa app store.</p>
        </div>
      </div>

      <Segmented
        label="Jenis HP"
        className="bg-bg"
        itemClass="h-9 rounded-lg text-sm"
        options={[
          { value: "ios", label: "iPhone" },
          { value: "android", label: "Android" },
        ]}
        value={os}
        onChange={setOs}
      />

      {os === "ios" ? (
        <>
          <ol className="m-0 list-none rounded-[14px] bg-bg px-3.5 py-1">
            <li className="flex min-h-[52px] items-center gap-3 border-b border-surface">
              <StepNumber n={1} />
              <span className="flex-1 text-sm leading-5">Buka Kasku di <span className="font-semibold">Safari</span></span>
            </li>
            <li className="flex min-h-[52px] items-center gap-3 border-b border-surface">
              <StepNumber n={2} />
              <span className="flex-1 text-sm leading-5">Ketuk tombol <span className="font-semibold">Bagikan</span> di bawah layar</span>
              <Icon name="share" size={22} className="text-info" />
            </li>
            <li className="flex min-h-[52px] items-center gap-3">
              <StepNumber n={3} />
              <span className="flex-1 text-sm leading-5">
                Pilih <span className="font-semibold">Tambah ke Layar Utama</span>, lalu <span className="font-semibold">Tambah</span>
              </span>
              <Icon name="addSquare" size={22} className="text-fg-2" />
            </li>
          </ol>
          <p className="m-0 text-xs leading-[17px] text-muted">Setelah terpasang, notifikasi ke HP bisa diaktifkan (iOS 16.4 ke atas).</p>
          <ButtonLink href="/settings" variant="secondary">Mengerti</ButtonLink>
        </>
      ) : (
        <>
          <p className="m-0 text-sm leading-[21px] text-fg-2">
            Di Chrome Android, Kasku bisa dipasang langsung. Ikon akan muncul di layar utama seperti aplikasi lain.
          </p>
          <Button onClick={() => prompt?.prompt()}>Pasang sekarang</Button>
          <p className="m-0 text-xs leading-[17px] text-muted">
            Tombol ini membuka dialog pemasangan dari browser. Jika tidak muncul, buka menu titik tiga › Tambahkan ke layar utama.
          </p>
        </>
      )}
    </Sheet>
  );
}
