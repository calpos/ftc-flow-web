"use client";

import { useActiveTeam } from "@/lib/beta/ActiveTeamProvider";
import { useAppStore } from "@/lib/beta/store/appStore";
import type { TeamRole } from "@/lib/supabase/database.types";
import type { ActiveTeam } from "@/lib/teams/types";
import { countOwners, resolveViewerRole } from "./permissions";

export type ViewerAccess =
  | { remote: false }
  | {
      remote: true;
      teamId: string;
      userId: string;
      team: ActiveTeam;
      viewerRole: TeamRole | null;
      ownerCount: number;
    };

/**
 * The viewer's standing on the active team. The store's roster wins over the
 * server context, so a role change shows before the next page load.
 */
export function useViewerAccess(): ViewerAccess {
  const active = useActiveTeam();
  const members = useAppStore((s) => s.members);
  const currentUserId = useAppStore((s) => s.currentUserId);

  if (active.mode !== "remote") return { remote: false };
  return {
    remote: true,
    teamId: active.team.id,
    userId: active.userId,
    team: active.team,
    viewerRole: resolveViewerRole(members, currentUserId, active.role),
    ownerCount: countOwners(members),
  };
}
