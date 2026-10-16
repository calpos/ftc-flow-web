"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isAuthGateEnabled } from "@/lib/auth/gate";
import { checkSession } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/database.types";
import { friendlyError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateTeamInput,
  CreateTeamResult,
  JoinTeamInput,
  JoinTeamResult,
  ProfileInput,
  SaveProfileResult,
} from "./_lib/types";
import {
  CANT_REACH,
  SETUP_UNAVAILABLE,
  errorCode,
  firstInvalid,
  hasRpcToken,
  isAborted,
  isMissingRpc,
  isMissingSchema,
  normalizeJoinCode,
  parseTeamNumber,
  validateCreateTeam,
  validateJoinTeam,
  validateProfile,
} from "./_lib/validation";

// These actions never throw and never redirect: every outcome comes back as a
// result the form can show. Profiles change only through a granted-column
// update, teams and memberships only through the create_team and join_team
// RPCs (the migration grants no INSERT, so .upsert() would fail with 42501).

// Upper bound on one action's Supabase work. The signal aborts every request
// the client makes; the race also cuts short a token refresh's backoff
// sleeps, which aborting doesn't (see lib/auth/session.ts).
const ACTION_TIMEOUT_MS = 15000;

const TIMED_OUT = Symbol("timed out");

// A team with this name the caller set up this recently is taken to be a
// retry of the same create, not a second team.
const RECENT_CREATE_MS = 10 * 60 * 1000;

type Failure = { ok: false; error: string; signedOut?: boolean };

type Connection = {
  supabase: SupabaseClient<Database>;
  userId: string;
  /** The call's result, or TIMED_OUT once the action's deadline has passed. */
  within<T>(call: PromiseLike<T>): Promise<Awaited<T> | typeof TIMED_OUT>;
};

const FALLBACK: Failure = { ok: false, error: friendlyError(null) };

const SIGNED_OUT: Failure = {
  ok: false,
  error: friendlyError({ code: "P0001", message: "not_authenticated" }),
  signedOut: true,
};

// Only the code: messages and details can carry SQL and internal hints.
function logFailure(step: string, error: unknown): void {
  console.error(`[onboarding] ${step} failed (code: ${errorCode(error)})`);
}

function timedOut(step: string): Failure {
  console.error(`[onboarding] ${step} timed out`);
  return { ok: false, error: CANT_REACH };
}

/** Form-level copy for an error no field owns. */
function formFailure(step: string, error: unknown): Failure {
  logFailure(step, error);
  if (isMissingRpc(error) || isMissingSchema(error)) return { ok: false, error: SETUP_UNAVAILABLE };
  if (isAborted(error)) return { ok: false, error: CANT_REACH };
  if (hasRpcToken(error, "not_authenticated")) return SIGNED_OUT;
  return { ok: false, error: friendlyError(error) };
}

// Client input: the declared type is not enforced at runtime, so every field
// must be present and a string, or the whole input is rejected.
function readInput<K extends string>(input: unknown, keys: readonly K[]): Record<K, string> | null {
  if (typeof input !== "object" || input === null) return null;
  const values = {} as Record<K, string>;
  for (const key of keys) {
    let value: unknown;
    try {
      value = (input as Record<string, unknown>)[key];
    } catch {
      return null;
    }
    if (typeof value !== "string") return null;
    values[key] = value;
  }
  return values;
}

type OwnedTeam = {
  teamId: string;
  name: string;
  teamNumber: number | null;
  joinCode: string | null;
  joinedAt: number;
};

// The embed is typed non-null, but RLS or a schema change could still hand
// back null or a partial row, so each row is checked. A bad row isn't skipped:
// it could be the very team a retry is looking for (see ownedTeams).
function readOwnedTeam(row: unknown): OwnedTeam | null {
  if (typeof row !== "object" || row === null) return null;
  const { joined_at: joinedAt, team } = row as Record<string, unknown>;
  if (typeof joinedAt !== "string" || typeof team !== "object" || team === null) return null;
  const { id, name, team_number: teamNumber, join_code: joinCode } = team as Record<string, unknown>;
  const joinedAtMs = Date.parse(joinedAt);
  if (
    typeof id !== "string" ||
    id === "" ||
    typeof name !== "string" ||
    !(teamNumber === null || typeof teamNumber === "number") ||
    !(joinCode === null || typeof joinCode === "string") ||
    Number.isNaN(joinedAtMs)
  ) {
    return null;
  }
  return { teamId: id, name, teamNumber, joinCode: joinCode || null, joinedAt: joinedAtMs };
}

