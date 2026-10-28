/**
 * Field checks shared by the onboarding forms (instant feedback) and the
 * server actions (the real gate), plus the error classifiers the actions use.
 * Pure and client-safe: no server imports. Each validator returns error copy,
 * or undefined when valid.
 *
 * Limits mirror migration 20261015000000_teams_onboarding_roles.sql (06 Code
 * repo): create_team trims the name and requires 1..80 characters
 * (char_length, so code points, not UTF-16 units) and a positive int4 team
 * number; join codes are 8 characters from generate_join_code's alphabet
 * (A-Z and 2-9 without I L O 0 1), and join_team uppercases a code and strips
 * everything outside A-Z0-9 before looking it up. The profile columns are
 * unconstrained text, so the name limit is ours.
 */

import type {
  CreateTeamInput,
  FieldErrors,
  JoinTeamInput,
  ProfileInput,
  Role,
} from "./types";

export const NAME_MAX_LENGTH = 50;
export const TEAM_NAME_MAX_LENGTH = 80;
/** Postgres int4, create_team's p_team_number type. */
export const TEAM_NUMBER_MAX = 2147483647;
export const JOIN_CODE_LENGTH = 8;
/** Stored as these labels in profiles.grade (free-form text in the schema). */
export const GRADES = ["9th", "10th", "11th", "12th", "Other"] as const;

export const SETUP_UNAVAILABLE = "Team setup isn't available yet. Try again soon.";
/** Same copy friendlyError gives a network failure. */
export const CANT_REACH = "Can't reach FTC Flow. Check your connection and try again.";

// Code points, to match Postgres char_length: an emoji counts once.
function charLength(value: string): number {
  return Array.from(value).length;
}

export function isRole(value: unknown): value is Role {
  return value === "student" || value === "coach";
}

export function isGrade(value: unknown): value is (typeof GRADES)[number] {
  return typeof value === "string" && (GRADES as readonly string[]).includes(value);
}

export function validateName(value: string, which: "first" | "last"): string | undefined {
  const name = value.trim();
  if (!name) return which === "first" ? "Enter your first name." : "Enter your last name.";
  if (charLength(name) > NAME_MAX_LENGTH) return `Use ${NAME_MAX_LENGTH} characters or fewer.`;
  return undefined;
}

export function validateRole(value: string): string | undefined {
  return isRole(value) ? undefined : "Choose whether you're a student or a coach.";
}

/** Only students have a grade; anything goes for a coach (it's saved as null). */
export function validateGrade(value: string, role: string): string | undefined {
  if (role !== "student") return undefined;
  return isGrade(value) ? undefined : "Choose your grade.";
}

/** Keys in form order, so the first invalid one is the first field to focus. */
export function validateProfile(values: ProfileInput): FieldErrors<keyof ProfileInput> {
  return {
    firstName: validateName(values.firstName, "first"),
    lastName: validateName(values.lastName, "last"),
    role: validateRole(values.role),
    grade: validateGrade(values.grade, values.role),
  };
}

export function validateTeamName(value: string): string | undefined {
  const name = value.trim();
  if (!name) return "Enter your team's name.";
  if (charLength(name) > TEAM_NAME_MAX_LENGTH) {
    return `Use ${TEAM_NAME_MAX_LENGTH} characters or fewer.`;
  }
  return undefined;
}

export type TeamNumberResult = { ok: true; value: number | null } | { ok: false; error: string };

/** Blank is valid and means "no number yet" (null). */
export function parseTeamNumber(value: string): TeamNumberResult {
  const text = value.trim();
  if (!text) return { ok: true, value: null };
  if (!/^[0-9]+$/.test(text)) return { ok: false, error: "Use numbers only, like 16236." };
  const number = Number(text);
  if (number < 1) return { ok: false, error: "Team numbers start at 1." };
  if (number > TEAM_NUMBER_MAX) return { ok: false, error: "Enter a valid FTC team number." };
  return { ok: true, value: number };
}

export function validateCreateTeam(values: CreateTeamInput): FieldErrors<keyof CreateTeamInput> {
  const number = parseTeamNumber(values.teamNumber);
  return {
    name: validateTeamName(values.name),
    teamNumber: number.ok ? undefined : number.error,
  };
}

/**
 * join_team's own normalization: uppercase, then drop everything outside
 * A-Z and 0-9, so " abcd–efgh " -> "ABCDEFGH". The checks below then judge
 * exactly the code join_team will look up.
 */
export function normalizeJoinCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** "ABCDEFGH" -> "ABCD-EFGH", for reading aloud. Other lengths pass through. */
export function formatJoinCode(code: string): string {
  return code.length === JOIN_CODE_LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

export function validateJoinCode(value: string): string | undefined {
  const code = normalizeJoinCode(value);
  if (!code) return "Enter your team's join code.";
  // generate_join_code's alphabet leaves these out, so a code with one can
  // never match: name the likely mix-up instead of a bare "not found".
  if (/[ILO01]/.test(code)) {
    return "Join codes never use I, L, O, 0 or 1. Check for a similar-looking letter or number.";
  }
  if (code.length !== JOIN_CODE_LENGTH) {
    return `Join codes are ${JOIN_CODE_LENGTH} letters and numbers.`;
  }
  return undefined;
}

export function validateJoinTeam(values: JoinTeamInput): FieldErrors<keyof JoinTeamInput> {
  return { code: validateJoinCode(values.code) };
}

/** The first key with an error, in the validator's (form) order. */
export function firstInvalid<F extends string>(errors: FieldErrors<F>): F | undefined {
  return (Object.keys(errors) as F[]).find((key) => errors[key]);
}

// --- Error classifiers -------------------------------------------------------

// A getter may throw, so reads are guarded and wrong types dropped (same
// approach as lib/supabase/errors.ts).
function readString(error: unknown, key: string): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  try {
    const value = (error as Record<string, unknown>)[key];
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** The error's code, for logs. Never the message: it can carry SQL. */
export function errorCode(error: unknown): string {
  return readString(error, "code") || "none";
}

/** The RPC isn't there: the migration hasn't been applied (or the cache is stale). */
export function isMissingRpc(error: unknown): boolean {
  return (
    readString(error, "code") === "PGRST202" ||
    readString(error, "message")?.includes("Could not find the function") === true
  );
}

// PGRST200 missing relationship, PGRST204 missing column, PGRST205 missing
// table (all schema cache), 42703 undefined column, 42P01 undefined table.
const MISSING_SCHEMA_CODES: readonly string[] = ["PGRST200", "PGRST204", "PGRST205", "42703", "42P01"];

/** A column or table the migration adds is missing. */
export function isMissingSchema(error: unknown): boolean {
  const code = readString(error, "code");
  return code !== undefined && MISSING_SCHEMA_CODES.includes(code);
}

/**
 * The request was aborted or timed out. postgrest-js reports a rejected fetch
 * as `{ message: "AbortError: ..." }` (or TimeoutError for
 * AbortSignal.timeout); a thrown DOMException carries the same name.
 */
export function isAborted(error: unknown): boolean {
  const name = readString(error, "name");
  if (name === "AbortError" || name === "TimeoutError") return true;
  return /^(AbortError|TimeoutError)\b/.test(readString(error, "message") ?? "");
}

const RPC_TOKEN_RE = /[A-Za-z0-9_]+/g;

/** The snake_case token a team RPC raised (code P0001), if it is `token`. */
export function hasRpcToken(error: unknown, token: string): boolean {
  if (readString(error, "code") !== "P0001") return false;
  const tokens: string[] = readString(error, "message")?.match(RPC_TOKEN_RE) ?? [];
  return tokens.includes(token);
}
