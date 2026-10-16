import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { clearDemoCookie } from "@/lib/auth/demo";
import { isAuthGateEnabled, safeNext } from "@/lib/auth/gate";
import { createClient } from "@/lib/supabase/server";

// Landing point for the links in Supabase auth emails (confirm signup, reset
// password): trades the one-time code for a session, then continues to `next`.
export async function GET(request: NextRequest) {
  if (!isAuthGateEnabled()) {
    return NextResponse.redirect(new URL("/beta", request.url));
  }

  const { searchParams } = request.nextUrl;
  const linkError = NextResponse.redirect(new URL("/login?error=link", request.url));
  const code = searchParams.get("code");
  if (
    !code ||
    searchParams.has("error") ||
    searchParams.has("error_code") ||
    searchParams.has("error_description")
  ) {
    return linkError;
  }

  const supabase = await createClient();
  if (!supabase) return linkError;

  let failed = false;
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = Boolean(error);
  } catch {
    failed = true;
  }
  if (failed) return linkError;

  // Cookies set through cookies() (this and the session the exchange just
  // stored) are merged into whatever response the handler returns.
  clearDemoCookie(await cookies());
  return NextResponse.redirect(new URL(safeNext(searchParams.get("next")), request.url));
}
