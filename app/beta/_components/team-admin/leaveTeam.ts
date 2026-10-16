import { removeMember } from "@/lib/beta/remote/api";
import type { ConfirmRequest } from "./useConfirmAction";

/** last_owner surfaces as "Make someone else an owner first." via remoteErrorMessage. */
export function leaveTeamRequest({
  teamId,
  userId,
  teamName,
}: {
  teamId: string;
  userId: string;
  teamName: string;
}): ConfirmRequest {
  return {
    title: `Leave ${teamName}?`,
    body: "You'll lose access to this team's projects, tasks and polls. To come back, you'll need its join code.",
    confirmLabel: "Leave team",
    pendingLabel: "Leaving…",
    tone: "danger",
    keepPendingOnSuccess: true,
    run: async () => {
      await removeMember(teamId, userId);
      // A full navigation, so the server re-resolves memberships and picks the
      // next team or /onboarding (the team cookie is only a hint).
      window.location.assign("/beta");
    },
  };
}
