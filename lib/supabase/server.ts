import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfig } from "@/lib/supabase/env";

/**
 * Supabase client for Server Components, Server Functions and Route Handlers.
 * Create one per request. Returns null when Supabase is not configured (local
 * demo mode); every caller must handle that case.
 *
 * `signal` is merged into every request the client makes, so a caller that
 * gives up on a slow check can abort it, including a token refresh still in
 * flight (same approach as lib/supabase/proxy.ts).
 */
export async function createClient(
  options?: { signal?: AbortSignal },
): Promise<SupabaseClient<Database> | null> {
  const config = getSupabaseConfig();
  // Bail before cookies() so an unconfigured call never opts the route into
  // dynamic rendering.
  if (!config) return null;

  const cookieStore = await cookies();
  const signal = options?.signal;
  return createServerClient<Database>(config.url, config.anonKey, {
    ...(signal && {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, {
            ...init,
            signal: init?.signal ? AbortSignal.any([init.signal, signal]) : signal,
          }),
      },
    }),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll throws when called from a Server Component, where cookies
          // are read-only. The proxy refreshes the session, so ignoring it is
          // safe.
        }
      },
    },
  });
}
