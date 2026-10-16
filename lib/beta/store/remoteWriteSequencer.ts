/**
 * Orders remote writes per row. The slices fire writes without awaiting, so
 * two writes for one row could otherwise reach the server out of order: an
 * undo's re-insert of the same uuid ahead of its delete, a task's insert
 * ahead of its project's, an update ahead of the insert it edits, or a
 * project delete ahead of a child write still in flight. A write waits on the
 * id of every row it touches or references, so a child write keys its
 * project too. Shared by both slices, since their rows reference each other.
 */

// Row id -> a promise that settles, never rejects, once that row's latest
// write has. Deleted once settled unless a later write has replaced it.
const tails = new Map<string, Promise<void>>();

/**
 * Calls `write` once every earlier write sharing one of `keys` has settled,
 * or right away if none is pending. Resolves or rejects with the write's own
 * result; a failed write doesn't hold up or fail the writes after it.
 */
export function sequenceWrite(
  keys: (string | undefined)[],
  write: () => Promise<unknown>,
): Promise<unknown> {
  const unique = [...new Set(keys.filter((key): key is string => Boolean(key)))];
  const waits = unique.flatMap((key) => tails.get(key) ?? []);
  // Either way a synchronous throw from write becomes a rejection.
  const result =
    waits.length === 0
      ? new Promise<unknown>((resolve) => resolve(write()))
      : Promise.all(waits).then(() => write());

  const release = (): void => {
    for (const key of unique) if (tails.get(key) === tail) tails.delete(key);
  };
  const tail = result.then(release, release);
  for (const key of unique) tails.set(key, tail);
  return result;
}

/**
 * Settles every promise, then rejects with the first listed rejection, if any.
 * Promise.all would reject while the rest are still in flight, ending the
 * write early: its successors and trackWrite's rollback would start before
 * those land.
 */
export async function settleAll(promises: Promise<unknown>[]): Promise<void> {
  const results = await Promise.allSettled(promises);
  const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failed) throw failed.reason;
}

export function resetRemoteWriteSequencerForTests(): void {
  tails.clear();
}
