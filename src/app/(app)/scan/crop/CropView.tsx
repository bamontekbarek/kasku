"use client";

import { useTranslations } from "next-intl";
import { useAppRouter } from "@/components/NavProgress";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Icon } from "@/components/Icon";
import { Button, ButtonLink } from "@/components/ui";
import { cx } from "@/lib/format";
import type { Box } from "@/lib/image/analyze";
import { analyzePhoto, loadImage, optimizePhoto, renderRotated, type Rotation } from "@/lib/image/browser";
import { scanStore } from "@/lib/scan/store";
import { CameraHeader, roundAction } from "../CameraHeader";

type Corner = "tl" | "tr" | "bl" | "br";
const CORNERS: Corner[] = ["tl", "tr", "bl", "br"];
const MIN = 0.1;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Move one corner; the two edges it touches follow. */
function moveCorner(box: Box, corner: Corner, x: number, y: number): Box {
  const next = { ...box };
  if (corner === "tl" || corner === "bl") next.x0 = clamp(x, 0, box.x1 - MIN);
  else next.x1 = clamp(x, box.x0 + MIN, 1);
  if (corner === "tl" || corner === "tr") next.y0 = clamp(y, 0, box.y1 - MIN);
  else next.y1 = clamp(y, box.y0 + MIN, 1);
  return next;
}

const cornerPos = (box: Box, c: Corner) => ({ x: c === "tl" || c === "bl" ? box.x0 : box.x1, y: c === "tl" || c === "tr" ? box.y0 : box.y1 });

/** SCAN-02 / PRD 7.1: quality check, automatic crop with movable corners, rotate, then optimise. */
export function CropView() {
  const t = useTranslations("scan.crop");
  const router = useAppRouter();
  const previewRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [box, setBox] = useState<Box | null>(null);
  const [quality, setQuality] = useState<"ok" | "blur" | "dark">("ok");
  const [phase, setPhase] = useState<"loading" | "ready" | "working" | "failed">("loading");
  const dragging = useRef<Corner | null>(null);

  const prepare = useCallback((rot: Rotation) => {
    const img = imgRef.current;
    const preview = previewRef.current;
    if (!img || !preview) return;
    const work = renderRotated(img, rot);
    workRef.current = work;
    const scale = Math.min(1, 900 / Math.max(work.width, work.height));
    preview.width = Math.round(work.width * scale);
    preview.height = Math.round(work.height * scale);
    preview.getContext("2d")?.drawImage(work, 0, 0, preview.width, preview.height);
    const result = analyzePhoto(work);
    setBox(result.box);
    setQuality(result.quality);
    setPhase("ready");
  }, []);

  useEffect(() => {
    const source = scanStore.get().source;
    if (!source) {
      router.replace("/scan");
      return;
    }
    let cancelled = false;
    loadImage(source)
      .then((img) => {
        if (cancelled) return;
        imgRef.current = img;
        prepare(0);
      })
      .catch(() => !cancelled && setPhase("failed"));
    return () => {
      cancelled = true;
    };
  }, [prepare, router]);

  const rotate = () => {
    const next = ((rotation + 90) % 360) as Rotation;
    setRotation(next);
    prepare(next);
  };

  const onPointerMove = (e: PointerEvent) => {
    const corner = dragging.current;
    const frame = frameRef.current;
    if (!corner || !frame || !box) return;
    const r = frame.getBoundingClientRect();
    setBox(moveCorner(box, corner, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height));
  };

  const onKey = (corner: Corner) => (e: KeyboardEvent) => {
    if (!box) return;
    const step = e.shiftKey ? 0.05 : 0.01;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    const p = cornerPos(box, corner);
    setBox(moveCorner(box, corner, p.x + d[0]!, p.y + d[1]!));
  };

  const use = async () => {
    const work = workRef.current;
    if (!work || !box) return;
    setPhase("working");
    try {
      scanStore.setOptimized(await optimizePhoto(work, box));
      router.push("/scan/processing");
    } catch {
      setPhase("failed");
    }
  };

  const warn = quality !== "ok";

  return (
    <div className="pt-safe flex h-dvh flex-col bg-black">
      <CameraHeader
        title={t("title")}
        closeHref="/scan"
        closeLabel={t("retake")}
        action={
          <button type="button" onClick={rotate} disabled={phase !== "ready"} aria-label={t("rotate")} className={cx(roundAction, "text-fg disabled:opacity-40")}>
            <Icon name="rotate" strokeWidth={2} />
          </button>
        }
      />

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#2A2620] p-6" onPointerMove={onPointerMove} onPointerUp={() => (dragging.current = null)}>
        {phase === "loading" && <p className="absolute m-0 text-sm text-fg-2">{t("loading")}</p>}
        {phase === "failed" && (
          <p role="alert" className="absolute m-0 px-6 text-center text-sm text-fg-2">
            {t("loadFailed")}
          </p>
        )}
        <div ref={frameRef} className={cx("relative touch-none select-none", (phase === "loading" || phase === "failed") && "invisible")}>
          <canvas ref={previewRef} className="block max-h-[calc(100dvh-330px)] max-w-[calc(min(100vw,430px)-48px)]" />
          {box && (
            <>
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div
                  className="absolute rounded-sm border-2 border-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                  style={{ left: `${box.x0 * 100}%`, top: `${box.y0 * 100}%`, width: `${(box.x1 - box.x0) * 100}%`, height: `${(box.y1 - box.y0) * 100}%` }}
                />
              </div>
              {CORNERS.map((c) => {
                const p = cornerPos(box, c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-label={t(`corner.${c}`)}
                    onPointerDown={(e) => {
                      dragging.current = c;
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={onPointerMove}
                    onPointerUp={() => (dragging.current = null)}
                    onKeyDown={onKey(c)}
                    className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center border-0 bg-transparent p-0"
                    style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                  >
                    <span className="block size-6 rounded-full border-[3px] border-black bg-accent" />
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      <div className="pb-safe flex flex-col gap-3.5 bg-black px-4 pt-4">
        {phase !== "failed" &&
          (warn ? (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-warn-line bg-warn-soft px-3.5 py-3">
              <Icon name="alertTriangle" size={20} strokeWidth={2} className="mt-px flex-none text-warn" />
              <span className="text-sm leading-5">
                <span className="font-semibold">{t(quality === "blur" ? "blurTitle" : "darkTitle")}</span> {t(quality === "blur" ? "blurBody" : "darkBody")}
              </span>
            </div>
          ) : (
            phase !== "loading" && (
              <div role="status" className="flex items-center gap-2.5 rounded-xl bg-success-soft px-3.5 py-3">
                <Icon name="check" size={18} strokeWidth={2.4} className="flex-none text-success" />
                <span className="text-sm leading-5">{t("ok")}</span>
              </div>
            )
          ))}
        {warn ? (
          <div className="grid grid-cols-[2fr_1fr] gap-2.5">
            <ButtonLink href="/scan">{t("retake")}</ButtonLink>
            <Button variant="surface" className="text-sm" onClick={use} loading={phase === "working"} disabled={phase !== "ready" && phase !== "working"}>
              {t("useAnyway")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_2fr] gap-2.5">
            <ButtonLink href="/scan" variant="surface" className="text-[15px]">
              {t("retake")}
            </ButtonLink>
            <Button onClick={use} loading={phase === "working"} disabled={phase !== "ready" && phase !== "working"}>
              {phase === "working" ? t("preparing") : t("use")}
            </Button>
          </div>
        )}
        <p className="m-0 text-center text-xs text-muted">{t("note")}</p>
      </div>
    </div>
  );
}
