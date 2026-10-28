"use client";

import { useRef, useState, type FormEvent } from "react";
import { authCard } from "@/app/(auth)/_components/fields";
import { friendlyError } from "@/lib/supabase/errors";
import { setActiveTeam } from "@/lib/teams/actions";
import { buttonPrimary } from "@/lib/ui";
import { createTeam, joinTeam } from "../actions";
import type {
  CreatedTeam,
  CreateTeamField,
  CreateTeamResult,
  JoinTeamField,
  JoinTeamResult,
} from "../_lib/types";
import { firstInvalid, validateCreateTeam, validateJoinTeam } from "../_lib/validation";
import { ActionAlert, OpenAppAnyway, SIGNED_OUT_ERROR, StepHeading, TextField } from "./parts";
import { focusField, useFormFields } from "./useFormFields";

type Mode = "join" | "create";

/** A form-level error. `joined`: the join worked but opening the team didn't. */
type Alert = { error: string; signedOut?: boolean; joined?: boolean };

const modeButton =
  "flex h-10 items-center justify-center rounded-[6px] text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";

export function TeamStep({
  hasTeams,
  isCoach,
  focusHeading,
  signInNext,
  findSavedTeam,
  onCreated,
  onSavedTeam,
}: {
  hasTeams: boolean;
  isCoach: boolean;
  focusHeading: boolean;
  signInNext: string;
  /** A team this user created here moments ago (kept across reloads), if any. */
  findSavedTeam: () => CreatedTeam | null;
  onCreated: (team: CreatedTeam) => void;
  /** Shows a saved team's created screen again. */
  onSavedTeam: (team: CreatedTeam) => void;
}) {
  // Coaches usually start a team; students usually join one.
  const [mode, setMode] = useState<Mode>(isCoach ? "create" : "join");
  const join = useFormFields<JoinTeamField>({ code: "" }, validateJoinTeam);
  const create = useFormFields<CreateTeamField>({ name: "", teamNumber: "" }, validateCreateTeam);
  const [joinPending, setJoinPending] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [joinAlert, setJoinAlert] = useState<Alert | null>(null);
  const [createAlert, setCreateAlert] = useState<Alert | null>(null);
  // One guard for both forms: creating isn't idempotent, so a double submit
  // must never reach the server, even before the pending state renders.
  const busy = useRef(false);
  const joinFormRef = useRef<HTMLFormElement>(null);
  const createFormRef = useRef<HTMLFormElement>(null);
  const pending = joinPending || createPending;

  async function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const invalid = join.checkAll();
    if (invalid) {
      focusField(joinFormRef.current, invalid);
      return;
    }

    busy.current = true;
    setJoinPending(true);
    setJoinAlert(null);
    let result: JoinTeamResult;
    try {
      result = await joinTeam(join.values);
    } catch (error) {
      result = { ok: false, error: friendlyError(error) };
    }

    if (result.ok) {
      // Joining is idempotent, so a retry after a failed activation is safe.
      let activated: { ok: true } | { ok: false; error: string };
      try {
        activated = await setActiveTeam(result.teamId);
      } catch (error) {
        activated = { ok: false, error: friendlyError(error) };
      }
      if (activated.ok) {
        // A full load, so /beta's server-resolved team context is rebuilt.
        // Stays busy until the page goes.
        window.location.assign("/beta");
        return;
      }
      busy.current = false;
      setJoinPending(false);
      setJoinAlert({
        error: activated.error,
        signedOut: activated.error === SIGNED_OUT_ERROR,
        joined: true,
      });
      return;
    }

    busy.current = false;
    setJoinPending(false);
    if (result.fieldErrors) {
      join.showErrors(result.fieldErrors);
      const first = firstInvalid(result.fieldErrors);
      if (first) focusField(joinFormRef.current, first);
    }
    if (result.error) setJoinAlert({ error: result.error, signedOut: result.signedOut });
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const invalid = create.checkAll();
    if (invalid) {
      focusField(createFormRef.current, invalid);
      return;
    }

    // The team from a moment ago, not a second one. This step unmounts.
    const saved = findSavedTeam();
    if (saved) {
      busy.current = true;
      onSavedTeam(saved);
      return;
    }

    busy.current = true;
    setCreatePending(true);
    setCreateAlert(null);
    let result: CreateTeamResult;
    try {
      result = await createTeam(create.values);
    } catch (error) {
      result = { ok: false, error: friendlyError(error) };
    }

    if (result.ok) {
      // This step unmounts; it stays busy until then.
      onCreated({ teamId: result.teamId, name: result.name, joinCode: result.joinCode });
      return;
    }

    busy.current = false;
    setCreatePending(false);
    if (result.fieldErrors) {
      create.showErrors(result.fieldErrors);
      const first = firstInvalid(result.fieldErrors);
      if (first) focusField(createFormRef.current, first);
    }
    if (result.error) setCreateAlert({ error: result.error, signedOut: result.signedOut });
  }

  function renderAlert(alert: Alert | null) {
    if (!alert) return null;
    if (alert.joined) {
      return (
        <ActionAlert error={alert.error} signedOut={alert.signedOut} signInNext={signInNext}>
          <OpenAppAnyway />
        </ActionAlert>
      );
    }
    return <ActionAlert error={alert.error} signedOut={alert.signedOut} signInNext={signInNext} />;
  }

  return (
    <>
      <div className={authCard}>
        <StepHeading focus={focusHeading}>
          {hasTeams ? "Add another team" : "Join your team"}
        </StepHeading>
        <p className="mt-3 leading-relaxed text-fg-mid">
          {hasTeams
            ? "Join a team with its code, or set up a new one."
            : "Join with a code from your team, or set up a new team if you're the first one here."}
        </p>

        <div
          role="group"
          aria-label="Join or create a team"
          className="mt-6 grid grid-cols-2 gap-1 rounded-[10px] border border-edge bg-ink/40 p-1"
        >
          {(
            [
              ["join", "Join a team"],
              ["create", "Create a team"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              disabled={pending}
              onClick={() => setMode(value)}
              className={`${modeButton} ${
                mode === value ? "bg-raised text-fg" : "text-fg-mid hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Both forms stay mounted, so switching keeps what was typed. */}
        <form
          ref={joinFormRef}
          hidden={mode !== "join"}
          noValidate
          onSubmit={submitJoin}
          className="mt-7 space-y-5"
        >
          {renderAlert(joinAlert)}
          <TextField
            id="onboarding-join-code"
            name="code"
            label="Join code"
            placeholder="ABCD-EFGH"
            autoComplete="off"
            autoCapitalize="characters"
            inputClassName="font-mono uppercase tracking-[0.14em]"
            value={join.values.code}
            error={join.errors.code}
            hint="8 letters and numbers. Ask whoever set up your team for it."
            onChange={(value) => join.change("code", value)}
            onBlur={() => join.blur("code")}
          />
          <button type="submit" disabled={joinPending} className={`${buttonPrimary} mt-2 w-full`}>
            {joinPending ? "Joining…" : "Join team"}
          </button>
        </form>

        <form
          ref={createFormRef}
          hidden={mode !== "create"}
          noValidate
          onSubmit={submitCreate}
          className="mt-7 space-y-5"
        >
          {renderAlert(createAlert)}
          <TextField
            id="onboarding-team-name"
            name="name"
            label="Team name"
            autoComplete="off"
            value={create.values.name}
            error={create.errors.name}
            onChange={(value) => create.change("name", value)}
            onBlur={() => create.blur("name")}
          />
          <TextField
            id="onboarding-team-number"
            name="teamNumber"
            label="FTC team number"
            autoComplete="off"
            inputMode="numeric"
            value={create.values.teamNumber}
            error={create.errors.teamNumber}
            hint="Optional. Leave blank if your team doesn't have one yet."
            onChange={(value) => create.change("teamNumber", value)}
            onBlur={() => create.blur("teamNumber")}
          />
          <button
            type="submit"
            disabled={createPending}
            className={`${buttonPrimary} mt-2 w-full`}
          >
            {createPending ? "Creating…" : "Create team"}
          </button>
        </form>
      </div>

      {hasTeams ? (
        <p className="mt-6 text-center text-sm">
          <a href="/beta" className="text-fg-mid underline-offset-2 hover:text-fg hover:underline">
            Back to FTC Flow
          </a>
        </p>
      ) : null}
    </>
  );
}
