import { NextResponse, type NextRequest } from "next/server";
import { hasDemoCookie } from "@/lib/auth/demo";
import { isAuthGateEnabled, safeNext } from "@/lib/auth/gate";
import { updateSession } from "@/lib/supabase/proxy";

function isAuthRoute(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/")
  );
}

function isBeta(pathname: string): boolean {
  return pathname === "/beta" || pathname.startsWith("/beta/");
}

function isSafeMethod(request: NextRequest): boolean {
  return request.method === "GET" || request.method === "HEAD";
}

// A redirect replaces the pass-through response from updateSession, so it must
// carry that response's refreshed auth cookies and no-cache headers, or the
// browser falls out of sync with the server (see lib/supabase/proxy.ts).
function redirectWith(response: NextResponse, url: URL): NextResponse {
  const redirect = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(header);
    if (value !== null) redirect.headers.set(header, value);
  }
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Local demo mode: /beta is open and there is nothing to sign into. 303 for
  // a POST (e.g. /auth/signout) so it isn't replayed as a POST to /beta.
  if (!isAuthGateEnabled()) {
    if (!isAuthRoute(pathname)) return NextResponse.next();
    const status = isSafeMethod(request) ? 307 : 303;
    return NextResponse.redirect(new URL("/beta", request.url), status);
  }

  // A timed-out session check (3s) yields user null, so during a Supabase
  // stall a signed-in user can be bounced to /login. It cannot loop: /login
  // only redirects onward when the check does find a user, and the /beta
  // layout fails open when its own check can't reach Supabase.
  const { response, user } = await updateSession(request);

  if (isBeta(pathname) && !user && !hasDemoCookie(request.cookies)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return redirectWith(response, url);
  }

  // GET/HEAD only: a server action on /login is a POST and must reach it.
  if (pathname === "/login" && user && isSafeMethod(request)) {
    const next = safeNext(request.nextUrl.searchParams.get("next"));
    return redirectWith(response, new URL(next, request.url));
  }

  return response;
}

// The proxy only runs where a session matters. Marketing pages, SEO routes,
// /api/subscribe, static assets and _next must never run it. "/beta/:path*"
// also matches /beta itself (`*` is zero or more segments).
export const config = {
  matcher: [
    "/beta/:path*",
    "/login",
    "/onboarding/:path*",
    "/auth/:path*",
    "/forgot-password",
    "/reset-password",
  ],
};
