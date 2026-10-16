/**
 * Shapes shared by the onboarding forms and their server actions. Pure and
 * client-safe. Inputs are plain strings exactly as typed: the actions treat
 * them as untrusted, re-check their runtime types and re-validate them.
 */

export type Role = "student" | "coach";

export type ProfileField = "firstName" | "lastName" | "role" | "grade";
/** `role` is "" until the user picks one; `grade` is "" for coaches. */
export type ProfileInput = Record<ProfileField, string>;

export type CreateTeamField = "name" | "teamNumber";
export type CreateTeamInput = Record<CreateTeamField, string>;

export type JoinTeamField = "code";
export type JoinTeamInput = Record<JoinTeamField, string>;

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

/**
 * A failed action. `error` is form-level copy, `fieldErrors` belong next to
 * their fields, and `signedOut` means the session is definitely gone, so the
 * form offers a sign-in link.
 */
export type ActionFailure<F extends string> = {
  ok: false;
  error?: string;
  fieldErrors?: FieldErrors<F>;
  signedOut?: boolean;
};

export type SaveProfileResult = { ok: true } | ActionFailure<ProfileField>;

export type CreateTeamResult =
  | {
      ok: true;
      teamId: string;
      name: string;
      /** Null when the code couldn't be read back; the team still exists. */
      joinCode: string | null;
    }
  | ActionFailure<CreateTeamField>;

export type JoinTeamResult = { ok: true; teamId: string } | ActionFailure<JoinTeamField>;

/** What the created screen shows. */
export type CreatedTeam = { teamId: string; name: string; joinCode: string | null };
