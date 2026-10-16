import * as api from "@/lib/beta/remote/api";
import { getRemoteContext, trackWrite } from "@/lib/beta/remote/context";
import { saveTaskItems } from "@/lib/beta/storage";
import { saveWithWarning } from "./persist";
import { sequenceWrite } from "./remoteWriteSequencer";
import { AppSliceCreator, TaskItemsSlice } from "./types";

// Each action applies its change locally first, then in remote mode writes it
// through. The write stays out of set(): an updater must stay pure. Writes key
// the parent project too, so they stay ordered against its insert and delete.
export const createTaskItemsSlice: AppSliceCreator<TaskItemsSlice> = (set, get) => ({
  taskItems: [],

  addTaskItem: (task) => {
    const taskItems = [...get().taskItems, task];
    set({ taskItems });
    saveWithWarning("task items", saveTaskItems(taskItems));
    const ctx = getRemoteContext();
    if (ctx) {
      void trackWrite(
        sequenceWrite([task.id, task.parentProjectId], () => api.insertTaskItem(task, ctx.teamId)),
        "the new task",
      );
    }
  },

  updateTaskItem: (task) => {
    const state = get();
    const previous = state.taskItems.find((item) => item.id === task.id);
    const taskItems = state.taskItems.map((item) => (item.id === task.id ? task : item));
    set({ taskItems });
    saveWithWarning("task items", saveTaskItems(taskItems));
    const ctx = getRemoteContext();
    if (ctx) {
      // Both parents, so a move between projects lands before either's delete.
      void trackWrite(
        sequenceWrite([task.id, previous?.parentProjectId, task.parentProjectId], () =>
          api.updateTaskItem(task),
        ),
        "your changes to the task",
      );
    }
  },

  deleteTaskItem: (id) => {
    const state = get();
    const previous = state.taskItems.find((task) => task.id === id);
    const taskItems = state.taskItems.filter((task) => task.id !== id);
    set({ taskItems });
    saveWithWarning("task items", saveTaskItems(taskItems));
    const ctx = getRemoteContext();
    if (ctx) {
      void trackWrite(
        sequenceWrite([id, previous?.parentProjectId], () => api.deleteTaskItem(id)),
        "the task deletion",
      );
    }
  },
});
