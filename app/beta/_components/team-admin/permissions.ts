import type { TeamMember } from "@/lib/beta/types";
import type { TeamRole } from "@/lib/supabase/database.types";

/**
 * Which roster controls a viewer sees. The database enforces all of this (RLS
 * on team_members/profiles plus the set_member_role / remove_member /
 * regenerate_join_code RPCs). These helpers only decide which controls to
 * show, so the server can still refuse a stale view.
 */

type Role = TeamRole | null | undefined;

/** An undefined accessRole is not an owner. */
export function countOwners(members: readonly Pick<TeamMember, "accessRole">[]): number {
  return members.filter((m) => m.accessRole === "owner").length;
}

/** The store member's accessRole wins; anything missing uses `fallback`. */
export function resolveViewerRole(
  members: readonly Pick<TeamMember, "id" | "accessRole">[],
  currentUserId: string | null,
  fallback: TeamRole | null,
): TeamRole | null {
  if (currentUserId === null) return fallback;
  return members.find((m) => m.id === currentUserId)?.accessRole ?? fallback;
}

export function isManager(role: Role): boolean {
  return role === "owner" || role === "admin";
}

export function canChangeRoles(viewer: Role): boolean {
  return viewer === "owner";
}

export function roleOptions(
  viewer: Role,
  targetRole: TeamRole | undefined,
  ownerCount: number,
): TeamRole[] {
  if (!canChangeRoles(viewer)) return [];
  // Demoting the last owner would raise last_owner, so it isn't offered.
  if (targetRole === "owner" && ownerCount <= 1) return ["owner"];
  return ["owner", "admin", "member"];
}

/** Self is always false: leaving goes through canLeave. */
export function canRemove(
  viewer: Role,
  targetRole: TeamRole | undefined,
  isSelf: boolean,
  ownerCount: number,
): boolean {
  if (isSelf) return false;
  if (viewer === "owner") return !(targetRole === "owner" && ownerCount <= 1);
  if (viewer === "admin") return targetRole === "member";
  return false;
}

export function canLeave(viewer: Role, ownerCount: number): boolean {
  if (!viewer) return false;
  return !(viewer === "owner" && ownerCount <= 1);
}

/** Title and work roles: self, or a manager for anyone. */
export function canEditMembership(viewer: Role, isSelf: boolean): boolean {
  return isSelf || isManager(viewer);
}

export function canRegenerateJoinCode(viewer: Role): boolean {
  return isManager(viewer);
}

const LABELS = { owner: "Owner", admin: "Admin", member: "Member" } as const satisfies Record<
  TeamRole,
  string
>;

export function accessRoleLabel(role: TeamRole): (typeof LABELS)[TeamRole] {
  return LABELS[role];
}
