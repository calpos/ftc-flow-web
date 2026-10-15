import { NextResponse, type NextRequest } from "next/server";
import { setDemoCookie } from "@/lib/auth/demo";
import { isAuthGateEnabled } from "@/lib/auth/gate";

// "Explore the demo without an account": marks this browser as a demo
// visitor so the /beta gate lets it in, then sends it there.
export function GET(request: NextRequest) {
  if (!isAuthGateEnabled()) {
    return NextResponse.redirect(new URL("/beta", request.url));
  }

  // Behind a TLS-terminating proxy the request itself arrives over http, so
  // also trust the client's protocol from the first x-forwarded-proto value.
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const secure = request.nextUrl.protocol === "https:" || forwardedProto === "https";

  const response = NextResponse.redirect(new URL("/beta", request.url));
  setDemoCookie(response.cookies, secure);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
