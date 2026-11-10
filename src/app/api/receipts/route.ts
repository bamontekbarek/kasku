import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { UploadResponse } from "@/lib/scan/api";
import { scanConfig } from "@/lib/scan/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const DEDUPE_HOURS = 24;

const json = (body: UploadResponse, status = 200) => NextResponse.json(body, { status });

/**
 * Upload an optimised receipt photo (PRD 7 step 1). The same image from the same user within 24 hours
 * returns the earlier receipt, so it is not read (or charged) twice (PRD 7.1 step 7).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (!user.email_confirmed_at) return json({ error: "unverified" }, 403);

  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof Blob) || !TYPES[file.type]) return json({ error: "invalidImage" }, 400);
  if (file.size > scanConfig().maxBytes) return json({ error: "tooLarge" }, 413);

  const dim = (name: string) => {
    const n = Number(form?.get(name));
    return Number.isInteger(n) && n > 0 && n < 20000 ? n : null;
  };

  const bytes = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(bytes).digest("hex");
  const admin = createAdminClient();

  const since = new Date(Date.now() - DEDUPE_HOURS * 3600_000).toISOString();
  const { data: earlier } = await admin
    .from("receipts")
    .select("id")
    .eq("user_id", user.id)
    .eq("image_hash", hash)
    .eq("status", "done")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (earlier) return json({ id: earlier.id, cached: true });

  const id = randomUUID();
  const path = `${user.id}/${id}.${TYPES[file.type]}`;
  const upload = await admin.storage.from("receipts").upload(path, bytes, { contentType: file.type, upsert: false });
  if (upload.error) {
    console.error("receipt upload failed", upload.error.message);
    return json({ error: "failed" }, 502);
  }

  const { error } = await admin.from("receipts").insert({
    id,
    user_id: user.id,
    storage_path: path,
    image_bytes: file.size,
    image_width: dim("width"),
    image_height: dim("height"),
    image_hash: hash,
  });
  if (error) {
    console.error("receipt insert failed", error.code, error.message);
    await admin.storage.from("receipts").remove([path]);
    return json({ error: "failed" }, 500);
  }

  return json({ id, cached: false });
}
