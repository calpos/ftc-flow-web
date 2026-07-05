import { saveCurrentUserId } from "@/lib/beta/storage";
import { saveWithWarning } from "./persist";
import { AppSliceCreator, SessionSlice } from "./types";

export const createSessionSlice: AppSliceCreator<SessionSlice> = (set) => ({
  currentUserId: "m-1",
  isLoading: true,
  hasHydrated: false,

  hydrate: (data) => {
    set({
      currentUserId: data.currentUserId,
      members: data.members,
      tasks: data.tasks,
      taskItems: data.taskItems,
      polls: data.polls,
      events: data.events,
      isLoading: false,
      hasHydrated: true,
    });
  },

  setIsLoading: (isLoading) => {
    set({ isLoading });
  },

  setUser: (id) => {
    set({ currentUserId: id });
    saveWithWarning("current user", saveCurrentUserId(id));
  },
});
