/** Scan limits (PRD 7.2). All overridable through env so they change without a code change. */

function int(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function num(name: string, fallback: number | null): number | null {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function scanConfig() {
  return {
    dailyLimit: int("SCAN_DAILY_LIMIT", 20),
    perMinute: int("SCAN_PER_MINUTE", 3),
    ipHourly: int("SCAN_IP_HOURLY", 30),
    maxBytes: int("SCAN_MAX_BYTES", 2 * 1024 * 1024),
    /** Daily AI spend cap for all users together, in USD. Unset = no cap. */
    dailyCostLimitUsd: num("AI_DAILY_COST_LIMIT_USD", null),
    /** USD per 1M tokens (deepseek-flash peak prices, Nov 2026). */
    price: {
      input: num("AI_PRICE_INPUT_PER_M", 0.3)!,
      cached: num("AI_PRICE_CACHED_PER_M", 0.006)!,
      output: num("AI_PRICE_OUTPUT_PER_M", 1.2)!,
    },
  };
}

export const SCAN_DAILY_LIMIT_DEFAULT = 20;

/** Estimated USD for a token count. */
export function estimateCost(
  usage: { prompt: number; cached: number; completion: number },
  price: { input: number; cached: number; output: number },
): number {
  const uncached = Math.max(usage.prompt - usage.cached, 0);
  return (uncached * price.input + usage.cached * price.cached + usage.completion * price.output) / 1_000_000;
}
