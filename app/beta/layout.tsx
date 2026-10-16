import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasDemoCookie } from "@/lib/auth/demo";
import { isAuthGateEnabled } from "@/lib/auth/gate";
import { checkSession } from "@/lib/auth/session";
import type { BetaAuth } from "@/lib/auth/types";
import { ActiveTeamProvider } from "@/lib/beta/ActiveTeamProvider";
import { StoreProvider } from "@/lib/beta/StoreProvider";
import { getActiveTeamContext } from "@/lib/teams/active-team";
import { needsOnboarding } from "@/lib/teams/types";
import { BetaShell } from "./_components/BetaShell";

export const metadata: Metadata = {
  title: {
    default: 'Local Alpha — FTC Flow',
    template: '%s · FTC Flow Local Alpha',
  },
  description:
    "Try every FTC Flow feature in your browser. Runs locally, no account needed.",
  robots: { index: false, follow: false },
};

// The proxy already gates /beta; this re-checks on the server so the page
// never renders for a visitor it would have turned away.
async function resolveAuth(): Promise<BetaAuth> {
  // Before any cookies() call, so /beta stays static in local demo mode.
  if (!isAuthGateEnabled()) return { kind: "local" };
  const check = await checkSession();
  if (check.status === "user") return { kind: "user", email: check.user.email ?? "" };
  if (hasDemoCookie(await cookies())) return { kind: "demo" };
  // Supabase unreachable or slow: the proxy already verified this request, and
  // /beta holds no server data, so failing open is safe. Redirecting would
  // loop: layout -> /login -> proxy sees the user -> /beta.
  if (check.status === "unknown") return { kind: "user", email: "" };
  redirect("/login?next=/beta");
}

export default async function BetaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await resolveAuth();
  // Local and demo visitors never get a context, so they never reach the
  // redirect; null (can't tell) means no redirect either.
  const context = auth.kind === "user" ? await getActiveTeamContext() : null;
  // /onboarding is built by a sibling task and uses the same needsOnboarding
  // predicate to decide it is done, so the two can't redirect into each other.
  if (isAuthGateEnabled() && context && needsOnboarding(context)) redirect("/onboarding");
  return (
    <ActiveTeamProvider context={context}>
      <StoreProvider>
        <BetaShell auth={auth}>{children}</BetaShell>
      </StoreProvider>
    </ActiveTeamProvider>
  );
}
