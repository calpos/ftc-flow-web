import * as api from "@/lib/beta/remote/api";
import { getRemoteContext, trackWrite } from "@/lib/beta/remote/context";
import { saveTaskItems, saveTasks } from "@/lib/beta/storage";
import type { Task } from "@/lib/beta/types";
import { saveWithWarning } from "./persist";
import { sequenceWrite, settleAll } from "./remoteWriteSequencer";
import { AppSliceCreator, ProjectsSlice } from "./types";

// Each action applies its change locally first, then in remote mode writes it
// through. The write stays out of set(): an updater must stay pure.
export const createProjectsSlice: AppSliceCreator<ProjectsSlice> = (set, get) => ({
  tasks: [],

  addTask: (task) => {
    const tasks = [...get().tasks, task];
    set({ tasks });
    saveWithWarning("projects", saveTasks(tasks));
    const ctx = getRemoteContext();
    if (ctx) {
      void trackWrite(
        sequenceWrite([task.id], () => api.insertProject(task, ctx.teamId)),
        "the new project",
      );
    }
  },

  updateTask: (task) => {
    const tasks = get().tasks.map((item) => (item.id === task.id ? task : item));
    set({ tasks });
    saveWithWarning("projects", saveTasks(tasks));
    const ctx = getRemoteContext();
    if (ctx) {
      void trackWrite(
        sequenceWrite([task.id], () => api.updateProject(task)),
        "your changes to the project",
      );
    }
  },

  // In remote mode this deletes on the server right away, so an undo grace
  // period must not call it until the delete is final. An undo must re-add the
  // project (addTask) before its tasks (addTaskItem): a task re-added first
  // would insert ahead of it, fail the FK and be dropped by the rollback.
  deleteTask: (taskId) => {
    const state = get();
    const tasks = state.tasks.filter((task) => task.id !== taskId);
    const taskItems = state.taskItems.filter((task) => task.parentProjectId !== taskId);
    set({ tasks, taskItems });
    saveWithWarning("projects", saveTasks(tasks));
    saveWithWarning("task items", saveTaskItems(taskItems));
    const ctx = getRemoteContext();
    if (ctx) {
      // The FK cascade deletes the children on the server. Keying them makes
      // the delete wait for their in-flight writes.
      const childIds = state.taskItems
        .filter((task) => task.parentProjectId === taskId)
        .map((task) => task.id);
      void trackWrite(
        sequenceWrite([taskId, ...childIds], () => api.deleteProject(taskId)),
        "the project deletion",
      );
    }
  },

  updateProjectWithCascade: (project) => {
    const state = get();
    const tasks = state.tasks.map((task) => (task.id === project.id ? project : task));
    const changed: Task[] = [];
    const taskItems = state.taskItems.map((task) => {
      if (task.parentProjectId !== project.id) return task;

      if (!task.overrideFlag) {
        if (task.dueDate !== project.dueDate) {
          const next = { ...task, dueDate: project.dueDate };
          changed.push(next);
          return next;
        }
        return task;
      }

      if (project.dueDate && task.dueDate && task.dueDate > project.dueDate) {
        const next = { ...task, dueDate: project.dueDate };
        changed.push(next);
        return next;
      }

      return task;
    });

    set({ tasks, taskItems });
    saveWithWarning("projects", saveTasks(tasks));
    if (changed.length > 0) saveWithWarning("task items", saveTaskItems(taskItems));
    const ctx = getRemoteContext();
    if (ctx) {
      // One tracked write for the whole edit. settleAll keeps it pending until
      // every part has landed, so a failed part can't start the rollback early.
      void trackWrite(
        sequenceWrite([project.id, ...changed.map((task) => task.id)], () =>
          settleAll([
            api.updateProject(project),
            ...changed.map((task) => api.updateTaskItem(task)),
          ]),
        ),
        "your changes to the project",
      );
    }
  },
});
