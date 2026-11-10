import { describe, expect, it } from "vitest";
import { assessQuality, autoLevels, detectPaper, laplacianVariance, otsu, targetSize, toGray } from "./analyze";

/** w×h gray image: dark background with a bright "receipt" that has dark text lines. */
function receiptImage(w: number, h: number, box = { x0: 0.3, y0: 0.1, x1: 0.7, y1: 0.9 }, blur = false) {
  const g = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inside = x >= box.x0 * w && x < box.x1 * w && y >= box.y0 * h && y < box.y1 * h;
      const text = inside && y % 6 < 2 && x % 4 < 3;
      g[y * w + x] = inside ? (text && !blur ? 40 : 230) : 60;
    }
  }
  return g;
}

describe("image analysis (PRD 7.1)", () => {
  it("converts RGBA to gray", () => {
    expect([...toGray([255, 255, 255, 255, 0, 0, 0, 255], 2, 1)]).toEqual([255, 0]);
  });

  it("finds the paper with a small margin", () => {
    const b = detectPaper(receiptImage(200, 200), 200, 200);
    expect(b.x0).toBeCloseTo(0.28, 2);
    expect(b.x1).toBeCloseTo(0.72, 2);
    expect(b.y0).toBeCloseTo(0.08, 2);
    expect(b.y1).toBeCloseTo(0.92, 2);
  });

  it("falls back to the full frame when the paper fills the photo", () => {
    expect(detectPaper(receiptImage(100, 100, { x0: 0, y0: 0, x1: 1, y1: 1 }), 100, 100)).toEqual({ x0: 0, y0: 0, x1: 1, y1: 1 });
  });

  it("flags dark and blurred photos", () => {
    expect(assessQuality(new Uint8Array(100 * 100).fill(30), 100, 100)).toBe("dark");
    const smooth = new Uint8Array(100 * 100).map((_, i) => 150 + ((i % 100) >> 4));
    expect(assessQuality(smooth, 100, 100)).toBe("blur");
    expect(assessQuality(receiptImage(100, 100, { x0: 0, y0: 0, x1: 1, y1: 1 }), 100, 100)).toBe("ok");
    expect(laplacianVariance(receiptImage(100, 100), 100, 100)).toBeGreaterThan(laplacianVariance(receiptImage(100, 100, undefined, true), 100, 100));
  });

  it("thresholds between paper and background", () => {
    const t = otsu(receiptImage(100, 100, undefined, true));
    expect(t).toBeGreaterThanOrEqual(60);
    expect(t).toBeLessThan(230);
  });

  it("stretches faded contrast", () => {
    const faded = new Uint8Array(1000).map((_, i) => 100 + (i % 100));
    const out = autoLevels(faded);
    expect(Math.min(...out)).toBeLessThanOrEqual(5);
    expect(Math.max(...out)).toBeGreaterThanOrEqual(250);
  });

  it("sizes the output to ~640 px wide within the pixel budget", () => {
    expect(targetSize(2000, 3000)).toEqual({ width: 640, height: 960 });
    expect(targetSize(500, 800)).toEqual({ width: 500, height: 800 });
    const long = targetSize(1000, 8000);
    expect(long.width * long.height).toBeLessThanOrEqual(1300 * 1300 + 2000);
    expect(long.width).toBeLessThan(640);
  });
});
