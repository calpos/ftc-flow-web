import { saveTaskItems, saveTasks } from "@/lib/beta/storage";
import { saveWithWarning } from "./persist";
import { AppSliceCreator, ProjectsSlice } from "./types";

export const createProjectsSlice: AppSliceCreator<ProjectsSlice> = (set) => ({
  tasks: [],

  addTask: (task) => {
    set((state) => {
      const tasks = [...state.tasks, task];
      saveWithWarning("projects", saveTasks(tasks));
      return { tasks };
    });
  },

  updateTask: (task) => {
    set((state) => {
      const tasks = state.tasks.map((item) => (item.id === task.id ? task : item));
      saveWithWarning("projects", saveTasks(tasks));
      return { tasks };
    });
  },

  deleteTask: (taskId) => {
    set((state) => {
      const tasks = state.tasks.filter((task) => task.id !== taskId);
      const taskItems = state.taskItems.filter((task) => task.parentProjectId !== taskId);
      saveWithWarning("projects", saveTasks(tasks));
      saveWithWarning("task items", saveTaskItems(taskItems));
      return { tasks, taskItems };
    });
  },

  updateProjectWithCascade: (project) => {
    set((state) => {
      const tasks = state.tasks.map((task) => (task.id === project.id ? project : task));
      let taskItemsChanged = false;
      const taskItems = state.taskItems.map((task) => {
        if (task.parentProjectId !== project.id) return task;

        if (!task.overrideFlag) {
          if (task.dueDate !== project.dueDate) {
            taskItemsChanged = true;
            return { ...task, dueDate: project.dueDate };
          }
          return task;
        }

        if (project.dueDate && task.dueDate && task.dueDate > project.dueDate) {
          taskItemsChanged = true;
          return { ...task, dueDate: project.dueDate };
        }

        return task;
      });

      saveWithWarning("projects", saveTasks(tasks));
      if (taskItemsChanged) saveWithWarning("task items", saveTaskItems(taskItems));
      return { tasks, taskItems };
    });
  },
});
