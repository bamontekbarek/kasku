/** Shapes of the scan API, shared by route handlers and the browser. */

export type ScanErrorCode =
  | "unauthorized"
  | "unverified"
  | "invalidImage"
  | "tooLarge"
  | "notFound"
  | "busy"
  | "quota"
  | "too_fast"
  | "ip"
  | "paused"
  | "notReceipt"
  | "failed";

export type UploadResponse = { id: string; cached: boolean } | { error: ScanErrorCode };

export type ScanResponse = { status: "done"; remaining: number | null } | { error: ScanErrorCode; remaining?: number | null; retryAfter?: number | null };

/** Which Scan Gagal screen to show for an API error (SCAN-05, SCAN-06). */
export function errorKind(code: ScanErrorCode | "network"): "notReceipt" | "failed" | "tooFast" | "uploadFailed" | "quota" | "paused" {
  switch (code) {
    case "notReceipt":
      return "notReceipt";
    case "quota":
      return "quota";
    case "busy":
    case "too_fast":
    case "ip":
      return "tooFast";
    case "paused":
      return "paused";
    case "network":
      return "uploadFailed";
    default:
      return "failed";
  }
}
