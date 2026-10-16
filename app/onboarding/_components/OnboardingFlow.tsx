"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { checkSavedTeam, clearSavedTeam, saveCreatedTeam, savedTeamSnapshot } from "../_lib/savedTeam";
import type { CreatedTeam, ProfileInput, Role } from "../_lib/types";
import { ProfileStep } from "./ProfileStep";
import { TeamCreated } from "./TeamCreated";
import { TeamStep } from "./TeamStep";

type Screen = { name: "profile" | "team" } | { name: "created"; team: CreatedTeam };

const TEAM_STEP_PATH = "/onboarding?step=team";

// Storage has no event for this tab's own writes, and the snapshot is only
// needed on render (and fresh on submit), so nothing is subscribed.
function subscribeNever(): () => void {
  return () => {};
}

function noSavedTeam(): null {
  return null;
}

/**
 * profile -> team -> created. The server page decides where it starts; from
 * then on the steps live here, and only leaving for /beta is a page load.
 */
export function OnboardingFlow({
  userId,
  teamIds,
  initialStep,
  profile,
  isCoach,
  hasTeams,
  step,
}: {
  userId: string;
  /** The user's memberships, as the server read them for this render. */
  teamIds: string[];
  initialStep: "profile" | "team";
  profile: ProfileInput;
  isCoach: boolean;
  hasTeams: boolean;
  step: "team" | null;
}) {
  const [screen, setScreen] = useState<Screen>({ name: initialStep });
  const [coach, setCoach] = useState(isCoach);
  // Only after a step change does the new heading take focus.
  const [moved, setMoved] = useState(false);
  // Read once: a server action that sets a cookie re-renders this page with
  // fresh props, and a join would otherwise flip the heading to "Add another
  // team" (and show the back link) just as the page leaves for /beta.
  const [hadTeams] = useState(hasTeams);

  // A team created before a reload (or before a re-render lost this state)
  // brings its created screen back, so the user sees the join code again
  // instead of a form that would make a second team. Null on the server and
  // while hydrating, so the markup matches; the real value follows. Not
  // checked on the created screen itself: there `teamIds` can predate the
  // team just made, which would wrongly clear its record.
  const snapshot = useSyncExternalStore(subscribeNever, savedTeamSnapshot, noSavedTeam);
  const restoring = step === "team" && screen.name !== "created";
  const saved = useMemo(
    () => (restoring ? checkSavedTeam(snapshot, userId, teamIds) : null),
    [restoring, snapshot, userId, teamIds],
  );
  const stale = saved?.stale === true;
  useEffect(() => {
    if (stale) clearSavedTeam();
  }, [stale]);
  const current: Screen = saved?.team ? { name: "created", team: saved.team } : screen;

  // The team and created screens must carry ?step=team. A server action that
  // sets cookies (a session refresh, setActiveTeam) re-renders this route on
  // the server, and without it the gate would send a user who just created
  // their first team to /beta before they see the join code. The page
  // redirects there itself when it starts on the team step, so this only
  // runs after the profile step, long after hydration: by then Next has
  // patched replaceState to update its router URL too (app-router.js), and
  // that URL is the one actions post to.
  const onTeamScreens = current.name !== "profile";
  useEffect(() => {
    if (!onTeamScreens) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("step") === "team") return;
    url.searchParams.set("step", "team");
    window.history.replaceState(null, "", url);
  }, [onTeamScreens]);

  function profileSaved(role: Role) {
    // Already on a team and not here to add one: onboarding is done.
    if (hasTeams && !step) {
      window.location.assign("/beta");
      return;
    }
    setCoach(role === "coach");
    setMoved(true);
    setScreen({ name: "team" });
  }

  function showCreated(team: CreatedTeam) {
    setMoved(true);
    setScreen({ name: "created", team });
  }

  function teamCreated(team: CreatedTeam) {
    saveCreatedTeam(userId, team);
    showCreated(team);
  }

  // Read fresh on submit, so the age limit is judged now rather than at render.
  function findSavedTeam(): CreatedTeam | null {
    const check = checkSavedTeam(savedTeamSnapshot(), userId, teamIds);
    if (check.stale) clearSavedTeam();
    return check.team;
  }

  if (current.name === "created") {
    const { team } = current;
    // Pinned in state first, so clearing the record can't swap a restored
    // screen for the form while the page is still leaving.
    const leaving = () => {
      setScreen({ name: "created", team });
      clearSavedTeam();
    };
    return <TeamCreated team={team} signInNext={TEAM_STEP_PATH} onLeave={leaving} />;
  }
  if (current.name === "team") {
    return (
      <TeamStep
        hasTeams={hadTeams}
        isCoach={coach}
        focusHeading={moved}
        signInNext={TEAM_STEP_PATH}
        findSavedTeam={findSavedTeam}
        onCreated={teamCreated}
        onSavedTeam={showCreated}
      />
    );
  }
  return (
    <ProfileStep
      initial={profile}
      focusHeading={moved}
      signInNext={step ? TEAM_STEP_PATH : "/onboarding"}
      onSaved={profileSaved}
    />
  );
}
