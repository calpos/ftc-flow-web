import {
  Poll,
  ProgressStage,
  PROGRESS_STAGES,
  TeamTask,
  getProgressLabel,
  getTaskProgress,
  getUserPollVotes,
  isPollEffectivelyOpen,
} from "@/lib/beta/types";

export type SortMethod = "relevancy" | "targetDate" | "alphabetical" | "progress";
export type SortOrder = "asc" | "desc";
export type InvolvementKey = "mine" | "others";

export interface TaskFilters {
  sortMethod: SortMethod;
  sortOrder: SortOrder;
  involvement: Set<InvolvementKey>;
  stages: Set<ProgressStage>;
  dueBefore: string;
  dueAfter: string;
}

export const SORT_LABELS: Record<SortMethod, string> = {
  relevancy: "Relevancy",
  targetDate: "Target Date",
  alphabetical: "Alphabetical",
  progress: "Progress",
};

export const INVOLVEMENT_LABELS: Record<InvolvementKey, string> = {
  mine: "My Tasks",
  others: "Other Tasks",
};

export const INVOLVEMENT_KEYS: InvolvementKey[] = ["mine", "others"];

export function createDefaultTaskFilters(
  overrides: Partial<Omit<TaskFilters, "involvement" | "stages">> & {
    involvement?: Set<InvolvementKey>;
    stages?: Set<ProgressStage>;
  } = {}
): TaskFilters {
  return {
    sortMethod: "relevancy",
    sortOrder: "asc",
    involvement: overrides.involvement ?? new Set<InvolvementKey>(["mine", "others"]),
    stages: overrides.stages ?? new Set<ProgressStage>(PROGRESS_STAGES),
    dueBefore: "",
    dueAfter: "",
    ...overrides,
  };
}

export function hasActiveTaskFilters(filters: TaskFilters): boolean {
  const defaults = createDefaultTaskFilters();
  return (
    filters.involvement.size !== defaults.involvement.size ||
    filters.stages.size !== PROGRESS_STAGES.length ||
    filters.dueBefore !== "" ||
    filters.dueAfter !== "" ||
    filters.sortMethod !== defaults.sortMethod ||
    filters.sortOrder !== defaults.sortOrder
  );
}

interface GetFilteredAndSortedTasksParams {
  tasks: TeamTask[];
  searchQuery: string;
  filters: TaskFilters;
  currentUserId: string;
}

