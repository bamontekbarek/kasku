"use client";

import type { Optimized } from "@/lib/image/browser";
import type { ScanErrorCode, ScanResponse, UploadResponse } from "./api";

export type ApiFailure = { error: ScanErrorCode | "network"; remaining?: number | null; retryAfter?: number | null };

async function call<T>(input: string, init: RequestInit): Promise<T | ApiFailure> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    return { error: "network" };
  }
  try {
    return (await res.json()) as T;
  } catch {
    return { error: res.ok ? "failed" : "network" };
  }
}

/** Step 1 of SCAN-03: send the optimised photo. */
export function uploadReceipt(photo: Optimized, signal: AbortSignal) {
  const body = new FormData();
  body.set("image", photo.blob, "receipt.jpg");
  body.set("width", String(photo.width));
  body.set("height", String(photo.height));
  return call<UploadResponse>("/api/receipts", { method: "POST", body, signal });
}

/** Steps 2–4 of SCAN-03: AI reads the photo on the server. */
export function scanUploaded(id: string, signal: AbortSignal) {
  return call<ScanResponse>(`/api/receipts/${id}/scan`, { method: "POST", signal });
}
