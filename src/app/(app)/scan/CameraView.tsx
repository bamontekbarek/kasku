"use client";

import { useTranslations } from "next-intl";
import { useAppRouter } from "@/components/NavProgress";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { captureFrame } from "@/lib/image/browser";
import { scanStore } from "@/lib/scan/store";
import { usePickPhoto } from "@/lib/scan/usePickPhoto";
import { cx } from "@/lib/format";
import { CameraHeader, roundAction } from "./CameraHeader";

const corner = "absolute size-10 border-accent";

type TorchTrack = Omit<MediaStreamTrack, "getCapabilities"> & { getCapabilities?: () => { torch?: boolean } };

/**
 * SCAN-01: live rear camera with a guide frame and flash when supported. Falls back to the phone's
 * own camera app (`capture`) when getUserMedia isn't available or permission is denied.
 */
export function CameraView() {
  const t = useTranslations("scan.camera");
  const router = useAppRouter();
  const pick = usePickPhoto();
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<TorchTrack | null>(null);
  const [state, setState] = useState<"starting" | "live" | "unavailable">("starting");
  const [torch, setTorch] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((tr) => tr.stop());
        stream = s;
        const track = s.getVideoTracks()[0] as TorchTrack | undefined;
        trackRef.current = track ?? null;
        if (track?.getCapabilities?.().torch) setTorch(false);
        if (videoRef.current) videoRef.current.srcObject = s;
        setState("live");
      })
      .catch(() => setState("unavailable"));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  const toggleTorch = async () => {
    const next = !torch;
    try {
      await trackRef.current?.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorch(next);
    } catch {
      setTorch(null);
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || busy) return;
    setBusy(true);
    try {
      scanStore.start(await captureFrame(video));
      router.push("/scan/crop");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-safe flex h-dvh flex-col bg-black">
      <CameraHeader
        title={t("title")}
        closeHref="/add"
        closeLabel={t("close")}
        action={
          torch === null ? (
            <span />
          ) : (
            <button type="button" aria-label={t("flash")} aria-pressed={torch} onClick={toggleTorch} className={cx(roundAction, torch ? "text-accent" : "text-fg-2")}>
              <Icon name="flash" strokeWidth={2} />
            </button>
          )
        }
      />

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#15171B]">
        <video ref={videoRef} autoPlay playsInline muted className={cx("absolute inset-0 size-full object-cover", state !== "live" && "hidden")} />
        {state === "unavailable" ? (
          <div className="relative flex max-w-[300px] flex-col items-center gap-4 px-6 text-center">
            <p className="m-0 text-sm leading-5 text-fg-2">{t("noCamera")}</p>
            <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-accent px-5 text-[15px] font-semibold text-accent-ink">
              <Icon name="camera" strokeWidth={2} />
              {t("openCamera")}
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick} />
            </label>
          </div>
        ) : (
          <>
            <div className="relative h-[460px] max-h-[80%] w-[290px]" aria-hidden="true">
              <div className={cx(corner, "top-0 left-0 rounded-tl-[14px] border-t-4 border-l-4")} />
              <div className={cx(corner, "top-0 right-0 rounded-tr-[14px] border-t-4 border-r-4")} />
              <div className={cx(corner, "bottom-0 left-0 rounded-bl-[14px] border-b-4 border-l-4")} />
              <div className={cx(corner, "right-0 bottom-0 rounded-br-[14px] border-r-4 border-b-4")} />
            </div>
            <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[rgba(11,14,17,0.85)] px-3.5 py-2 text-[13px] whitespace-nowrap">
              <span className={cx("size-2 rounded-full", state === "live" ? "bg-success" : "bg-muted")} />
              {t("guide")}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-[18px] bg-black px-6 pt-4 pb-[max(env(safe-area-inset-bottom),40px)]">
        <p className="m-0 text-center text-[13px] leading-[18px] text-fg-2">{t("hint")}</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <label className="flex cursor-pointer flex-col items-center gap-1 justify-self-start text-xs text-fg">
            <span className="flex size-12 items-center justify-center rounded-xl bg-surface">
              <Icon name="image" size={22} />
            </span>
            {t("gallery")}
            <input type="file" accept="image/*" className="sr-only" onChange={pick} />
          </label>
          <button
            type="button"
            onClick={capture}
            disabled={state !== "live" || busy}
            aria-label={t("shutter")}
            className="box-border flex size-[76px] items-center justify-center rounded-full border-4 border-fg bg-transparent p-0 disabled:opacity-40"
          >
            <span className="block size-[58px] rounded-full bg-accent" />
          </button>
          <span />
        </div>
      </div>
    </div>
  );
}
