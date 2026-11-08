"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { ReceiptPaper } from "@/components/Receipt";
import { cx } from "@/lib/format";
import { CameraHeader, roundAction } from "./CameraHeader";

const corner = "absolute size-10 border-accent";

/**
 * Camera capture screen. Uses the rear camera when available and falls back to
 * an illustrated receipt (desktop, permission denied, or SSR).
 */
export function CameraView() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setLive(true);
        }
      })
      .catch(() => setLive(false));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  // TODO: capture a frame to a Blob and hand it to the crop step
  const capture = () => router.push("/scan/crop");

  return (
    <div className="pt-safe flex h-dvh flex-col bg-black">
      <CameraHeader
        title="Foto Struk"
        closeHref="/add"
        closeLabel="Tutup kamera"
        action={
          <button type="button" aria-label="Lampu kilat" aria-pressed={flash} onClick={() => setFlash(!flash)} className={cx(roundAction, flash ? "text-accent" : "text-fg-2")}>
            <Icon name="flash" strokeWidth={2} />
          </button>
        }
      />

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#15171B]">
        <video ref={videoRef} autoPlay playsInline muted className={cx("absolute inset-0 size-full object-cover", !live && "hidden")} />
        <div className="relative h-[460px] max-h-[80%] w-[290px]">
          {!live && (
            <ReceiptPaper className="absolute top-[26px] left-[34px] h-[408px] max-h-[88%] w-[222px] -rotate-2 rounded-[3px] px-[18px] py-[22px] shadow-[0_12px_30px_rgba(0,0,0,0.5)]" />
          )}
          <div className={cx(corner, "top-0 left-0 rounded-tl-[14px] border-t-4 border-l-4")} aria-hidden="true" />
          <div className={cx(corner, "top-0 right-0 rounded-tr-[14px] border-t-4 border-r-4")} aria-hidden="true" />
          <div className={cx(corner, "bottom-0 left-0 rounded-bl-[14px] border-b-4 border-l-4")} aria-hidden="true" />
          <div className={cx(corner, "right-0 bottom-0 rounded-br-[14px] border-r-4 border-b-4")} aria-hidden="true" />
        </div>
        <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[rgba(11,14,17,0.85)] px-3.5 py-2 text-[13px] whitespace-nowrap">
          <span className="size-2 rounded-full bg-success" />
          Struk terdeteksi — tahan sebentar
        </div>
      </div>

      <div className="flex flex-col gap-[18px] bg-black px-6 pt-4 pb-[max(env(safe-area-inset-bottom),40px)]">
        <p className="m-0 text-center text-[13px] leading-[18px] text-fg-2">Pastikan seluruh struk masuk bingkai, terang, dan tidak buram.</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <label className="flex cursor-pointer flex-col items-center gap-1 justify-self-start text-xs text-fg">
            <span className="flex size-12 items-center justify-center rounded-xl bg-surface">
              <Icon name="image" size={22} />
            </span>
            Galeri
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.length && router.push("/scan/crop")} />
          </label>
          <button
            type="button"
            onClick={capture}
            aria-label="Ambil foto"
            className="box-border flex size-[76px] items-center justify-center rounded-full border-4 border-fg bg-transparent p-0"
          >
            <span className="block size-[58px] rounded-full bg-accent" />
          </button>
          <span />
        </div>
      </div>
    </div>
  );
}
