import { create } from "zustand";

import { createEventsSlice } from "./eventsSlice";
import { createMembersSlice } from "./membersSlice";
import { createPollsSlice } from "./pollsSlice";
import { createProjectsSlice } from "./projectsSlice";
import { createSessionSlice } from "./sessionSlice";
import { createTaskItemsSlice } from "./taskItemsSlice";
import { AppStore } from "./types";

export type { AppStore } from "./types";

export const useAppStore = create<AppStore>()((...args) => ({
  ...createSessionSlice(...args),
  ...createMembersSlice(...args),
  ...createProjectsSlice(...args),
  ...createTaskItemsSlice(...args),
  ...createPollsSlice(...args),
  ...createEventsSlice(...args),
}));

export function resetAppStoreForTests(): void {
  useAppStore.setState(useAppStore.getInitialState(), true);
}
