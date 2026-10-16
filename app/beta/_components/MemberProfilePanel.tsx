"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  TeamMember,
  TeamTask,
  Task,
  Poll,
  getProjectProgress,
  getTaskItemProgress,
  getProgressLabel,
  getProgressLabelColor,
  formatDateDisplay,
  isPollEffectivelyOpen,
  getUserPollVotes,
} from "@/lib/beta/types";
import { Avatar, ProgressBar, StageBadge } from "@/app/beta/_components/ui";
import { AccessRoleBadge } from "./team-admin/AccessRoleBadge";
import { MemberAdminSection } from "./team-admin/MemberAdminSection";
import { useConfirmAction } from "./team-admin/useConfirmAction";
import type { ViewerAccess } from "./team-admin/useViewerAccess";

interface Props {
  member: TeamMember | null;
  isSelf: boolean;
  tasks: TeamTask[];
  taskItems: Task[];
  polls: Poll[];
  currentUserId: string;
  /** Absent in local mode. */
  access?: ViewerAccess;
  onClose: () => void;
}

export function MemberProfilePanel({
  member,
  isSelf,
  tasks,
  taskItems,
  polls,
  access,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const confirm = useConfirmAction();
  const [lastMember, setLastMember] = useState<TeamMember | null>(member);

  // Update during render (React's recommended pattern for derived state from props).
  // When member becomes non-null, capture it so the closing animation still has content.
  if (member !== null && member !== lastMember) {
    setLastMember(member);
  }

  const open = member !== null;
  const displayMember = member ?? lastMember;

  // Refs, so the effect below runs only when the panel opens: onClose is a new
  // arrow every render, and refocusing the panel on each store update or dialog
  // close would pull focus off the control the dialog just returned it to.
  const onCloseRef = useRef(onClose);
  const confirmOpenRef = useRef(confirm.open);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
    confirmOpenRef.current = confirm.open;
  });

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      // Both listeners are on document, so without this one Escape would close
      // the confirm dialog and the panel together.
      if (e.key === "Escape" && !confirmOpenRef.current) onCloseRef.current();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const memberProjects = displayMember
    ? tasks.filter((t) => t.assignedMembers.includes(displayMember.id))
    : [];
  const standaloneTasks = displayMember
    ? taskItems.filter(
        (t) => t.parentProjectId === undefined && t.assignedMembers.includes(displayMember.id),
      )
    : [];
  const pendingPolls = displayMember
    ? polls.filter(
        (p) => isPollEffectivelyOpen(p) && getUserPollVotes(p, displayMember.id).length === 0,
      )
    : [];

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-surface border-l border-edge flex flex-col z-50 shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out focus:outline-none ${open ? "translate-x-0" : "translate-x-full"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {displayMember && (
          <>
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start gap-3">
                <Avatar member={displayMember} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-fg">
                      {displayMember.firstName} {displayMember.lastName}
                    </span>
                    {isSelf ? (
                      <span className="rounded bg-signal-dim px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-signal">
                        You
                      </span>
                    ) : null}
                    {access?.remote ? <AccessRoleBadge role={displayMember.accessRole} /> : null}
                  </div>
                  {displayMember.isCoach ? (
                    <p className="mt-0.5 text-sm text-fg-mid">Coach</p>
                  ) : (
                    <p className="mt-0.5 text-sm text-fg-mid">
                      {displayMember.teamRole}
                      {displayMember.grade ? (
                        <span className="text-fg-dim"> · {displayMember.grade}</span>
                      ) : null}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close panel"
                  className="shrink-0 text-fg-dim hover:text-fg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Work roles */}
            {!displayMember.isCoach && (
              <div className="px-6 pb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-fg-dim mb-2">
                  Roles
                </p>
                {displayMember.workRoles.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {displayMember.workRoles.map((r) => (
                      <span
                        key={r}
                        className="rounded-md bg-raised px-2 py-0.5 text-xs text-fg-mid"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-fg-dim">No roles assigned.</p>
                )}
              </div>
            )}

            {access?.remote && (
              <MemberAdminSection
                member={displayMember}
                isSelf={isSelf}
                access={access}
                ask={confirm.ask}
              />
            )}

            {/* Projects & standalone tasks */}
            <div className="px-6 pb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-dim mb-2">
                Assignments
              </p>
              {memberProjects.length === 0 && standaloneTasks.length === 0 ? (
                <p className="text-sm text-fg-dim">No assignments.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {memberProjects.map((project) => {
                    const pct = getProjectProgress(project, taskItems);
                    return (
                      <div key={project.id} className="rounded-lg bg-raised p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-fg truncate">
                            {project.name}
                          </span>
                          <StageBadge progress={pct} />
                        </div>
                        <ProgressBar value={pct} color={project.color} />
                      </div>
                    );
                  })}
                  {standaloneTasks.map((t) => {
                    const pct = getTaskItemProgress(t);
                    const done = pct === 100;
                    const label = getProgressLabel(pct);
                    const labelColor = getProgressLabelColor(label);
                    return (
                      <div key={t.id} className="flex items-center gap-2 rounded-lg bg-raised p-3">
                        <span
                          className={`text-sm flex-1 truncate ${done ? "text-fg-dim line-through" : "text-fg"}`}
                        >
                          {t.title}
                        </span>
                        {t.dueDate ? (
                          <span className="text-xs text-fg-dim shrink-0">
                            {formatDateDisplay(t.dueDate)}
                          </span>
                        ) : null}
                        {done ? (
                          <span className="shrink-0 text-xs font-medium" style={{ color: labelColor }}>
                            ✓
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending polls */}
            {pendingPolls.length > 0 && (
              <div className="px-6 pb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-fg-dim mb-2">
                  Awaiting Vote
                </p>
                <div className="flex flex-col gap-2">
                  {pendingPolls.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-lg bg-raised p-3">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-sm text-fg truncate">{p.question}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* After the panel, not inside it: its transform would become the fixed
          dialog's containing block and its overflow-y-auto would clip it.
          Rendering later also stacks it above the same-z-50 panel. */}
      {confirm.dialog}
    </>
  );
}
