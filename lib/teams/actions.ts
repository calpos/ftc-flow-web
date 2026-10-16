"use server";

import { cookies, headers } from "next/headers";
import { checkSession } from "@/lib/auth/session";
import { friendlyError } from "@/lib/supabase/errors";
import { ACTIVE_TEAM_COOKIE, getActiveTeamContext } from "@/lib/teams/active-team";

type SetActiveTeamResult = { ok: true } | { ok: false; error: string };

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// A Server Action has no request URL to read the protocol from, so this uses
// the Origin of the POST (same-origin POSTs always send it) or the first
// x-forwarded-proto value, the same two signals requestOrigin() in
// app/(auth)/actions.ts reads.
async function isSecureRequest(): Promise<boolean> {
  const headerList = await headers();
  const forwardedProto = headerList.get("x-forwarded-proto")?.split(",")[0].trim();
  return headerList.get("origin")?.startsWith("https:") === true || forwardedProto === "https";
}

/**
 * Makes `teamId` the signed-in user's active team for /beta. Membership is
 * re-verified here on the server; the cookie is only a hint that
 * active-team.ts re-validates against the user's memberships on every read.
 * The client reloads afterwards so every server-resolved value picks it up.
 */
export async function setActiveTeam(teamId: string): Promise<SetActiveTeamResult> {
  // Client input: the type is not enforced at runtime.
  if (typeof teamId !== "string" || teamId === "") {
    return { ok: false, error: friendlyError({ code: "P0001", message: "not_team_member" }) };
  }

  const ctx = await getActiveTeamContext();
  if (!ctx) {
    // Null is signed out, but also a timeout or a failed query, which must not
    // read as "sign in": only a definitive "none" gets that copy.
    const signedOut = (await checkSession()).status === "none";
    return {
      ok: false,
      error: friendlyError(signedOut ? { code: "P0001", message: "not_authenticated" } : null),
    };
  }
  if (!ctx.memberships.some((membership) => membership.team.id === teamId)) {
    return { ok: false, error: friendlyError({ code: "P0001", message: "not_team_member" }) };
  }

  (await cookies()).set(ACTIVE_TEAM_COOKIE, teamId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
    secure: await isSecureRequest(),
  });
  return { ok: true };
}
