/**
 * Pure image maths for receipt photos (PRD 7.1), on plain pixel arrays so it runs in the
 * browser without libraries (no OpenCV.js) and is unit-testable.
 */

export type Box = { x0: number; y0: number; x1: number; y1: number };

export const FULL_BOX: Box = { x0: 0, y0: 0, x1: 1, y1: 1 };

/** Below this Laplacian variance a ~400 px wide photo of text looks blurred. */
export const BLUR_THRESHOLD = 30;
/** Mean luma (0–255) below this is too dark to read thermal print. */
export const DARK_THRESHOLD = 70;

/** RGBA → luma (Rec. 601). */
export function toGray(rgba: ArrayLike<number>, width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height);
  for (let i = 0, p = 0; p < out.length; i += 4, p++) {
    out[p] = (rgba[i]! * 299 + rgba[i + 1]! * 587 + rgba[i + 2]! * 114) / 1000;
  }
  return out;
}

export function meanBrightness(gray: Uint8Array): number {
  let sum = 0;
  for (const v of gray) sum += v;
  return gray.length ? sum / gray.length : 0;
}

/** Variance of the 4-neighbour Laplacian: low = few sharp edges = blurred. */
export function laplacianVariance(gray: Uint8Array, width: number, height: number): number {
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const v = gray[i - 1]! + gray[i + 1]! + gray[i - width]! + gray[i + width]! - 4 * gray[i]!;
      sum += v;
      sumSq += v * v;
      n++;
    }
  }
  if (n === 0) return 0;
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

export function assessQuality(gray: Uint8Array, width: number, height: number): "ok" | "blur" | "dark" {
  if (meanBrightness(gray) < DARK_THRESHOLD) return "dark";
  if (laplacianVariance(gray, width, height) < BLUR_THRESHOLD) return "blur";
  return "ok";
}

/** Otsu's threshold: splits the histogram into "paper" and "background". */
export function otsu(gray: Uint8Array): number {
  const hist = new Array<number>(256).fill(0);
  for (const v of gray) hist[v]!++;
  const total = gray.length;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i]!;
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]!;
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t]!;
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
}

/** Longest run of indices where `ok(i)` holds, bridging gaps up to `maxGap` (text lines on the paper). */
function longestRun(length: number, ok: (i: number) => boolean, maxGap: number): [number, number] | null {
  let best: [number, number] | null = null;
  let start = -1;
  let lastOk = -1;
  for (let i = 0; i <= length; i++) {
    const hit = i < length && ok(i);
    if (hit) {
      if (start < 0 || i - lastOk - 1 > maxGap) {
        if (start >= 0 && (!best || lastOk + 1 - start > best[1] - best[0])) best = [start, lastOk + 1];
        start = i;
      }
      lastOk = i;
    }
  }
  if (start >= 0 && (!best || lastOk + 1 - start > best[1] - best[0])) best = [start, lastOk + 1];
  return best;
}

/**
 * Find the bright paper on a darker background (PRD 7.1 step 3) from a small gray image.
 * Returns fractions of the image, with a 2% margin; the full frame when nothing convincing is found.
 */
export function detectPaper(gray: Uint8Array, width: number, height: number): Box {
  const t = otsu(gray);
  const bright = (x: number, y: number) => gray[y * width + x]! > t;

  const rowFill = (y: number, x0 = 0, x1 = width) => {
    let c = 0;
    for (let x = x0; x < x1; x++) if (bright(x, y)) c++;
    return c / (x1 - x0);
  };
  const rows = longestRun(height, (y) => rowFill(y) > 0.2, Math.max(2, Math.round(height * 0.04)));
  if (!rows) return FULL_BOX;

  const colFill = (x: number) => {
    let c = 0;
    for (let y = rows[0]; y < rows[1]; y++) if (bright(x, y)) c++;
    return c / (rows[1] - rows[0]);
  };
  const cols = longestRun(width, (x) => colFill(x) > 0.5, Math.max(2, Math.round(width * 0.04)));
  if (!cols) return FULL_BOX;

  const area = ((rows[1] - rows[0]) * (cols[1] - cols[0])) / (width * height);
  if (area < 0.12 || area > 0.97) return FULL_BOX;

  const m = 0.02;
  return {
    x0: Math.max(0, cols[0] / width - m),
    y0: Math.max(0, rows[0] / height - m),
    x1: Math.min(1, cols[1] / width + m),
    y1: Math.min(1, rows[1] / height + m),
  };
}

/** Light auto-levels: stretch the 1st–99th percentile to 0–255 (no hard black/white threshold). */
export function autoLevels(gray: Uint8Array): Uint8Array {
  const hist = new Array<number>(256).fill(0);
  for (const v of gray) hist[v]!++;
  const cut = gray.length * 0.01;
  let lo = 0;
  for (let acc = 0; lo < 255 && acc + hist[lo]! <= cut; lo++) acc += hist[lo]!;
  let hi = 255;
  for (let acc = 0; hi > 0 && acc + hist[hi]! <= cut; hi--) acc += hist[hi]!;
  if (hi - lo < 32) return gray;
  const out = new Uint8Array(gray.length);
  const scale = 255 / (hi - lo);
  for (let i = 0; i < gray.length; i++) out[i] = Math.max(0, Math.min(255, Math.round((gray[i]! - lo) * scale)));
  return out;
}

/**
 * Output size (PRD 7.1 step 4): receipt about 640 px wide, never upscaled (DeepSeek upscales small
 * images anyway, so that would only cost bytes), and at most ~1300×1300 pixels in total.
 */
export function targetSize(width: number, height: number, opts: { width?: number; maxPixels?: number } = {}): { width: number; height: number } {
  const wanted = opts.width ?? 640;
  const maxPixels = opts.maxPixels ?? 1300 * 1300;
  let scale = Math.min(1, wanted / width);
  if (width * scale * height * scale > maxPixels) scale = Math.sqrt(maxPixels / (width * height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
