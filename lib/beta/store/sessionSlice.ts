// Safe to import statically: context loads appStore dynamically.
import { getRemoteContext } from "@/lib/beta/remote/context";
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
    // In remote mode the viewer is always the signed-in user.
    if (getRemoteContext() !== null) return;
    set({ currentUserId: id });
    saveWithWarning("current user", saveCurrentUserId(id));
  },
});
