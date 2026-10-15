import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthGateEnabled } from "@/lib/auth/gate";
import { createClient } from "@/lib/supabase/server";

// POST only, so a link prefetch or a crawler can never sign anyone out.
export async function POST(request: NextRequest) {
  if (!isAuthGateEnabled()) {
    return NextResponse.redirect(new URL("/beta", request.url), 303);
  }

  const supabase = await createClient();
  try {
    await supabase?.auth.signOut({ scope: "local" });
  } catch {
    // The cookies are cleared below either way.
  }

  // Expire every Supabase auth cookie (including chunked sb-*-auth-token.N),
  // so a failed network signOut still ends the session in this browser.
  // Names come from the incoming request, not the store signOut just edited.
  // cookies() writes are merged into the returned response.
  const cookieStore = await cookies();
  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-")) cookieStore.set(name, "", { maxAge: 0, path: "/" });
  }

  return NextResponse.redirect(new URL("/login", request.url), 303);
}
