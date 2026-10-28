import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfig } from "@/lib/supabase/env";

// Upper bound on the session check, so a Supabase outage can never hang /beta.
const SESSION_CHECK_TIMEOUT_MS = 3000;

/**
 * Refreshes the Supabase auth session for a proxied request and reports who is
 * signed in. Never throws: an outage, network failure or bad config yields
 * `user: null` and a pass-through response, so /beta keeps working.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  const config = getSupabaseConfig();
  if (!config) return { response: NextResponse.next({ request }), user: null };

  let response = NextResponse.next({ request });
  let user: User | null = null;
  // The library passes its no-cache headers only on the first setAll call that
  // carries them, but every call replaces `response`, so remember them and
  // re-apply each time.
  const cacheHeaders: Record<string, string> = {};
  // Aborted when the check times out, so any in-flight or retried request
  // fails immediately instead of hitting the network.
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const supabase = createServerClient<Database>(config.url, config.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Refreshed tokens go on the request, so Server Components rendering
          // this request see them, and on the response, so the browser keeps them.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // No-cache headers: a CDN must never serve one user's session
          // cookies to another user.
          Object.assign(cacheHeaders, headers);
          Object.entries(cacheHeaders).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: init?.signal
              ? AbortSignal.any([init.signal, controller.signal])
              : controller.signal,
          }),
      },
    });

    // Supabase requires getUser() immediately after creating the client: code
    // in between makes random logouts easy to introduce.
    // A race, not just the abort: a failed refresh is retried with backoff
    // sleeps for up to ~30s, and aborting doesn't cut those sleeps short.
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), SESSION_CHECK_TIMEOUT_MS);
      }),
    ]);
    if (result === "timeout") {
      // A timed-out check reports user null without knowing who is signed in.
      // Callers must not treat that as a definitive sign-out (e.g. must not
      // clear cookies on it). Cookies are left as they are, including any a
      // refresh already set before the timeout.
      controller.abort();
    } else if (!result.error) {
      user = result.data.user;
    }
  } catch {
    // Outage, network failure or malformed URL: treat the visitor as signed
    // out rather than break the page.
  } finally {
    clearTimeout(timer);
  }

  // IMPORTANT: return this exact `response` object (the one setAll reassigned).
  // Creating a fresh NextResponse, or copying only its headers, drops the
  // refreshed auth cookies: browser and server fall out of sync and the user
  // is logged out in a loop. A caller that needs a different response (e.g. a
  // redirect) must copy response.cookies onto it.
  return { response, user };
}
