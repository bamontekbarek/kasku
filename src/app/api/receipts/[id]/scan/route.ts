import { NextResponse } from "next/server";
import { scanReceipt } from "@/lib/ai/scanReceipt";
import { getAccount } from "@/lib/auth/account";
import { todayIn, zonedToIso } from "@/lib/expenses/dates";
import type { ScanResponse } from "@/lib/scan/api";
import { estimateCost, scanConfig } from "@/lib/scan/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// 30 s per AI attempt, one retry, plus upload/download.
export const maxDuration = 90;

type Quota = { ok: boolean; reason: "busy" | "quota" | "too_fast" | "ip" | null; remaining: number | null; retry_after: number | null };

const json = (body: ScanResponse, status = 200, retryAfter?: number | null) =>
  NextResponse.json(body, { status, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined });

function clientIp(request: Request): string | null {
  return request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

/**
 * PRD 7 steps 2–6: check session, ownership and quota on the server, read the photo with the AI,
 * store the raw result. Nothing becomes an expense here; the user confirms on the review screen.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (!user.email_confirmed_at) return json({ error: "unverified" }, 403);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "notFound" }, 404);

  const admin = createAdminClient();
  const { data: receipt } = await admin.from("receipts").select("id, storage_path, status, updated_at").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!receipt) return json({ error: "notFound" }, 404);
  if (receipt.status === "done") return json({ status: "done", remaining: null });
  if (receipt.status === "processing" && Date.parse(receipt.updated_at) > Date.now() - 90_000) return json({ error: "busy", retryAfter: 10 }, 409, 10);

  const cfg = scanConfig();
  const account = await getAccount();

  // Daily spend cap for all users together (PRD 7.2). Manual entry keeps working.
  if (cfg.dailyCostLimitUsd !== null) {
    const since = zonedToIso(todayIn("Asia/Jayapura"), "00:00", "Asia/Jayapura");
    const { data } = await admin.rpc("ai_usage_since", { p_since: since });
    const u = data?.[0];
    const spent = u ? estimateCost({ prompt: Number(u.prompt_tokens), cached: Number(u.cached_tokens), completion: Number(u.completion_tokens) }, cfg.price) : 0;
    if (spent >= cfg.dailyCostLimitUsd) {
      console.error(`[ALERT] scan dimatikan sementara: biaya AI hari ini ±$${spent.toFixed(2)} ≥ batas $${cfg.dailyCostLimitUsd}`);
      return json({ error: "paused" }, 503);
    }
  }

  const { data: q, error: quotaError } = await admin.rpc("consume_scan_quota", {
    p_user: user.id,
    p_ip: clientIp(request),
    p_daily: cfg.dailyLimit,
    p_per_minute: cfg.perMinute,
    p_ip_hourly: cfg.ipHourly,
  });
  if (quotaError) {
    console.error("consume_scan_quota failed", quotaError.message);
    return json({ error: "failed" }, 500);
  }
  const quota = q as unknown as Quota;
  if (!quota.ok) {
    const code = quota.reason ?? "quota";
    return json({ error: code, remaining: quota.remaining, retryAfter: quota.retry_after }, 429, quota.retry_after);
  }

  const finish = (refund: boolean) => admin.rpc("finish_scan", { p_user: user.id, p_refund: refund });
  await admin.from("receipts").update({ status: "processing", error: null }).eq("id", id);

  try {
    const [file, categories] = await Promise.all([
      admin.storage.from("receipts").download(receipt.storage_path),
      admin.from("categories").select("name").eq("user_id", user.id).order("sort_order"),
    ]);
    if (file.error || !file.data) throw new Error(`download: ${file.error?.message}`);

    const outcome = await scanReceipt({
      image: Buffer.from(await file.data.arrayBuffer()),
      mime: file.data.type || "image/jpeg",
      categories: (categories.data ?? []).map((c) => c.name),
      today: todayIn(account.timeZone),
    });

    const usage = {
      ai_model: outcome.model,
      prompt_tokens: outcome.usage.prompt,
      cached_tokens: outcome.usage.cached,
      completion_tokens: outcome.usage.completion,
      scanned_at: new Date().toISOString(),
    };

    if (outcome.ok) {
      await admin.from("receipts").update({ ...usage, status: "done", ai_result: outcome.raw }).eq("id", id);
      await finish(false);
      return json({ status: "done", remaining: quota.remaining });
    }

    if (outcome.reason === "not_receipt") {
      // Counted against the quota on purpose: stops spamming random pictures (PRD 7.2).
      await admin.from("receipts").update({ ...usage, status: "failed", error: "not_receipt", ai_result: outcome.raw }).eq("id", id);
      await finish(false);
      return json({ error: "notReceipt", remaining: quota.remaining }, 422);
    }

    console.error("scan failed", outcome.detail);
    await admin.from("receipts").update({ ...usage, status: "failed", error: outcome.detail.slice(0, 500) }).eq("id", id);
    await finish(true);
    return json({ error: "failed", remaining: quota.remaining === null ? null : quota.remaining + 1 }, 502);
  } catch (error) {
    console.error("scan crashed", error);
    await admin.from("receipts").update({ status: "failed", error: String(error).slice(0, 500) }).eq("id", id);
    await finish(true);
    return json({ error: "failed" }, 500);
  }
}
