/**
 * The created screen, kept in sessionStorage so a reload (or a server
 * re-render that loses the flow's state) shows the join code again instead
 * of the create form, which would invite a second team. Client-only: every
 * read and write is guarded, since storage can be missing or throw.
 */

import type { CreatedTeam } from "./types";

const KEY = "ftcflow:onboarding:created";
/** Past this, the team is long set up and the form is the right screen again. */
const MAX_AGE_MS = 30 * 60 * 1000;

type SavedTeam = CreatedTeam & { userId: string; savedAt: number };

/** What a stored value means for this user: a team to show, or a value to clear. */
export type SavedTeamCheck = { team: CreatedTeam | null; stale: boolean };

const NOTHING: SavedTeamCheck = { team: null, stale: false };
const STALE: SavedTeamCheck = { team: null, stale: true };

export function saveCreatedTeam(userId: string, team: CreatedTeam): void {
  const saved: SavedTeam = { ...team, userId, savedAt: Date.now() };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Unavailable or full: only a reload's recovery is lost.
  }
}

export function clearSavedTeam(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear if storage can't be reached.
  }
}

/** Stands in for a saved team past its age: time is part of the stored value. */
const EXPIRED = "expired";

/**
 * The stored string, EXPIRED once it is older than 30 minutes, or null. A
 * primitive, so it is a stable useSyncExternalStore snapshot, and the clock
 * is read here rather than during render.
 */
export function savedTeamSnapshot(): string | null {
  let raw: string | null;
  try {
    raw = window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  const saved = parse(raw);
  if (!saved) return raw;
  const age = Date.now() - saved.savedAt;
  // A negative age means the clock moved, so it can't be trusted either.
  return age > MAX_AGE_MS || age < -MAX_AGE_MS ? EXPIRED : raw;
}

function parse(raw: string): SavedTeam | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const saved = value as Record<string, unknown>;
  if (
    typeof saved.userId !== "string" ||
    saved.userId === "" ||
    typeof saved.teamId !== "string" ||
    saved.teamId === "" ||
    typeof saved.name !== "string" ||
    saved.name === "" ||
    !(saved.joinCode === null || typeof saved.joinCode === "string") ||
    typeof saved.savedAt !== "number" ||
    !Number.isFinite(saved.savedAt)
  ) {
    return null;
  }
  return {
    userId: saved.userId,
    teamId: saved.teamId,
    name: saved.name,
    joinCode: saved.joinCode === "" ? null : saved.joinCode,
    savedAt: saved.savedAt,
  };
}

/**
 * The saved team, if `snapshot` (from savedTeamSnapshot) belongs to `userId`
 * and is one of `teamIds`, the user's memberships as the server just read
 * them. Anything else stored is stale and should be cleared.
 */
export function checkSavedTeam(
  snapshot: string | null,
  userId: string,
  teamIds: readonly string[],
): SavedTeamCheck {
  if (snapshot === null) return NOTHING;
  const saved = snapshot === EXPIRED ? null : parse(snapshot);
  if (!saved || saved.userId !== userId || !teamIds.includes(saved.teamId)) return STALE;
  return { team: { teamId: saved.teamId, name: saved.name, joinCode: saved.joinCode }, stale: false };
}
