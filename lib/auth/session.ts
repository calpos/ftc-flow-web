import { isAuthApiError, isAuthSessionMissingError, type User } from "@supabase/supabase-js";
import { isAuthGateEnabled } from "@/lib/auth/gate";
import { createClient } from "@/lib/supabase/server";

// Upper bound on the user check, so a Supabase stall can never hang a render.
const USER_CHECK_TIMEOUT_MS = 3000;

/**
 * Outcome of a server-side session check. `none`: definitely signed out.
 * `unknown`: the check timed out or failed for a reason that says nothing
 * about the session (network, 5xx), so callers must not treat it as signed out.
 */
export type SessionCheck =
  | { status: "user"; user: User }
  | { status: "none" }
  | { status: "unknown" };

// Errors that prove there is no valid session: no session cookie, or a 4xx
// from Supabase (invalid or expired JWT, user gone, invalid refresh token).
function isDefinitive(error: unknown): boolean {
  return (
    isAuthSessionMissingError(error) ||
    (isAuthApiError(error) && error.status >= 400 && error.status < 500)
  );
}

/** Verifies the session with Supabase. Never throws. */
export async function checkSession(): Promise<SessionCheck> {
  if (!isAuthGateEnabled()) return { status: "none" };
  const controller = new AbortController();
  const supabase = await createClient({ signal: controller.signal });
  if (!supabase) return { status: "none" };

  // A race, not a plain await: an expired token makes getUser() refresh it,
  // and a failed refresh is retried with backoff for up to ~30s (same reason
  // as lib/supabase/proxy.ts).
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), USER_CHECK_TIMEOUT_MS);
      }),
    ]);
    if (result === "timeout") {
      // Aborting stops a late token refresh: a Server Component can't store
      // the rotated token, so it would be lost.
      controller.abort();
      return { status: "unknown" };
    }
    if (result.error) {
      return isDefinitive(result.error) ? { status: "none" } : { status: "unknown" };
    }
    return { status: "user", user: result.data.user };
  } catch {
    return { status: "unknown" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The signed-in user, verified with Supabase, or null when signed out, in
 * local demo mode, or when the check fails or times out. Never throws.
 */
export async function getCurrentUser(): Promise<User | null> {
  const check = await checkSession();
  return check.status === "user" ? check.user : null;
}
