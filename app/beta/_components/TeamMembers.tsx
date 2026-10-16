"use client";

import { useMemo, useState } from "react";
import { Plus, Users, X } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import {
  COMMON_TEAM_ROLES,
  COMMON_WORK_ROLES,
  TeamMember,
} from "@/lib/beta/types";
import { Avatar, Card, EmptyState } from "./ui";
import { MemberProfilePanel } from "./MemberProfilePanel";
import { AccessRoleBadge } from "./team-admin/AccessRoleBadge";
import { canEditMembership } from "./team-admin/permissions";
import { useViewerAccess } from "./team-admin/useViewerAccess";

export function TeamMembers() {
  const { members, currentUser, currentUserId, updateMember, tasks, taskItems, polls } = useApp();
  const isCoach = !!currentUser?.isCoach;
  const access = useViewerAccess();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Derived, so role changes show live and the panel closes once the member is removed.
  const selected = members.find((m) => m.id === selectedId) ?? null;
  // The store role only, no server fallback, so this matches membersSlice's gate.
  const storeRole = members.find((m) => m.id === currentUserId)?.accessRole ?? null;

  function rowProps(m: TeamMember) {
    const isSelf = m.id === currentUserId;
    if (access.remote) {
      const canEditTitle = canEditMembership(storeRole, isSelf);
      return {
        isSelf,
        canEditTitle,
        canEditWorkRoles: canEditTitle && !m.isCoach,
        showAccessBadge: true,
      };
    }
    return {
      isSelf,
      canEditTitle: isCoach,
      canEditWorkRoles: isSelf && !m.isCoach,
      showAccessBadge: false,
    };
  }

  const ordered = useMemo(() => {
    const coaches = members.filter((m) => m.isCoach);
    const rest = members.filter((m) => !m.isCoach);
    return [...coaches, ...rest];
  }, [members]);

  if (ordered.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title="No team members"
        subtitle="No members have been added to this team yet."
      />
    );
  }

  return (
    <>
      <Card className="divide-y divide-edge lg:hidden">
        {ordered.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            {...rowProps(m)}
            onUpdate={updateMember}
            onRowClick={setSelectedId}
          />
        ))}
      </Card>
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
        {ordered.map((m) => (
          <Card key={m.id}>
            <MemberRow
              member={m}
              {...rowProps(m)}
              onUpdate={updateMember}
              avatarSize={48}
              onRowClick={setSelectedId}
            />
          </Card>
        ))}
      </div>
      <MemberProfilePanel
        member={selected}
        isSelf={selected?.id === currentUserId}
        tasks={tasks}
        taskItems={taskItems}
        polls={polls}
        currentUserId={currentUserId}
        access={access}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

function MemberRow({
  member,
  isSelf,
  canEditTitle,
  canEditWorkRoles,
  showAccessBadge,
  onUpdate,
  avatarSize = 40,
  onRowClick,
}: {
  member: TeamMember;
  isSelf: boolean;
  canEditTitle: boolean;
  canEditWorkRoles: boolean;
  showAccessBadge: boolean;
  onUpdate: (m: TeamMember) => void;
  avatarSize?: number;
  onRowClick: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const availableRoles = COMMON_WORK_ROLES.filter((r) => !member.workRoles.includes(r));

  function setTeamRole(role: string) {
    onUpdate({ ...member, teamRole: role });
  }
  function addWorkRole(role: string) {
    if (!role || member.workRoles.includes(role)) return;
    onUpdate({ ...member, workRoles: [...member.workRoles, role] });
    setAdding(false);
  }
  function removeWorkRole(role: string) {
    onUpdate({ ...member, workRoles: member.workRoles.filter((r) => r !== role) });
  }

  return (
    <div
      className="flex items-start gap-3 p-4 cursor-pointer hover:bg-raised/50 transition-colors rounded-none"
      onClick={() => onRowClick(member.id)}
    >
      <Avatar member={member} size={avatarSize} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-fg">
            {member.firstName} {member.lastName}
          </span>
          {isSelf ? (
            <span className="rounded bg-signal-dim px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-signal">
              You
            </span>
          ) : null}
          {showAccessBadge ? <AccessRoleBadge role={member.accessRole} /> : null}
        </div>

        {member.isCoach ? (
          <p className="mt-0.5 text-sm text-fg-mid">Coach</p>
        ) : (
          <>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-fg-mid">
              {canEditTitle ? (
                <select
                  value={member.teamRole}
                  onChange={(e) => setTeamRole(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-md border border-edge bg-raised px-1.5 py-0.5 text-xs text-fg [color-scheme:dark] focus:border-signal focus:outline-none"
                >
                  {[...new Set([member.teamRole, ...COMMON_TEAM_ROLES])].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{member.teamRole}</span>
              )}
              {member.grade ? <span className="text-fg-dim">· {member.grade}</span> : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {member.workRoles.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 rounded-md bg-raised px-2 py-0.5 text-xs text-fg-mid"
                >
                  {r}
                  {canEditWorkRoles ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeWorkRole(r); }}
                      aria-label={`Remove ${r}`}
                      className="text-fg-dim hover:text-danger"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                </span>
              ))}
              {canEditWorkRoles ? (
                adding ? (
                  <select
                    autoFocus
                    defaultValue=""
                    onChange={(e) => addWorkRole(e.target.value)}
                    onBlur={() => setAdding(false)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md border border-edge bg-raised px-1.5 py-0.5 text-xs text-fg [color-scheme:dark] focus:border-signal focus:outline-none"
                  >
                    <option value="" disabled>
                      Add role…
                    </option>
                    {availableRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setAdding(true); }}
                    className="inline-flex items-center gap-1 rounded-md border border-dashed border-edge px-2 py-0.5 text-xs text-fg-dim hover:border-signal-dim hover:text-fg"
                  >
                    <Plus className="h-3 w-3" /> Role
                  </button>
                )
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