type OwnedTeams = { ok: true; teams: OwnedTeam[] } | { ok: false; failure: Failure };

/**
 * The teams the caller owns, read through RLS. create_team isn't idempotent,
 * and a retry after a timeout or a lost response may follow a create that did
 * commit: this is how the retry finds that team instead of making (or failing
 * on) a second one. A failed or timed-out read, or any row that can't be
 * read, makes the whole answer indeterminate: the failure is what the caller
 * should show if it can't go ahead without knowing.
 */
async function ownedTeams({ supabase, userId, within }: Connection): Promise<OwnedTeams> {
  let result;
  try {
    result = await within(
      supabase
        .from("team_members")
        .select("role, joined_at, team:teams(id, name, team_number, join_code)")
        .eq("user_id", userId)
        .eq("role", "owner"),
    );
  } catch (error) {
    return { ok: false, failure: formFailure("owned teams read", error) };
  }
  if (result === TIMED_OUT) return { ok: false, failure: timedOut("owned teams read") };
  if (result.error) return { ok: false, failure: formFailure("owned teams read", result.error) };
  const teams: OwnedTeam[] = [];
  for (const row of result.data ?? []) {
    const team = readOwnedTeam(row);
    if (!team) {
      console.error("[onboarding] owned teams read returned an unreadable row");
      return { ok: false, failure: FALLBACK };
    }
    teams.push(team);
  }
  return { ok: true, teams };
}

function createdResult(team: OwnedTeam): CreateTeamResult {
  return { ok: true, teamId: team.teamId, name: team.name, joinCode: team.joinCode };
}

async function connect(): Promise<Connection | Failure> {
  try {
    if (!isAuthGateEnabled()) return { ok: false, error: SETUP_UNAVAILABLE };
    // "unknown" (timeout, outage) says nothing about the session, so it gets
    // the connection copy, never "sign in".
    const check = await checkSession();
    if (check.status === "none") return SIGNED_OUT;
    if (check.status === "unknown") return { ok: false, error: CANT_REACH };

    const signal = AbortSignal.timeout(ACTION_TIMEOUT_MS);
    const supabase = await createClient({ signal });
    if (!supabase) return { ok: false, error: SETUP_UNAVAILABLE };

    const deadline = new Promise<typeof TIMED_OUT>((resolve) => {
      signal.addEventListener("abort", () => resolve(TIMED_OUT), { once: true });
    });
    return {
      supabase,
      userId: check.user.id,
      within: (call) => Promise.race([call, deadline]),
    };
  } catch (error) {
    return formFailure("connect", error);
  }
}

export async function saveProfile(input: ProfileInput): Promise<SaveProfileResult> {
  const values = readInput(input, ["firstName", "lastName", "role", "grade"]);
  if (!values) return FALLBACK;
  const fieldErrors = validateProfile(values);
  if (firstInvalid(fieldErrors)) return { ok: false, fieldErrors };

  const connection = await connect();
  if (!("supabase" in connection)) return connection;
  const { supabase, userId, within } = connection;

  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const isCoach = values.role === "coach";

  let result;
  try {
    // .select("id") so a missing row (zero matches) isn't mistaken for success.
    result = await within(
      supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          display_name: `${firstName} ${lastName}`,
          is_coach: isCoach,
          grade: isCoach ? null : values.grade,
        })
        .eq("id", userId)
        .select("id"),
    );
  } catch (error) {
    return formFailure("profile update", error);
  }
  if (result === TIMED_OUT) return timedOut("profile update");
  if (result.error) return formFailure("profile update", result.error);
  // Only the signup trigger creates profile rows, so the user can't fix this.
  if (!result.data || result.data.length === 0) {
    console.error("[onboarding] profile update matched no row");
    return { ok: false, error: SETUP_UNAVAILABLE };
  }
  return { ok: true };
}

