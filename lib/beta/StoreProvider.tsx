"use client";

import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/app/beta/_components/ui";
import { useActiveTeam } from "@/lib/beta/ActiveTeamProvider";
import {
  getLastFetchAt,
  hasPendingWrites,
  refreshWorkspace,
  remoteErrorMessage,
  setRemoteContext,
} from "@/lib/beta/remote/context";
import { useAppStore } from "@/lib/beta/store/appStore";
import { loadAppData } from "@/lib/beta/storage";

// What the store currently holds: "local", or "remote:<team>:<user>". The
// store is module state and outlives client navigations (demo -> sign in ->
// /beta, or sign out -> demo), so hasHydrated alone can't tell whose data it is.
let hydratedKey: string | null = null;

const STALE_MS = 30_000;

// A background refresh: the current data stays up, with no panel or toast.
function refreshIfStale(): void {
  const last = getLastFetchAt();
  if (!hasPendingWrites() && (last === null || Date.now() - last >= STALE_MS)) {
    refreshWorkspace().catch((e: unknown) => {
      console.warn("Failed to refresh the workspace:", e);
    });
  }
}

/**
 * Hydrates the Zustand store for the active mode, then renders children.
 * Local mode loads the demo's localStorage data (mirrors the app's
 * AppProvider). Remote mode fetches the active team from Supabase, shows a
 * retry panel if that fails, and refetches in the background when the tab
 * returns after a while; it never falls back to local data. Until the store
 * holds the right data, renders a minimal loading state, so server and
 * first-client render match and one mode's data is never shown in the other.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const activeTeam = useActiveTeam();
  const remote = activeTeam.mode === "remote";
  const teamId = activeTeam.team?.id ?? null;
  const userId = activeTeam.userId;
  const key = remote ? `remote:${teamId}:${userId}` : "local";

  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const [load, setLoad] = useState<{
    key: string;
    status: "ready" | "error";
    message?: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  const ready = hasHydrated && hydratedKey === key;

  useEffect(() => {
    const ctx = teamId !== null && userId !== null ? { teamId, userId } : null;
    // Read here rather than subscribed: hydrating must not rerun this effect.
    if (useAppStore.getState().hasHydrated && hydratedKey === key) {
      // A remount with the same data.
      setRemoteContext(ctx);
      if (ctx) refreshIfStale();
      return;
    }

    // The store holds another mode's data, or none. Set the context first so
    // saves stop (or resume) before anything loads.
    hydratedKey = null;
    setRemoteContext(ctx);
    let active = true;

    if (!ctx) {
      loadAppData().then((data) => {
        if (!active) return;
        hydrate(data);
        hydratedKey = key;
        setLoad({ key, status: "ready" });
      });
    } else {
      // No children render while this loads, so no write can overlap it and
      // have refreshWorkspace discard the result. Under StrictMode the second
      // run's setRemoteContext is a no-op and this shares the in-flight fetch.
      refreshWorkspace().then(
        () => {
          if (!active) return;
          hydratedKey = key;
          setLoad({ key, status: "ready" });
        },
        (e: unknown) => {
          if (!active) return;
          console.warn("Failed to load the workspace:", e);
          setLoad({ key, status: "error", message: remoteErrorMessage(e) });
        },
      );
    }
    return () => {
      active = false;
    };
  }, [key, attempt, teamId, userId, hydrate]);

  useEffect(() => {
    if (!remote || !ready) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshIfStale();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [remote, ready]);

  if (ready) return <>{children}</>;

  if (load?.key === key && load.status === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          role="alert"
          className="w-full max-w-sm rounded-2xl border border-edge bg-surface p-6"
        >
          <p className="text-base font-semibold text-fg">Couldn&apos;t load your team</p>
          <p className="mt-2 text-sm text-fg-dim">{load.message}</p>
          <div className="mt-5 flex justify-end gap-3">
            {/* Retry can't fix an expired session or a lost membership, and no
                shell (sign-out, team switcher) renders here. A reload reruns
                the layout's team resolution, which redirects or falls back. */}
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload page
            </Button>
            <Button
              onClick={() => {
                setLoad(null);
                setAttempt((n) => n + 1);
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-fg-dim">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-edge border-t-signal" />
        <span className="text-sm">Loading your team…</span>
      </div>
    </div>
  );
}
