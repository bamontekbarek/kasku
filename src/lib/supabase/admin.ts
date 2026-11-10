import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role client: bypasses RLS. Server only, and only for what users must not do themselves
 * (upload receipt photos, write scan status and quota). Always scope queries by the verified user id.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi (lihat .env.example).");
  return createClient<Database>(supabasePublicEnv().url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
