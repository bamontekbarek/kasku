/**
 * Date helpers that work in the user's time zone (default Asia/Jayapura, WIT) no matter
 * where the code runs (Vercel runs in UTC). Dates are "YYYY-MM-DD", times "HH:MM".
 */

export const DEFAULT_TIME_ZONE = "Asia/Jayapura";

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsIn(timeZone: string, instant: Date): Parts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const out: Record<string, number> = {};
  for (const p of fmt.formatToParts(instant)) if (p.type !== "literal") out[p.type] = Number(p.value);
  return out as Parts;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date + time of an instant in `timeZone`. */
export function localParts(iso: string | Date, timeZone: string): { date: string; time: string } {
  const p = partsIn(timeZone, typeof iso === "string" ? new Date(iso) : iso);
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` };
}

/** Today's date in `timeZone`. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return localParts(now, timeZone).date;
}

/** Minutes `timeZone` is ahead of UTC at `instant`. */
function offsetMinutes(timeZone: string, instant: Date): number {
  const p = partsIn(timeZone, instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

/** Local wall-clock date + time in `timeZone` → UTC ISO string for `timestamptz`. */
export function zonedToIso(date: string, time: string, timeZone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y!, m! - 1, d!, hh!, mm!);
  const first = guess - offsetMinutes(timeZone, new Date(guess)) * 60000;
  // Re-check once so DST transitions land on the right side (no-op for WIT).
  const fixed = guess - offsetMinutes(timeZone, new Date(first)) * 60000;
  return new Date(fixed).toISOString();
}

/**
 * When the form has no time field (manual add): today → now; another day → that day at the
 * current time of day, so new rows still sort sensibly within the day.
 */
export function spentAtFor(date: string, time: string, timeZone: string, now: Date = new Date()): string {
  if (time) return zonedToIso(date, time, timeZone);
  const local = localParts(now, timeZone);
  if (date === local.date) return now.toISOString();
  return zonedToIso(date, local.time, timeZone);
}

/** "2026-11" → UTC bounds [from, to) of that calendar month in `timeZone`. */
export function monthBounds(month: string, timeZone: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y! + 1}-01` : `${y}-${pad(m! + 1)}`;
  return { from: zonedToIso(`${month}-01`, "00:00", timeZone), to: zonedToIso(`${next}-01`, "00:00", timeZone) };
}

/** "YYYY-MM" or null. */
export function parseMonth(value: string | undefined | null): string | null {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  return value;
}

/** The `count` months ending at `month`, newest first ("2026-11", "2026-10", …). */
export function recentMonths(month: string, count: number): string[] {
  const [y, m] = month.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = y! * 12 + (m! - 1) - i;
    out.push(`${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`);
  }
  return out;
}

/** Whole days between two "YYYY-MM-DD" dates (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
