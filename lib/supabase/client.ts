import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfig } from "@/lib/supabase/env";

/**
 * Supabase client for Client Components.
 *
 * Returns null when Supabase is not configured (local demo mode); every caller
 * must handle that case. createBrowserClient already returns a singleton in the
 * browser, so calling this repeatedly is cheap.
 */
export function createClient(): SupabaseClient<Database> | null {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createBrowserClient<Database>(config.url, config.anonKey);
}
