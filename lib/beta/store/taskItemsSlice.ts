import { saveTaskItems } from "@/lib/beta/storage";
import { saveWithWarning } from "./persist";
import { AppSliceCreator, TaskItemsSlice } from "./types";

export const createTaskItemsSlice: AppSliceCreator<TaskItemsSlice> = (set) => ({
  taskItems: [],

  addTaskItem: (task) => {
    set((state) => {
      const taskItems = [...state.taskItems, task];
      saveWithWarning("task items", saveTaskItems(taskItems));
      return { taskItems };
    });
  },

  updateTaskItem: (task) => {
    set((state) => {
      const taskItems = state.taskItems.map((item) => (item.id === task.id ? task : item));
      saveWithWarning("task items", saveTaskItems(taskItems));
      return { taskItems };
    });
  },

  deleteTaskItem: (id) => {
    set((state) => {
      const taskItems = state.taskItems.filter((task) => task.id !== id);
      saveWithWarning("task items", saveTaskItems(taskItems));
      return { taskItems };
    });
  },
});
