import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();
  return (await updateSession(request)).response;
}

// The proxy only runs where a session matters. Marketing pages, SEO routes,
// /api/subscribe, static assets and _next must never run it. "/beta/:path*"
// also matches /beta itself (`*` is zero or more segments). /login and the
// rest are future auth routes that don't exist yet.
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
