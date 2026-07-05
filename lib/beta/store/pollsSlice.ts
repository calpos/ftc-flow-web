import { getUserPollVotes, isPollEffectivelyOpen } from "@/lib/beta/types";
import { savePolls } from "@/lib/beta/storage";
import { saveWithWarning } from "./persist";
import { AppSliceCreator, PollsSlice } from "./types";

export const createPollsSlice: AppSliceCreator<PollsSlice> = (set) => ({
  polls: [],

  addPoll: (poll) => {
    set((state) => {
      const polls = [poll, ...state.polls];
      saveWithWarning("polls", savePolls(polls));
      return { polls };
    });
  },

  updatePoll: (poll) => {
    set((state) => {
      const polls = state.polls.map((item) => (item.id === poll.id ? poll : item));
      saveWithWarning("polls", savePolls(polls));
      return { polls };
    });
  },

  deletePoll: (pollId) => {
    set((state) => {
      const polls = state.polls.filter((poll) => poll.id !== pollId);
      saveWithWarning("polls", savePolls(polls));
      return { polls };
    });
  },

  votePoll: (pollId, userId, optionId) => {
    set((state) => {
      let changed = false;
      const polls = state.polls.map((poll) => {
        if (poll.id !== pollId) return poll;
        if (!isPollEffectivelyOpen(poll)) return poll;

        const current = getUserPollVotes(poll, userId);
        const nextVotes = poll.allowMultiple
          ? current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId]
          : current[0] === optionId
            ? []
            : [optionId];
        const votes = { ...poll.votes };

        if (nextVotes.length === 0) {
          delete votes[userId];
        } else {
          votes[userId] = nextVotes;
        }

        changed = true;
        return { ...poll, votes };
      });

      if (changed) saveWithWarning("polls", savePolls(polls));
      return { polls };
    });
  },

  setPollOpen: (pollId, isOpen) => {
    set((state) => {
      const polls = state.polls.map((poll) =>
        poll.id === pollId ? { ...poll, isOpen } : poll
      );
      saveWithWarning("polls", savePolls(polls));
      return { polls };
    });
  },
});
