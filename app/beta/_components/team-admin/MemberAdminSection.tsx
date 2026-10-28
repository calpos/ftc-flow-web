"use client";

import { useRouter } from "next/navigation";
import type { TeamMember } from "@/lib/beta/types";
import { removeMember, setMemberRole } from "@/lib/beta/remote/api";
import { refreshWorkspace } from "@/lib/beta/remote/context";
import { useToastStore } from "@/lib/beta/store/toastStore";
import type { TeamRole } from "@/lib/supabase/database.types";
import { Button } from "../ui";
import { leaveTeamRequest } from "./leaveTeam";
import { accessRoleLabel, canLeave, canRemove, roleOptions } from "./permissions";
import { runTeamRpc } from "./teamRpc";
import type { ConfirmRequest } from "./useConfirmAction";
import type { ViewerAccess } from "./useViewerAccess";

const WITH_ARTICLE: Record<TeamRole, string> = {
  owner: "an owner",
  admin: "an admin",
  member: "a member",
};

// The write already succeeded, so a failed refetch only warns.
function warnReload(e: unknown) {
  console.warn("Failed to reload the workspace:", e);
  useToastStore.getState().push("Couldn't reload your team. Refresh the page.");
}

export function MemberAdminSection({
  member,
  isSelf,
  access,
  ask,
}: {
  member: TeamMember;
  isSelf: boolean;
  access: Extract<ViewerAccess, { remote: true }>;
  ask: (r: ConfirmRequest) => void;
}) {
  const router = useRouter();
  const { teamId, userId, team, viewerRole, ownerCount } = access;
  const role = member.accessRole ?? "member";
  const opts = roleOptions(viewerRole, member.accessRole, ownerCount);
  const firstName = member.firstName;

  function changeRole(next: TeamRole) {
    if (next === role) return;
    const steppingDown = isSelf && role === "owner" && next !== "owner";
    ask({
      title: "Change role?",
      body: `Make ${firstName} ${WITH_ARTICLE[next]}?${
        steppingDown ? " You'll no longer be able to change roles." : ""
      }`,
      confirmLabel: "Change role",
      pendingLabel: "Saving…",
      tone: "primary",
      run: async () => {
        await runTeamRpc(setMemberRole(teamId, member.id, next));
        await refreshWorkspace().catch(warnReload);
        // The server context carries the viewer's own role too.
        if (isSelf) router.refresh();
      },
      successToast: "Role updated",
    });
  }

  function remove() {
    ask({
      title: `Remove ${firstName}?`,
      body: "They lose access to this team right away. To rejoin, they'll need the join code.",
      confirmLabel: "Remove",
      pendingLabel: "Removing…",
      tone: "danger",
      run: async () => {
        await runTeamRpc(removeMember(teamId, member.id));
        await refreshWorkspace().catch(warnReload);
      },
      successToast: `Removed ${firstName}`,
    });
  }

  const onlyOwner = isSelf && role === "owner" && ownerCount <= 1;
  const showRemove = canRemove(viewerRole, member.accessRole, isSelf, ownerCount);
  const showLeave = isSelf && canLeave(viewerRole, ownerCount);

  return (
    <div className="px-6 pb-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-fg-dim mb-2">
        Team access
      </p>
      {opts.length > 1 ? (
        <select
          aria-label={`${firstName}'s access role`}
          value={role}
          onChange={(e) => changeRole(e.target.value as TeamRole)}
          className="rounded-md border border-edge bg-raised px-1.5 py-0.5 text-xs text-fg [color-scheme:dark] focus:border-signal focus:outline-none"
        >
          {opts.map((r) => (
            <option key={r} value={r}>
              {accessRoleLabel(r)}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm text-fg-mid">{accessRoleLabel(role)}</p>
      )}
      {onlyOwner ? (
        <p className="mt-2 text-xs text-fg-dim">
          You&apos;re the only owner. Make someone else an owner before changing your role or
          leaving.
        </p>
      ) : null}
      {showRemove || showLeave ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {showRemove ? (
            <Button variant="danger" onClick={remove} className="h-9 px-3">
              Remove from team
            </Button>
          ) : null}
          {showLeave ? (
            <Button
              variant="danger"
              onClick={() => ask(leaveTeamRequest({ teamId, userId, teamName: team.name }))}
              className="h-9 px-3"
            >
              Leave team
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
