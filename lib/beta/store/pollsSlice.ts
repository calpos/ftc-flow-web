import * as api from "@/lib/beta/remote/api";
import { getRemoteContext, trackWrite } from "@/lib/beta/remote/context";
import { getUserPollVotes, isPollEffectivelyOpen } from "@/lib/beta/types";
import { savePolls } from "@/lib/beta/storage";
import { saveWithWarning } from "./persist";
import { AppSliceCreator, PollsSlice } from "./types";

// Remote writes for one poll run in order, so an undo's re-insert can't
// overtake the delete it undoes, nor a vote overtake its poll's insert.
const writeChains = new Map<string, Promise<void>>();

function chainWrite(id: string, write: () => Promise<void>): Promise<void> {
  const previous = writeChains.get(id);
  const next = previous ? previous.then(write, write) : Promise.resolve().then(write);
  writeChains.set(id, next);
  const release = () => {
    if (writeChains.get(id) === next) writeChains.delete(id);
  };
  next.then(release, release);
  return next;
}

function sendWrite(id: string, label: string, write: () => Promise<void>): void {
  void trackWrite(chainWrite(id, write), label);
}

export function resetPollWritesForTests(): void {
  writeChains.clear();
}

export function pollWriteChainCountForTests(): number {
  return writeChains.size;
}

export const createPollsSlice: AppSliceCreator<PollsSlice> = (set, get) => ({
  polls: [],

  addPoll: (poll) => {
    const ctx = getRemoteContext();
    const polls = [poll, ...get().polls];
    set({ polls });
    saveWithWarning("polls", savePolls(polls));
    if (ctx) sendWrite(poll.id, "the poll", () => api.insertPoll(poll, ctx.teamId));
  },

  updatePoll: (poll) => {
    const ctx = getRemoteContext();
    const current = get().polls;
    const exists = current.some((item) => item.id === poll.id);
    const polls = current.map((item) => (item.id === poll.id ? poll : item));
    set({ polls });
    saveWithWarning("polls", savePolls(polls));
    if (ctx && exists) sendWrite(poll.id, "the poll", () => api.updatePoll(poll));
  },

  // Sent to the server at once, so a future undo grace period must call this only once the delete is final.
  deletePoll: (pollId) => {
    const ctx = getRemoteContext();
    const current = get().polls;
    const polls = current.filter((poll) => poll.id !== pollId);
    set({ polls });
    saveWithWarning("polls", savePolls(polls));
    // Votes cascade in the database.
    if (ctx && polls.length !== current.length) {
      sendWrite(pollId, "the poll deletion", () => api.deletePoll(pollId));
    }
  },

  votePoll: (pollId, userId, optionId) => {
    const ctx = getRemoteContext();
    // The server only takes the caller's own ballot; another user's would diverge.
    if (ctx && userId !== ctx.userId) return;
    const current = get().polls;
    const target = current.find((poll) => poll.id === pollId);
    if (!target || !isPollEffectivelyOpen(target)) return;

    const previous = getUserPollVotes(target, userId);
    const nextVotes = target.allowMultiple
      ? previous.includes(optionId)
        ? previous.filter((id) => id !== optionId)
        : [...previous, optionId]
      : previous[0] === optionId
        ? []
        : [optionId];
    const votes = { ...target.votes };

    if (nextVotes.length === 0) {
      delete votes[userId];
    } else {
      votes[userId] = nextVotes;
    }

    const polls = current.map((poll) => (poll.id === pollId ? { ...poll, votes } : poll));
    set({ polls });
    saveWithWarning("polls", savePolls(polls));
    if (ctx) sendWrite(pollId, "your vote", () => api.setPollVote(pollId, nextVotes));
  },

  setPollOpen: (pollId, isOpen) => {
    const ctx = getRemoteContext();
    const current = get().polls;
    const target = current.find((poll) => poll.id === pollId);
    const polls = current.map((poll) => (poll.id === pollId ? { ...poll, isOpen } : poll));
    set({ polls });
    saveWithWarning("polls", savePolls(polls));
    // No is_open-only write exists, so this sends the whole row.
    if (ctx && target) sendWrite(pollId, "the poll", () => api.updatePoll({ ...target, isOpen }));
  },
});
