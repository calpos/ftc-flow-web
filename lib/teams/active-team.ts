import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { isAuthGateEnabled } from "@/lib/auth/gate";
import { checkSession } from "@/lib/auth/session";
import type { TeamRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { ActiveTeam, ActiveTeamContext, TeamMembership } from "@/lib/teams/types";

/**
 * The team the user last picked. Only ever a hint: it is matched against the
 * user's memberships on every read, so a stale or forged value just falls
 * back to the earliest-joined team.
 */
export const ACTIVE_TEAM_COOKIE = "ftcflow_team";

// Upper bound on the team queries, same as the session check's.
const QUERY_TIMEOUT_MS = 3000;

const TEAM_ROLES: readonly string[] = ["owner", "admin", "member"] satisfies TeamRole[];

function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === "string" && TEAM_ROLES.includes(value);
}

// The embed is typed non-null, but RLS or a schema change could still hand
// back null or a partial row, so it is checked before it reaches the client.
function isActiveTeam(value: unknown): value is ActiveTeam {
  if (typeof value !== "object" || value === null) return false;
  const team = value as Record<string, unknown>;
  return (
    typeof team.id === "string" &&
    typeof team.name === "string" &&
    typeof team.join_code === "string" &&
    (team.team_number === null || typeof team.team_number === "number")
  );
}

// Only the code: messages and details can carry SQL and internal hints.
function logFailure(error: unknown): void {
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code || "none"
      : "none";
  console.error(`[active-team] team context query failed (code: ${code})`);
}

async function loadActiveTeamContext(): Promise<ActiveTeamContext | null> {
  // Before any cookies() call, so /beta stays static in local demo mode.
  if (!isAuthGateEnabled()) return null;

  // Signed out and unknown (timeout, outage) both give null. An unknown check
  // says nothing about the user's teams, so it must never read as "no teams",
  // which would send a signed-in user to onboarding.
  const check = await checkSession();
  if (check.status !== "user") return null;
  const userId = check.user.id;

  // Aborted on timeout, so a late request (or a token refresh behind it)
  // stops instead of finishing after the render has moved on.
  const controller = new AbortController();
  const supabase = await createClient({ signal: controller.signal });
  if (!supabase) return null;

  // A race, not just the abort: a token refresh inside a query retries with
  // backoff sleeps that aborting doesn't cut short (see lib/auth/session.ts).
  let timer: ReturnType<typeof setTimeout> | undefined;
  let results;
  try {
    results = await Promise.race([
      Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, first_name, last_name, avatar_url, is_coach, grade")
          .eq("id", userId)
          .maybeSingle(),
        // RLS returns the full roster of every team the user is in, so the
        // filter to the user's own rows is required, not an optimization.
        supabase
          .from("team_members")
          .select("role, title, work_roles, joined_at, team:teams(id, name, team_number, join_code)")
          .eq("user_id", userId)
          .order("joined_at", { ascending: true })
          .order("team_id", { ascending: true }),
      ]),
      new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), QUERY_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    logFailure(error);
    return null;
  } finally {
    clearTimeout(timer);
  }

  if (results === "timeout") {
    controller.abort();
    console.error("[active-team] team context query timed out");
    return null;
  }

  // Any error, including the ones a missing migration gives (42703 undefined
  // column, PGRST200/PGRST202/PGRST204), means "can't tell": null keeps /beta
  // in local mode rather than redirecting on a guess.
  const [profileResult, membersResult] = results;
  const error = profileResult.error ?? membersResult.error;
  if (error) {
    logFailure(error);
    return null;
  }

  // Only the signup trigger creates profile rows (clients have no INSERT
  // grant) and RLS always shows a user their own, so null means the row is
  // missing. Onboarding's update could never fix that, so it is "can't tell".
  const profile = profileResult.data;
  if (!profile) {
    console.error("[active-team] profile row missing");
    return null;
  }

  // A malformed row is an anomaly, not "fewer teams": dropping it silently
  // could leave zero memberships and send the user to onboarding. Any dropped
  // row means "can't tell" instead.
  const memberships: TeamMembership[] = [];
  let dropped = 0;
  for (const row of membersResult.data ?? []) {
    if (!isTeamRole(row.role) || !isActiveTeam(row.team)) {
      dropped += 1;
      continue;
    }
    const { id, name, team_number, join_code } = row.team;
    memberships.push({
      team: { id, name, team_number, join_code },
      role: row.role,
      title: row.title,
      work_roles: row.work_roles,
      joined_at: row.joined_at,
    });
  }

  if (dropped > 0) {
    console.error(`[active-team] dropped ${dropped} malformed membership rows`);
    return null;
  }

  const cookieTeamId = (await cookies()).get(ACTIVE_TEAM_COOKIE)?.value;
  const active =
    memberships.find((membership) => membership.team.id === cookieTeamId) ??
    memberships[0] ??
    null;

  return {
    userId,
    email: check.user.email ?? "",
    profile,
    memberships,
    activeTeam: active ? active.team : null,
    role: active ? active.role : null,
  };
}

/**
 * The signed-in user's profile, teams and active team, verified with Supabase.
 * Null when Supabase is not configured, when nobody is signed in, when the
 * session check can't tell, or when any team query fails: every null means
 * "local mode", never "no teams". Memoized per request. Never throws.
 */
export const getActiveTeamContext = cache(loadActiveTeamContext);
