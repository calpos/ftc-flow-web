"use client";

import { createContext, ReactNode, useContext, useMemo } from "react";
import type { TeamRole } from "@/lib/supabase/database.types";
import type { ActiveTeam, ActiveTeamContext, TeamMembership } from "@/lib/teams/types";

/**
 * What /beta knows about "who and which team". `remote`: signed in to
 * Supabase with a team. `local`: everything else (Supabase not configured,
 * demo visitor, session check failed, or the team migration not applied), so
 * the app runs on browser-only data with the mock team.
 */
export type ActiveTeamValue =
  | {
      mode: "remote";
      userId: string;
      email: string;
      team: ActiveTeam;
      role: TeamRole;
      memberships: TeamMembership[];
    }
  | {
      mode: "local";
      userId: null;
      email: null;
      team: null;
      role: null;
      /** Always empty. */
      memberships: TeamMembership[];
    };

const LOCAL_VALUE: ActiveTeamValue = {
  mode: "local",
  userId: null,
  email: null,
  team: null,
  role: null,
  memberships: [],
};

const ActiveTeamReactContext = createContext<ActiveTeamValue>(LOCAL_VALUE);

/**
 * Hands the server-resolved team context (app/beta/layout.tsx) to the client.
 * This is the SINGLE source of truth for remote-vs-local mode and for the
 * active team: workspace sync, the roster, onboarding and every later task
 * read it through useActiveTeam() rather than re-deriving it. The server has
 * already validated the team against the user's memberships, and the client
 * never reads the team cookie. Switch teams only through the setActiveTeam
 * server action followed by a full page reload, so every server-resolved value
 * and the provider's context are rebuilt together.
 */
export function ActiveTeamProvider({
  context,
  children,
}: {
  context: ActiveTeamContext | null;
  children: ReactNode;
}) {
  const value = useMemo<ActiveTeamValue>(() => {
    if (context === null || context.activeTeam === null || context.role === null) {
      return LOCAL_VALUE;
    }
    return {
      mode: "remote",
      userId: context.userId,
      email: context.email,
      team: context.activeTeam,
      role: context.role,
      memberships: context.memberships,
    };
  }, [context]);

  return <ActiveTeamReactContext.Provider value={value}>{children}</ActiveTeamReactContext.Provider>;
}

/** The active team and remote-vs-local mode. See ActiveTeamProvider. */
export function useActiveTeam(): ActiveTeamValue {
  return useContext(ActiveTeamReactContext);
}
