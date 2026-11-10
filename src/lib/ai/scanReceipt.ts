import "server-only";
import OpenAI from "openai";
import { MAX_ITEMS, rawReceiptSchema, type RawReceipt } from "./receipt";

/**
 * The only place that talks to the AI provider (PRD 7). Model name, key and base URL come from env,
 * so a renamed/retired model or a different OpenAI-compatible provider is an env change, not a code change.
 */

export type ScanUsage = { prompt: number; cached: number; completion: number };

export type ScanOutcome =
  | { ok: true; raw: RawReceipt; usage: ScanUsage; model: string }
  | { ok: false; reason: "not_receipt"; raw: RawReceipt; usage: ScanUsage; model: string }
  | { ok: false; reason: "failed"; detail: string; usage: ScanUsage; model: string };

// Short, fixed and first: an identical prefix can hit DeepSeek's context cache (cheaper input).
const SYSTEM_PROMPT = `You read shopping receipts (mostly Indonesian) from a photo. Reply with minified json only, no markdown.
Shape: {"is_receipt":true,"merchant":{"value":"Toko Maju Jaya","confidence":0.95},"date":{"value":"2026-11-06","confidence":0.9},"time":{"value":"19:42","confidence":0.9},"total":{"value":187400,"confidence":0.97},"payment_method":{"value":"debit","confidence":0.8},"category":{"value":"Belanja Harian","confidence":0.85},"items":[{"name":"Beras 5 kg","price":74500,"confidence":0.93}]}
Rules:
- Money is whole Rupiah as an integer without separators (Rp 187.400 -> 187400).
- total = final amount paid, after discounts and tax.
- date YYYY-MM-DD, time HH:MM (24h). Use null for anything not visible.
- payment_method: one of cash, debit, qris, credit_card, ewallet, or null.
- category: exactly one name from the user's category list.
- items: purchased lines only (name as printed, price = line total), at most ${MAX_ITEMS}. Skip subtotal, tax, discount, change and payment lines.
- confidence 0-1 per field: how sure you are it was read correctly.
- If the photo is not a receipt or bill, reply {"is_receipt":false}.`;

const STRICT_HINT = "Your previous reply was not valid json. Reply with one json object only, exactly in the shape given.";

function client() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY belum diisi.");
  return new OpenAI({
    apiKey,
    baseURL: process.env.AI_BASE_URL || "https://api.deepseek.com",
    timeout: 30_000,
    // One retry for network errors, 408/409/429 and 5xx (PRD 7: coba ulang sekali).
    maxRetries: 1,
  });
}

function usageOf(u: OpenAI.Completions.CompletionUsage | undefined): ScanUsage {
  const extra = (u ?? {}) as { prompt_cache_hit_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } };
  return {
    prompt: u?.prompt_tokens ?? 0,
    cached: extra.prompt_cache_hit_tokens ?? extra.prompt_tokens_details?.cached_tokens ?? 0,
    completion: u?.completion_tokens ?? 0,
  };
}

function addUsage(a: ScanUsage, b: ScanUsage): ScanUsage {
  return { prompt: a.prompt + b.prompt, cached: a.cached + b.cached, completion: a.completion + b.completion };
}

function parse(content: string | null | undefined): RawReceipt | null {
  if (!content?.trim()) return null; // DeepSeek JSON mode can return only spaces.
  try {
    const json: unknown = JSON.parse(content.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
    const r = rawReceiptSchema.safeParse(json);
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

/** Read one optimised receipt image. Never throws for provider problems; returns `failed` instead. */
export async function scanReceipt(input: { image: Buffer; mime: string; categories: string[]; today: string }): Promise<ScanOutcome> {
  const model = process.env.AI_RECEIPT_MODEL || "deepseek-flash";
  const detail = (process.env.AI_IMAGE_DETAIL || "original") as "low" | "high" | "auto";
  const ai = client();
  const dataUrl = `data:${input.mime};base64,${input.image.toString("base64")}`;
  let usage: ScanUsage = { prompt: 0, cached: 0, completion: 0 };

  for (let attempt = 0; attempt < 2; attempt++) {
    const text = `Categories: ${input.categories.join(" | ")}\nToday: ${input.today}${attempt > 0 ? `\n${STRICT_HINT}` : ""}`;
    let content: string | null | undefined;
    try {
      const res = await ai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text },
              { type: "image_url", image_url: { url: dataUrl, detail } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
        temperature: 0,
        // DeepSeek: thinking is on by default and billed as output; reading a receipt doesn't need it.
        ...({ thinking: { type: "disabled" } } as object),
      });
      usage = addUsage(usage, usageOf(res.usage));
      content = res.choices[0]?.message?.content;
    } catch (error) {
      const detail = error instanceof OpenAI.APIError ? `${error.status ?? "network"} ${error.message}` : String(error);
      return { ok: false, reason: "failed", detail, usage, model };
    }

    const raw = parse(content);
    if (!raw) continue; // invalid JSON → one more try with a stricter instruction
    if (!raw.is_receipt) return { ok: false, reason: "not_receipt", raw, usage, model };
    return { ok: true, raw, usage, model };
  }

  return { ok: false, reason: "failed", detail: "invalid json", usage, model };
}
