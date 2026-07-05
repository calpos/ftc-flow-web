import {
  PROGRESS_STAGES,
  ProgressStage,
  Task,
  formatProgress,
  getProgressLabel,
  getTaskItemProgress,
} from "@/lib/beta/types";
import { TaskFilters } from "@/lib/beta/filters";

/**
 * Filter/sort for standalone Task items. The app ships getFilteredAndSortedTasks
 * for projects (TeamTask) and getFilteredAndSortedPolls for polls, but task
 * items have their own shape (title, getTaskItemProgress), so this mirrors the
 * same TaskFilters semantics for Task[].
 */
export function getFilteredAndSortedTaskItems({
  taskItems,
  searchQuery,
  filters,
  currentUserId,
}: {
  taskItems: Task[];
  searchQuery: string;
  filters: TaskFilters;
  currentUserId: string;
}): Task[] {
  let result = [...taskItems];

  const q = searchQuery.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.subtasks.some((s) => s.title.toLowerCase().includes(q)),
    );
  }

  const showMine = filters.involvement.has("mine");
  const showOthers = filters.involvement.has("others");
  if (!showMine && !showOthers) {
    result = [];
  } else if (showMine && !showOthers) {
    result = result.filter((t) => t.assignedMembers.includes(currentUserId));
  } else if (!showMine && showOthers) {
    result = result.filter((t) => !t.assignedMembers.includes(currentUserId));
  }

  if (filters.stages.size === 0) {
    result = [];
  } else if (filters.stages.size !== PROGRESS_STAGES.length) {
    result = result.filter((t) => {
      const label = getProgressLabel(formatProgress(getTaskItemProgress(t)));
      return filters.stages.has(label as ProgressStage);
    });
  }

  if (filters.dueBefore) {
    const before = new Date(filters.dueBefore);
    result = result.filter((t) => t.dueDate && new Date(t.dueDate) <= before);
  }
  if (filters.dueAfter) {
    const after = new Date(filters.dueAfter);
    result = result.filter((t) => t.dueDate && new Date(t.dueDate) >= after);
  }

  const byName = (a: Task, b: Task) => a.title.localeCompare(b.title);
  const byDate = (a: Task, b: Task) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return da !== db ? da - db : byName(a, b);
  };

  if (filters.sortMethod === "relevancy") {
    result.sort((a, b) => {
      const ai = a.assignedMembers.includes(currentUserId) ? 0 : 1;
      const bi = b.assignedMembers.includes(currentUserId) ? 0 : 1;
      return ai !== bi ? ai - bi : byDate(a, b);
    });
  } else if (filters.sortMethod === "targetDate") {
    result.sort(byDate);
  } else if (filters.sortMethod === "progress") {
    result.sort((a, b) => {
      const ap = getTaskItemProgress(a);
      const bp = getTaskItemProgress(b);
      return ap !== bp ? ap - bp : byName(a, b);
    });
  } else {
    result.sort(byName);
  }

  if (filters.sortOrder === "desc") result.reverse();
  return result;
}
