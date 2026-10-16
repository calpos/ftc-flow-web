import { fetchWorkspace } from "@/lib/beta/remote/api";
import { useToastStore } from "@/lib/beta/store/toastStore";
import { friendlyError } from "@/lib/supabase/errors";

/**
 * The remote side of the /beta workspace: which team the store mirrors, and
 * write-through bookkeeping for the slices. It lives at module level, not in
 * React, so slice code can reach it without a hook.
 *
 * Slices update the store optimistically and hand the api.ts promise to
 * trackWrite. A failed write toasts and owes a rollback: a refresh whose
 * server copy replaces the optimistic state once no other write is pending,
 * since refetching earlier would clobber theirs. A refresh that writes
 * overlapped is discarded and owes a refetch, run at the same point. Only a
 * failed rollback toasts; a failed refetch just warns, since nothing the user
 * did was lost. Changing the context drops every result from the old one.
 *
 * appStore is imported dynamically: appStore -> sessionSlice -> storage ->
 * context would otherwise be a static import cycle.
 */

export interface RemoteContext {
  teamId: string;
  userId: string;
}

let context: RemoteContext | null = null;
// Bumped on every context change; async work compares it to drop stale results.
let generation = 0;
let pending = 0;
// Bumped on every write, so a refresh can tell a write overlapped its fetch.
let writeSeq = 0;
// Set when a write failed; cleared once a refresh carrying it starts.
let rollbackOwed = false;
// Set when a refresh was discarded because writes overlapped its fetch.
let refetchOwed = false;
let lastFetchAt: number | null = null;
// `rollback`: this fetch is carrying a rollback, so discarding it re-owes one.
let inFlight: {
  generation: number;
  seq: number;
  rollback: boolean;
  promise: Promise<void>;
} | null = null;

/** Idempotent for the same team and user, so StrictMode and remounts are safe. */
export function setRemoteContext(next: RemoteContext | null): void {
  const same =
    next === null
      ? context === null
      : context !== null && next.teamId === context.teamId && next.userId === context.userId;
  if (same) return;
  context = next && { teamId: next.teamId, userId: next.userId };
  generation++;
  pending = 0;
  rollbackOwed = false;
  refetchOwed = false;
  lastFetchAt = null;
  inFlight = null;
}

export function getRemoteContext(): RemoteContext | null {
  return context;
}

/**
 * Message for an error from api.ts or the workspace fetch. api.ts already
 * throws a plain Error with safe copy, and friendlyError doesn't recognize
 * its own copy, so that message is kept as is. Every other error is mapped:
 * PostgrestError, the AuthError subclasses and TypeError all set their own
 * name, so none of them is mistaken for one of ours.
 */
export function remoteErrorMessage(error: unknown): string {
  return error instanceof Error && error.name === "Error" && error.message
    ? error.message
    : friendlyError(error);
}

/**
 * Tracks a write the store has already applied optimistically. `promise` is
 * an api.ts call; `label` is a lowercase noun phrase that completes "Couldn't
 * save ...", e.g. "the project" or "your vote". On failure it toasts and
 * schedules a refresh to roll the store back. Resolves to whether the write
 * succeeded; never rejects.
 */
export async function trackWrite(promise: Promise<unknown>, label: string): Promise<boolean> {
  const gen = generation;
  pending++;
  writeSeq++;
  try {
    await promise;
    return true;
  } catch (e) {
    console.warn(`Failed to save ${label}:`, e);
    useToastStore.getState().push(`Couldn't save ${label}. ${remoteErrorMessage(e)}`);
    // A write from an old context only toasts; its team is no longer shown.
    if (gen === generation) rollbackOwed = true;
    return false;
  } finally {
    if (gen === generation) {
      pending--;
      flushIfIdle();
    }
  }
}

// Refreshing while other writes are pending would clobber their optimistic
// state, so an owed rollback or refetch waits for the last one to settle.
function flushIfIdle(): void {
  if (pending > 0 || !(rollbackOwed || refetchOwed) || !context) return;
  const rollback = rollbackOwed;
  rollbackOwed = false;
  refetchOwed = false;
  startRefresh(rollback).catch((e: unknown) => {
    if (rollback) {
      console.warn("Failed to roll back the workspace:", e);
      useToastStore.getState().push("Couldn't reload your team. Refresh the page.");
    } else {
      console.warn("Failed to refetch the workspace:", e);
    }
  });
}

/**
 * Refetches the team and hydrates the store. Does nothing without a context.
 * Concurrent calls share one fetch. Rejects with the api error; a result or
 * failure from a context that has since changed is dropped.
 */
export function refreshWorkspace(): Promise<void> {
  return startRefresh(false);
}

function startRefresh(rollback: boolean): Promise<void> {
  const ctx = context;
  if (!ctx) return Promise.resolve();
  if (inFlight && inFlight.generation === generation && inFlight.seq === writeSeq) {
    // A rollback sharing this fetch must still be owed if it gets discarded.
    if (rollback) inFlight.rollback = true;
    return inFlight.promise;
  }
  const gen = generation;
  const seq = writeSeq;
  const pendingAtStart = pending;

  const run = async (): Promise<void> => {
    try {
      const [data, { useAppStore }] = await Promise.all([
        fetchWorkspace(ctx.teamId, ctx.userId),
        // A failed chunk load throws a plain Error naming the chunk URL, which
        // remoteErrorMessage would show as is, so it gets friendly copy here.
        import("@/lib/beta/store/appStore").catch((e: unknown) => {
          throw new Error(friendlyError(e), { cause: e });
        }),
      ]);
      if (gen !== generation) return;
      if (pendingAtStart > 0 || writeSeq !== seq) {
        // Writes overlapped the fetch, so it may predate them: discard it and
        // refetch once they drain, still owing any rollback it carried. Clear
        // inFlight first, or the rescheduled call would be handed this same
        // promise back.
        if (flight.rollback) rollbackOwed = true;
        if (inFlight === flight) inFlight = null;
        refetchOwed = true;
        flushIfIdle();
        return;
      }
      useAppStore.getState().hydrate(data);
      lastFetchAt = Date.now();
    } catch (e) {
      if (gen === generation) throw e;
    } finally {
      if (inFlight === flight) inFlight = null;
    }
  };
  // Not an inline IIFE: run compares inFlight against this very entry. run
  // first reads it after an await, so it is assigned by then.
  const flight = { generation: gen, seq, rollback, promise: run() };
  inFlight = flight;
  return flight.promise;
}

export function hasPendingWrites(): boolean {
  return pending > 0;
}

/** When the store was last hydrated from the server, or null. */
export function getLastFetchAt(): number | null {
  return lastFetchAt;
}

export function resetRemoteContextForTests(): void {
  // Bumped, not reset, so leftover async work from the last test drops.
  generation++;
  context = null;
  pending = 0;
  writeSeq = 0;
  rollbackOwed = false;
  refetchOwed = false;
  lastFetchAt = null;
  inFlight = null;
}
