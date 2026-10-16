// Single source of truth for these rules, shared with the roster UI.
import { canEditMembership } from "@/app/beta/_components/team-admin/permissions";
import { MOCK_MEMBERS } from "@/lib/beta/mocks";
import { updateMembership, updateOwnProfile } from "@/lib/beta/remote/api";
import { getRemoteContext, trackWrite } from "@/lib/beta/remote/context";
import { saveMembers } from "@/lib/beta/storage";
import { saveWithWarning } from "./persist";
import { AppSliceCreator, MembersSlice } from "./types";

// Waits for every write so trackWrite's pending count covers all of them: a
// rollback refetch must not run while one is still in flight.
async function allOrFirstError(writes: Promise<void>[]): Promise<void> {
  const results = await Promise.allSettled(writes);
  const failed = results.find((r) => r.status === "rejected");
  if (failed) throw failed.reason;
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export const createMembersSlice: AppSliceCreator<MembersSlice> = (set, get) => ({
  members: MOCK_MEMBERS,

  updateMember: (updated) => {
    const ctx = getRemoteContext();
    if (ctx === null) {
      set((state) => {
        const members = state.members.map((member) =>
          member.id === updated.id ? updated : member
        );
        saveWithWarning("members", saveMembers(members));
        return { members };
      });
      return;
    }

    const { members } = get();
    const prev = members.find((m) => m.id === updated.id);
    if (!prev) return;
    const isSelf = prev.id === ctx.userId;
    const viewer = members.find((m) => m.id === ctx.userId)?.accessRole ?? null;
    const next = { ...prev };
    const writes: Promise<void>[] = [];

    // The DB is the real guard; these gates only skip optimistic edits it
    // would reject, so fields the caller can't write are dropped, not applied.
    if (isSelf) {
      const first = updated.firstName.trim() || prev.firstName;
      const last = updated.lastName.trim() || prev.lastName;
      const isCoach = updated.isCoach;
      const grade = isCoach ? undefined : updated.grade || undefined;
      if (
        first !== prev.firstName ||
        last !== prev.lastName ||
        isCoach !== prev.isCoach ||
        grade !== (prev.grade || undefined)
      ) {
        Object.assign(next, { firstName: first, lastName: last, isCoach, grade });
        // Same shape as saveProfile in app/onboarding/actions.ts.
        writes.push(
          updateOwnProfile({
            first_name: first,
            last_name: last,
            display_name: `${first} ${last}`,
            is_coach: isCoach,
            grade: grade ?? null,
          })
        );
      }
    }

    if (
      canEditMembership(viewer, isSelf) &&
      (updated.teamRole !== prev.teamRole || !sameList(updated.workRoles, prev.workRoles))
    ) {
      next.teamRole = updated.teamRole;
      next.workRoles = updated.workRoles;
      writes.push(
        updateMembership(ctx.teamId, prev.id, {
          title: updated.teamRole,
          work_roles: updated.workRoles,
        })
      );
    }

    if (writes.length === 0) return;
    set((state) => ({
      members: state.members.map((m) => (m.id === prev.id ? next : m)),
    }));
    void trackWrite(allOrFirstError(writes), isSelf ? "your profile" : "the member's roles");
  },
});
