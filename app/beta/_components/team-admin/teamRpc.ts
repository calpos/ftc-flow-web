import { trackWrite } from "@/lib/beta/remote/context";

/**
 * Runs a roster RPC (set_member_role, remove_member) as a tracked write, so
 * the caller's next refreshWorkspace() can't hand back a pre-RPC roster.
 *
 * - trackWrite bumps writeSeq synchronously, so a refresh already in flight
 *   is discarded when it lands and rescheduled.
 * - Its pending count blocks refreshIfStale from starting a background fetch
 *   while the RPC runs.
 * - The tracked copy swallows the rejection, so there's no "Couldn't save"
 *   toast and no rollback: RPCs aren't optimistic, so there's nothing to roll
 *   back, and the caller still gets the real error for its dialog.
 * - Awaiting `tracked` before returning means pending has drained, so the
 *   caller's following refreshWorkspace() starts a fresh fetch that is kept.
 *
 * A noteWrite() or fresh-refresh API in lib/beta/remote/context.ts would be
 * cleaner, but that file is owned elsewhere.
 */
export async function runTeamRpc<T>(rpc: Promise<T>): Promise<T> {
  const tracked = trackWrite(
    rpc.then(
      () => undefined,
      () => undefined,
    ),
    "the team change",
  );
  try {
    return await rpc;
  } finally {
    await tracked;
  }
}
