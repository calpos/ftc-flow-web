import { redirect } from "next/navigation";
import { isAuthGateEnabled } from "@/lib/auth/gate";
import { checkSession } from "@/lib/auth/session";
import { getActiveTeamContext } from "@/lib/teams/active-team";
import { needsOnboarding } from "@/lib/teams/types";
import { OnboardingFlow } from "./_components/OnboardingFlow";
import { Unavailable } from "./_components/Unavailable";
import { CANT_REACH, SETUP_UNAVAILABLE, isGrade } from "./_lib/validation";

// The same blank rule as needsOnboarding in lib/teams/types.ts.
function isBlank(value: string | null): boolean {
  return value === null || value.trim() === "";
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Before any cookie, session or searchParams read, so local demo mode never
  // renders per request.
  if (!isAuthGateEnabled()) redirect("/beta");

  // ?step=team: the user came to add a team (or is mid-flow), so a finished
  // onboarding must not bounce them to /beta.
  const step = (await searchParams).step === "team" ? "team" : null;
  const here = step ? "/onboarding?step=team" : "/onboarding";

  const check = await checkSession();
  if (check.status === "none") redirect(`/login?next=${encodeURIComponent(here)}`);
  // Can't tell whether anyone is signed in, so no redirect either way.
  if (check.status === "unknown") return <Unavailable message={CANT_REACH} retryHref={here} />;

  // Null is "can't tell" (migration missing, query failed, profile row
  // missing), never "no teams". It also keeps /beta in local mode, so the
  // link there can't loop back here.
  const ctx = await getActiveTeamContext();
  if (!ctx) return <Unavailable message={SETUP_UNAVAILABLE} retryHref={here} />;

  // The /beta layout redirects here on this same predicate, so the two can
  // never send a user back and forth.
  if (!needsOnboarding(ctx) && !step) redirect("/beta");

  const { profile } = ctx;
  const profileComplete = !isBlank(profile.first_name) && !isBlank(profile.last_name);

  // The team step must have ?step=team in the URL from the first byte. The
  // client can't add it before hydrating (Next's router only adopts
  // replaceState calls once it has mounted, after the page's own effects),
  // and without it a server action that sets cookies re-renders plain
  // /onboarding, where the gate above sends a user who just created their
  // first team to /beta before they see the join code. No loop: /beta never
  // sends anyone to ?step=team, and ?step=team never redirects to /beta.
  if (!step && profileComplete) redirect("/onboarding?step=team");

  return (
    <OnboardingFlow
      userId={ctx.userId}
      teamIds={ctx.memberships.map((membership) => membership.team.id)}
      initialStep={profileComplete ? "team" : "profile"}
      profile={{
        firstName: profile.first_name ?? "",
        lastName: profile.last_name ?? "",
        // is_coach defaults to false, so a fresh profile would read as a
        // student: the choice is only carried over from a finished profile.
        role: profileComplete ? (profile.is_coach ? "coach" : "student") : "",
        grade: isGrade(profile.grade) ? profile.grade : "",
      }}
      isCoach={profile.is_coach}
      hasTeams={ctx.memberships.length > 0}
      step={step}
    />
  );
}
