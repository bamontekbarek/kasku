import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { ReceiptPaper } from "@/components/Receipt";
import { ButtonLink } from "@/components/ui";
import { cx } from "@/lib/format";
import { CameraHeader, roundAction } from "../CameraHeader";

export const metadata: Metadata = { title: "Rapikan Foto" };

type Quality = "ok" | "blur" | "dark";

const messages: Record<Exclude<Quality, "ok">, [string, string]> = {
  blur: ["Foto terlihat buram.", "Pegang HP lebih stabil dan pastikan fokus di tulisan struk. Foto buram sering salah dibaca AI."],
  dark: ["Foto terlalu gelap.", "Cari tempat lebih terang atau nyalakan lampu kilat agar angka di struk terbaca."],
};

const handle = "absolute size-6 rounded-full border-[3px] border-black bg-accent";

/** Crop / quality check. `?quality=blur|dark` previews the warning states. */
export default async function CropPage({ searchParams }: { searchParams: Promise<{ quality?: string }> }) {
  const { quality: q } = await searchParams;
  const quality: Quality = q === "blur" || q === "dark" ? q : "ok";
  const filter = quality === "blur" ? "blur(2.5px)" : quality === "dark" ? "brightness(0.35)" : undefined;

  return (
    <div className="pt-safe flex h-dvh flex-col bg-black">
      <CameraHeader
        title="Rapikan Foto"
        closeHref="/scan"
        closeLabel="Foto ulang"
        action={
          <button type="button" aria-label="Putar 90 derajat" className={cx(roundAction, "text-fg")}>
            <Icon name="rotate" strokeWidth={2} />
          </button>
        }
      />

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#2A2620]">
        <div className="relative h-[470px] max-h-[78%] w-[250px]">
          <ReceiptPaper className="absolute inset-0 rounded-[2px] px-[18px] py-[22px]" style={{ filter }} subtotal={false} />
          <div className="absolute -inset-2.5 rounded border-2 border-accent shadow-[0_0_0_999px_rgba(0,0,0,0.55)]" aria-hidden="true" />
          <span className={cx(handle, "-top-[22px] -left-[22px]")} aria-hidden="true" />
          <span className={cx(handle, "-top-[22px] -right-[22px]")} aria-hidden="true" />
          <span className={cx(handle, "-bottom-[22px] -left-[22px]")} aria-hidden="true" />
          <span className={cx(handle, "-right-[22px] -bottom-[22px]")} aria-hidden="true" />
        </div>
      </div>

      <div className="pb-safe flex flex-col gap-3.5 bg-black px-4 pt-4">
        {quality === "ok" ? (
          <>
            <div role="status" className="flex items-center gap-2.5 rounded-xl bg-success-soft px-3.5 py-3">
              <Icon name="check" size={18} strokeWidth={2.4} className="text-success" />
              <span className="text-sm leading-5">Foto jelas. Geser sudut kuning jika batas struk belum pas.</span>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-2.5">
              <ButtonLink href="/scan" variant="surface" className="text-[15px]">Foto ulang</ButtonLink>
              <ButtonLink href="/scan/processing">Gunakan foto</ButtonLink>
            </div>
          </>
        ) : (
          <>
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-warn-line bg-warn-soft px-3.5 py-3">
              <Icon name="alertTriangle" size={20} strokeWidth={2} className="mt-px flex-none text-warn" />
              <span className="text-sm leading-5">
                <span className="font-semibold">{messages[quality][0]}</span> {messages[quality][1]}
              </span>
            </div>
            <div className="grid grid-cols-[2fr_1fr] gap-2.5">
              <ButtonLink href="/scan">Foto ulang</ButtonLink>
              <ButtonLink href="/scan/processing" variant="surface" className="text-sm">Tetap pakai</ButtonLink>
            </div>
          </>
        )}
        <p className="m-0 text-center text-xs text-muted">Foto dipotong, diperkecil, dan dijadikan hitam-putih sebelum dikirim agar hemat kuota.</p>
      </div>
    </div>
  );
}
