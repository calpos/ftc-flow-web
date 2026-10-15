import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * The one switch for the auth gate. Proxy, layouts, pages, actions and route
 * handlers all ask this, never isSupabaseConfigured directly, so local demo
 * mode (no Supabase) keeps /beta open and the auth routes out of the way.
 */
export function isAuthGateEnabled(): boolean {
  return isSupabaseConfigured;
}

/** Where a signed-in user lands when no safe `next` is given. */
export const DEFAULT_NEXT = "/beta";

// The URL parser strips tab and newline, so "/\t/evil.com" would become
// "//evil.com" (protocol-relative) after parsing.
const CONTROL_RE = /[\u0000-\u001F\u007F]/;

/**
 * Returns `param` as a same-origin path (pathname + search + hash) to
 * redirect to after sign-in, or DEFAULT_NEXT for anything else: absolute and
 * protocol-relative URLs, backslashes (browsers read "/\evil.com" as
 * "//evil.com"), control characters, non-strings. Pure and client-safe.
 */
export function safeNext(param: unknown): string {
  if (
    typeof param !== "string" ||
    !param.startsWith("/") ||
    param.startsWith("//") ||
    param.includes("\\") ||
    CONTROL_RE.test(param)
  ) {
    return DEFAULT_NEXT;
  }
  try {
    const url = new URL(param, "http://n");
    if (url.origin !== "http://n") return DEFAULT_NEXT;
    const path = url.pathname + url.search + url.hash;
    // Dot segments collapse after parsing: "/.//evil.com" becomes "//evil.com".
    if (path.startsWith("//") || path.startsWith("/\\")) return DEFAULT_NEXT;
    return path;
  } catch {
    return DEFAULT_NEXT;
  }
}
