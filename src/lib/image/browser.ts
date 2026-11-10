"use client";

import { assessQuality, autoLevels, detectPaper, targetSize, toGray, type Box } from "./analyze";

/** Longest side of the in-memory working copy (keeps iOS canvas memory in check; plenty for 640 px output). */
const WORK_MAX = 2400;
const ANALYZE_WIDTH = 400;
/** PRD 7.1 step 6: JPEG ~0.75, aim < 150 KB, hard stop well under the 300 KB budget. */
const QUALITIES = [0.75, 0.65, 0.55];
const TARGET_BYTES = 150 * 1024;

export type Rotation = 0 | 90 | 180 | 270;

/** Decode a photo. <img> applies the EXIF orientation in every supported browser (PRD 7.1 step 2). */
export async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // The decoded image stays usable after the URL is revoked.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function canvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas unavailable");
  return [c, ctx];
}

/** Rotated working copy, longest side ≤ `max`. */
export function renderRotated(img: HTMLImageElement, rotation: Rotation, max = WORK_MAX): HTMLCanvasElement {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const sideways = rotation === 90 || rotation === 270;
  const [c, ctx] = canvas(sideways ? h : w, sideways ? w : h);
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  return c;
}

function grayOf(source: HTMLCanvasElement, width: number): { gray: Uint8Array; width: number; height: number } {
  const w = Math.min(width, source.width);
  const h = Math.max(1, Math.round((source.height * w) / source.width));
  const [, ctx] = canvas(w, h);
  ctx.drawImage(source, 0, 0, w, h);
  return { gray: toGray(ctx.getImageData(0, 0, w, h).data, w, h), width: w, height: h };
}

/** Quality check + automatic crop suggestion from a small copy (PRD 7.1 steps 1 and 3). */
export function analyzePhoto(work: HTMLCanvasElement): { quality: "ok" | "blur" | "dark"; box: Box } {
  const small = grayOf(work, ANALYZE_WIDTH);
  const box = detectPaper(small.gray, small.width, small.height);
  // Judge sharpness/brightness on the receipt itself, not the table around it.
  const x0 = Math.floor(box.x0 * small.width);
  const y0 = Math.floor(box.y0 * small.height);
  const w = Math.max(3, Math.floor((box.x1 - box.x0) * small.width));
  const h = Math.max(3, Math.floor((box.y1 - box.y0) * small.height));
  const crop = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) crop.set(small.gray.subarray((y0 + y) * small.width + x0, (y0 + y) * small.width + x0 + w), y * w);
  return { quality: assessQuality(crop, w, h), box };
}

function toBlob(c: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", quality));
}

export type Optimized = { blob: Blob; width: number; height: number };

/** Crop → resize → grayscale + auto-levels → JPEG (PRD 7.1 steps 3–6). */
export async function optimizePhoto(work: HTMLCanvasElement, box: Box): Promise<Optimized> {
  const sx = Math.round(box.x0 * work.width);
  const sy = Math.round(box.y0 * work.height);
  const sw = Math.max(1, Math.round((box.x1 - box.x0) * work.width));
  const sh = Math.max(1, Math.round((box.y1 - box.y0) * work.height));
  const size = targetSize(sw, sh);

  const [out, ctx] = canvas(size.width, size.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(work, sx, sy, sw, sh, 0, 0, size.width, size.height);

  const data = ctx.getImageData(0, 0, size.width, size.height);
  const gray = autoLevels(toGray(data.data, size.width, size.height));
  for (let i = 0, p = 0; p < gray.length; i += 4, p++) {
    data.data[i] = data.data[i + 1] = data.data[i + 2] = gray[p]!;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);

  let blob = await toBlob(out, QUALITIES[0]!);
  for (const q of QUALITIES.slice(1)) {
    if (blob.size <= TARGET_BYTES) break;
    blob = await toBlob(out, q);
  }
  return { blob, width: size.width, height: size.height };
}

/** Grab the current camera frame as a JPEG. */
export async function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const [c, ctx] = canvas(video.videoWidth, video.videoHeight);
  ctx.drawImage(video, 0, 0);
  return toBlob(c, 0.92);
}