export async function createTeam(input: CreateTeamInput): Promise<CreateTeamResult> {
  const values = readInput(input, ["name", "teamNumber"]);
  if (!values) return FALLBACK;
  const fieldErrors = validateCreateTeam(values);
  const teamNumber = parseTeamNumber(values.teamNumber);
  if (firstInvalid(fieldErrors) || !teamNumber.ok) return { ok: false, fieldErrors };

  const connection = await connect();
  if (!("supabase" in connection)) return connection;
  const { supabase, within } = connection;

  const name = values.name.trim();

  // Without a number nothing in the database stops a duplicate, so a team of
  // this name the caller created minutes ago is the earlier attempt. The check
  // fails closed, like the active-team rule: if the read can't say whether
  // that team exists, nothing is created. It still isn't idempotent: retries
  // racing from two tabs can both pass it before either create commits. Only
  // an idempotency key inside create_team would close that.
  if (teamNumber.value === null) {
    const owned = await ownedTeams(connection);
    if (!owned.ok) return owned.failure;
    const now = Date.now();
    const recent = owned.teams
      .filter(
        (team) =>
          team.name.toLowerCase() === name.toLowerCase() &&
          Math.abs(now - team.joinedAt) <= RECENT_CREATE_MS,
      )
      .sort((a, b) => b.joinedAt - a.joinedAt)[0];
    if (recent) return createdResult(recent);
  }

  // Blank means no number yet: p_team_number is left out so its SQL default
  // (null) applies.
  const args =
    teamNumber.value === null ? { p_name: name } : { p_name: name, p_team_number: teamNumber.value };

  let created;
  try {
    created = await within(supabase.rpc("create_team", args));
  } catch (error) {
    return formFailure("create_team", error);
  }
  if (created === TIMED_OUT) return timedOut("create_team");

  const { data: teamId, error } = created;
  if (error) {
    if (hasRpcToken(error, "invalid_team_name")) {
      return { ok: false, fieldErrors: { name: friendlyError(error) } };
    }
    if (hasRpcToken(error, "invalid_team_number")) {
      return { ok: false, fieldErrors: { teamNumber: friendlyError(error) } };
    }
    if (hasRpcToken(error, "team_number_taken")) {
      // Taken by the caller's own team: an earlier attempt that committed. If
      // the read can't tell, the database's own answer stands.
      const owned = await ownedTeams(connection);
      const mine = owned.ok
        ? owned.teams.find((team) => team.teamNumber === teamNumber.value)
        : undefined;
      if (mine) return createdResult(mine);
      return {
        ok: false,
        fieldErrors: {
          teamNumber: `${friendlyError(error)} If that's your team, ask a teammate for the join code.`,
        },
      };
    }
    return formFailure("create_team", error);
  }
  if (typeof teamId !== "string" || teamId === "") {
    console.error("[onboarding] create_team returned no team id");
    return FALLBACK;
  }

  // The team exists now, so a failed read only costs the code on screen, never
  // the action: retrying would create a second team.
  let joinCode: string | null = null;
  try {
    const read = await within(
      supabase.from("teams").select("join_code").eq("id", teamId).maybeSingle(),
    );
    if (read === TIMED_OUT) {
      console.error("[onboarding] join code read timed out");
    } else if (read.error) {
      logFailure("join code read", read.error);
    } else if (typeof read.data?.join_code === "string" && read.data.join_code !== "") {
      joinCode = read.data.join_code;
    }
  } catch (readError) {
    logFailure("join code read", readError);
  }

  return { ok: true, teamId, name, joinCode };
}

export async function joinTeam(input: JoinTeamInput): Promise<JoinTeamResult> {
  const values = readInput(input, ["code"]);
  if (!values) return FALLBACK;
  const fieldErrors = validateJoinTeam(values);
  if (firstInvalid(fieldErrors)) return { ok: false, fieldErrors };

  const connection = await connect();
  if (!("supabase" in connection)) return connection;
  const { supabase, within } = connection;

  let joined;
  try {
    // normalizeJoinCode is join_team's own normalization (uppercase, then
    // only A-Z0-9), so validation judged the very code join_team looks up;
    // validation is just stricter, rejecting I L O 0 1 and wrong lengths
    // before the round trip. Re-joining is a no-op that returns the same
    // team id.
    joined = await within(supabase.rpc("join_team", { p_code: normalizeJoinCode(values.code) }));
  } catch (error) {
    return formFailure("join_team", error);
  }
  if (joined === TIMED_OUT) return timedOut("join_team");

  const { data: teamId, error } = joined;
  if (error) {
    if (hasRpcToken(error, "invalid_join_code")) {
      return {
        ok: false,
        fieldErrors: { code: `${friendlyError(error)} Check it with whoever set up your team.` },
      };
    }
    return formFailure("join_team", error);
  }
  if (typeof teamId !== "string" || teamId === "") {
    console.error("[onboarding] join_team returned no team id");
    return FALLBACK;
  }
  return { ok: true, teamId };
}
