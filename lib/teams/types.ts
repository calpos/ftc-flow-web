/**
 * The signed-in user's teams, as the server resolves them for /beta. Pure and
 * client-safe (no server imports): lib/teams/active-team.ts builds these on
 * the server and lib/beta/ActiveTeamProvider.tsx hands them to the client, so
 * every field must stay serializable.
 */

import type { ProfileRow, TeamRole, TeamRow } from "@/lib/supabase/database.types";

export type ActiveTeam = Pick<TeamRow, "id" | "name" | "team_number" | "join_code">;

export type TeamMembership = {
  team: ActiveTeam;
  role: TeamRole;
  title: string | null;
  work_roles: string[];
  joined_at: string;
};

export type ActiveTeamProfile = Pick<
  ProfileRow,
  "id" | "display_name" | "first_name" | "last_name" | "avatar_url" | "is_coach" | "grade"
>;

export type ActiveTeamContext = {
  userId: string;
  email: string;
  /** Always present: a missing profile row makes the whole context null. */
  profile: ActiveTeamProfile;
  /** Earliest-joined first. */
  memberships: TeamMembership[];
  /** The membership the server picked from the team cookie; null when there are none. */
  activeTeam: ActiveTeam | null;
  role: TeamRole | null;
};

/** "Team 1234 · Name", or just the name for a team without a number. */
export function teamLabel(team: Pick<ActiveTeam, "name" | "team_number">): string {
  return team.team_number === null ? team.name : `Team ${team.team_number} · ${team.name}`;
}

function isBlank(value: string | null): boolean {
  return value === null || value.trim() === "";
}

/**
 * True until the user has a first and last name and belongs to a team. The
 * /beta layout redirects to /onboarding on it. /onboarding (a sibling task)
 * must use this same predicate to decide it is finished, or the two redirect
 * into each other in a loop.
 */
export function needsOnboarding(ctx: ActiveTeamContext): boolean {
  const { profile } = ctx;
  return (
    isBlank(profile.first_name) || isBlank(profile.last_name) || ctx.memberships.length === 0
  );
}