export function getFilteredAndSortedTasks({
  tasks,
  searchQuery,
  filters,
  currentUserId,
}: GetFilteredAndSortedTasksParams): TeamTask[] {
  let result = [...tasks];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter((t) => {
      if (t.name.toLowerCase().includes(q)) return true;
      if (t.description.toLowerCase().includes(q)) return true;
      if (t.subtasks.some((st) => st.title.toLowerCase().includes(q))) return true;
      return false;
    });
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
      const label = getProgressLabel(getTaskProgress(t));
      return filters.stages.has(label as ProgressStage);
    });
  }

  if (filters.dueBefore) {
    const beforeDate = new Date(filters.dueBefore);
    result = result.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) <= beforeDate;
    });
  }
  if (filters.dueAfter) {
    const afterDate = new Date(filters.dueAfter);
    result = result.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) >= afterDate;
    });
  }

  if (filters.sortMethod === "relevancy") {
    result.sort((a, b) => {
      const aInv = a.assignedMembers.includes(currentUserId) ? 0 : 1;
      const bInv = b.assignedMembers.includes(currentUserId) ? 0 : 1;
      if (aInv !== bInv) return aInv - bInv;
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (aDate !== bDate) return aDate - bDate;
      return a.name.localeCompare(b.name);
    });
  } else if (filters.sortMethod === "targetDate") {
    result.sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (aDate !== bDate) return aDate - bDate;
      return a.name.localeCompare(b.name);
    });
  } else if (filters.sortMethod === "progress") {
    result.sort((a, b) => {
      const ap = getTaskProgress(a);
      const bp = getTaskProgress(b);
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name);
    });
  } else {
    result.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (filters.sortOrder === "desc") {
    result.reverse();
  }

  return result;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export function formatFilterDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export type ClosingPreset = "1d" | "3d" | "1w" | "2w" | "1m" | "custom" | "indefinite";

export const CLOSING_PRESET_OPTIONS: { key: ClosingPreset; label: string }[] = [
  { key: "1d", label: "1 day" },
  { key: "3d", label: "3 days" },
  { key: "1w", label: "1 week" },
  { key: "2w", label: "2 weeks" },
  { key: "1m", label: "1 month" },
  { key: "custom", label: "Custom" },
  { key: "indefinite", label: "Indefinite" },
];

export const DAY_MS = 24 * 60 * 60 * 1000;

export function computeClosesAtFromPreset(
  preset: ClosingPreset,
  customDateStr: string
): number | undefined {
  const now = Date.now();
  switch (preset) {
    case "1d": return now + DAY_MS;
    case "3d": return now + 3 * DAY_MS;
    case "1w": return now + 7 * DAY_MS;
    case "2w": return now + 14 * DAY_MS;
    case "1m": return now + 30 * DAY_MS;
    case "custom": {
      if (!customDateStr) return undefined;
      const d = new Date(`${customDateStr}T23:59:59`);
      const t = d.getTime();
      return isNaN(t) ? undefined : t;
    }
    default: return undefined;
  }
}

export type PollSortMethod = "datePosted" | "closingDate" | "alphabetical";

export const POLL_SORT_LABELS: Record<PollSortMethod, string> = {
  datePosted: "Date Posted",
  closingDate: "Closing Date",
  alphabetical: "Alphabetical",
};

export type PollActiveKey = "active" | "inactive";

export interface PollFilters {
  sortMethod: PollSortMethod;
  sortOrder: SortOrder;
  active: Set<PollActiveKey>;
  postedBefore: string;
  postedAfter: string;
  closingBefore: string;
  closingAfter: string;
  unvotedOnly: boolean;
}

export function createDefaultPollFilters(
  overrides: Partial<Omit<PollFilters, "active">> & { active?: Set<PollActiveKey> } = {}
): PollFilters {
  return {
    sortMethod: "datePosted",
    sortOrder: "desc",
    postedBefore: "",
    postedAfter: "",
    closingBefore: "",
    closingAfter: "",
    unvotedOnly: false,
    ...overrides,
    active: overrides.active ?? new Set<PollActiveKey>(["active", "inactive"]),
  };
}

export function hasActivePollFilters(filters: PollFilters): boolean {
  const defaults = createDefaultPollFilters();
  return (
    filters.active.size !== 2 ||
    filters.postedBefore !== "" ||
    filters.postedAfter !== "" ||
    filters.closingBefore !== "" ||
    filters.closingAfter !== "" ||
    filters.unvotedOnly ||
    filters.sortMethod !== defaults.sortMethod ||
    filters.sortOrder !== defaults.sortOrder
  );
}

interface GetFilteredAndSortedPollsParams {
  polls: Poll[];
  searchQuery: string;
  filters: PollFilters;
  currentUserId: string;
}

export function getFilteredAndSortedPolls({
  polls,
  searchQuery,
  filters,
  currentUserId,
}: GetFilteredAndSortedPollsParams): Poll[] {
  let result = [...polls];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter((p) => {
      if (p.question.toLowerCase().includes(q)) return true;
      if (p.options.some((o) => o.text.toLowerCase().includes(q))) return true;
      return false;
    });
  }

  const showActive = filters.active.has("active");
  const showInactive = filters.active.has("inactive");
  if (!showActive && !showInactive) {
    result = [];
  } else if (showActive && !showInactive) {
    result = result.filter((p) => isPollEffectivelyOpen(p));
  } else if (!showActive && showInactive) {
    result = result.filter((p) => !isPollEffectivelyOpen(p));
  }

  if (filters.postedAfter) {
    const t = new Date(filters.postedAfter).getTime();
    result = result.filter((p) => p.createdAt >= t);
  }
  if (filters.postedBefore) {
    const t = new Date(`${filters.postedBefore}T23:59:59`).getTime();
    result = result.filter((p) => p.createdAt <= t);
  }
  if (filters.closingAfter) {
    const t = new Date(filters.closingAfter).getTime();
    result = result.filter((p) => (p.closesAt ?? Infinity) >= t);
  }
  if (filters.closingBefore) {
    const t = new Date(`${filters.closingBefore}T23:59:59`).getTime();
    result = result.filter((p) => (p.closesAt ?? Infinity) <= t);
  }
  if (filters.unvotedOnly) {
    result = result.filter((p) => getUserPollVotes(p, currentUserId).length === 0);
  }

  if (filters.sortMethod === "datePosted") {
    result.sort((a, b) => a.createdAt - b.createdAt);
  } else if (filters.sortMethod === "closingDate") {
    result.sort((a, b) => (a.closesAt ?? Infinity) - (b.closesAt ?? Infinity));
  } else {
    result.sort((a, b) => a.question.localeCompare(b.question));
  }
  if (filters.sortOrder === "desc") result.reverse();
  return result;
}
