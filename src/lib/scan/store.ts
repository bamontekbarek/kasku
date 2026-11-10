"use client";

import type { Optimized } from "@/lib/image/browser";

/**
 * Hand-off between the scan screens (camera → crop → processing). Lives in memory for the
 * session, so a failed upload can be retried without taking the photo again.
 */
type ScanState = { source: Blob | null; optimized: Optimized | null; receiptId: string | null };

const state: ScanState = { source: null, optimized: null, receiptId: null };

export const scanStore = {
  get: (): Readonly<ScanState> => state,
  start(source: Blob) {
    state.source = source;
    state.optimized = null;
    state.receiptId = null;
  },
  setOptimized(optimized: Optimized) {
    state.optimized = optimized;
    state.receiptId = null;
  },
  setReceipt(id: string) {
    state.receiptId = id;
  },
  clear() {
    state.source = null;
    state.optimized = null;
    state.receiptId = null;
  },
};
