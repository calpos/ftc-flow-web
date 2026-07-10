export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  teamRole: string;
  workRoles: string[];
  grade?: string;
  isCoach: boolean;
}

/**
 * Legacy subtask shape (color + progress). Kept ONLY for back-compat reads on TeamTask;
 * new code should not create these — Subtasks now live on Task as TaskSubtask.
 */
export interface SubTask {
  id: string;
  title: string;
  color: string;
  progress: number;
}

/** Simple subtask on a Task: title + completed only. */
export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * Lightweight work-unit. Either standalone (parentProjectId undefined) or a Project Task
 * (parentProjectId set to a Project/TeamTask id). Same record in both views.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  color: string;
  /** YYYY-MM-DD */
  dueDate: string;
  /** Optional HH:mm (24h) */
  dueTime?: string;
  assignedMembers: string[];
  editors: string[];
  subtasks: TaskSubtask[];
  parentProjectId?: string;
  /**
   * True if the user explicitly set this Task's due date (so it shouldn't auto-track
   * the parent Project's due date). Only meaningful when parentProjectId is set.
   */
  overrideFlag: boolean;
  /** Manual progress (0-100). Used when subtasks.length === 0. */
  progress: number;
  createdBy: string;
  createdAt: number;
}

/** Project (formerly heavyweight Task). subtasks kept for backward-compat reads only. */
export interface TeamTask {
  id: string;
  name: string;
  description: string;
  color: string;
  dueDate: string;
  assignedMembers: string[];
  editors: string[];
  createdBy: string;
  /** Legacy. Kept for migration; project progress now derived from child Tasks. */
  subtasks: SubTask[];
  /** Manual progress when project has no child Tasks. */
  progress: number;
  imageUri?: string;
  bannerUri?: string;
}

export const SUBTASK_COLORS = [
  "#FF3B30",
  "#FF6B35",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#248A3D",
  "#00C7BE",
  "#007AFF",
  "#5856D6",
  "#AF52DE",
  "#FF2D55",
];

export const TASK_COLORS = SUBTASK_COLORS;

export const COMMON_TEAM_ROLES = [
  "Captain",
  "Co-Captain",
  "President",
  "Vice President",
  "Secretary",
  "Treasurer",
  "Member",
];

export const COMMON_WORK_ROLES = [
  "Programmer",
  "Engineer",
  "CAD Designer",
  "Builder",
  "Driver",
  "Scout",
  "Outreach",
  "Notebooker",
  "Designer",
  "Strategist",
];

export function getProgressLabel(percent: number): string {
  if (percent === 0) return "Not Started";
  if (percent < 40) return "Started";
  if (percent < 80) return "In Progress";
  if (percent < 100) return "Finalizing";
  return "Complete";
}

export const PROGRESS_STAGE_COLORS: Record<string, string> = {
  "Not Started": "#6B6B80",
  "Started": "#E8A317",
  "In Progress": "#2D8CFF",
  "Finalizing": "#AF52DE",
  "Complete": "#34C759",
};

export function getProgressLabelColor(label: string): string {
  return PROGRESS_STAGE_COLORS[label] ?? "#6B6B80";
}

export const PROGRESS_STAGES = [
  "Not Started",
  "Started",
  "In Progress",
  "Finalizing",
  "Complete",
] as const;

export type ProgressStage = typeof PROGRESS_STAGES[number];

export function formatProgress(value: number): number {
  if (value === 0) return 0;
  if (value === 100) return 100;
  const rounded = Math.round(value);
  if (rounded === 0) return 1;
  if (rounded === 100) return 99;
  return rounded;
}

/** Legacy: progress of a Project from its (legacy) subtasks or manual. */
export function getTaskProgress(task: TeamTask): number {
  if (task.subtasks.length === 0) return task.progress;
  return task.subtasks.reduce((sum, st) => sum + st.progress, 0) / task.subtasks.length;
}

/** Progress of a Task. With subtasks → completed/total. Without → manual. */
export function getTaskItemProgress(t: Task): number {
  if (t.subtasks.length === 0) return t.progress;
  const done = t.subtasks.filter((s) => s.completed).length;
  return (done / t.subtasks.length) * 100;
}

/**
 * Progress of a Project: average of its child Tasks (by id), or manual project.progress
 * when there are no child Tasks.
 */
export function getProjectProgress(project: TeamTask, allTasks: Task[]): number {
  const children = allTasks.filter((t) => t.parentProjectId === project.id);
  if (children.length === 0) return project.progress;
  const sum = children.reduce((acc, c) => acc + getTaskItemProgress(c), 0);
  return sum / children.length;
}

/** Compare two YYYY-MM-DD strings. Returns negative/zero/positive. Empty strings sort last. */
export function compareDateStrings(a: string, b: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function migrateTaskItem(raw: Record<string, unknown>): Task {
  const r = raw as Record<string, unknown>;
  const rawSubs = (r.subtasks as Record<string, unknown>[]) || [];
  const assigned = (r.assignedMembers as string[]) || [];
  return {
    id: (r.id as string) || `ti-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: (r.title as string) || "",
    description: (r.description as string) || "",
    color: (r.color as string) || "#2D8CFF",
    dueDate: (r.dueDate as string) || "",
    dueTime: typeof r.dueTime === "string" ? (r.dueTime as string) : undefined,
    assignedMembers: assigned,
    editors: (r.editors as string[]) || [...assigned],
    subtasks: rawSubs.map((s, i) => ({
      id: (s.id as string) || `sub-${i}`,
      title: (s.title as string) || "",
      completed: Boolean(s.completed),
    })),
    parentProjectId: typeof r.parentProjectId === "string" ? (r.parentProjectId as string) : undefined,
    overrideFlag: Boolean(r.overrideFlag),
    progress: typeof r.progress === "number" ? (r.progress as number) : 0,
    createdBy: (r.createdBy as string) || (assigned[0] ?? "m-1"),
    createdAt: typeof r.createdAt === "number" ? (r.createdAt as number) : Date.now(),
  };
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseDateStrLocal(dateStr: string): Date | null {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
}

export function formatDateDisplay(dateStr: string): string {
  const d = parseDateStrLocal(dateStr);
  if (!d) return dateStr;
  const month = MONTH_NAMES[d.getMonth()];
  const day = d.getDate();
  return `${month} ${day}${getOrdinalSuffix(day)}`;
}

export function getDaysAwayText(dateStr: string): string {
  const target = parseDateStrLocal(dateStr);
  if (!target) return "";
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - todayStart.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day away";
  if (diffDays > 1) return `${diffDays} days away`;
  if (diffDays === -1) return "1 day ago";
  return `${Math.abs(diffDays)} days ago`;
}

export type DeadlineUrgency = "overdue" | "today" | "due-soon" | "normal";

export function getDeadlineUrgency(dateStr: string, isCompleted: boolean): DeadlineUrgency | null {
  if (isCompleted || !dateStr) return null;
  const target = parseDateStrLocal(dateStr);
  if (!target) return null;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 3) return "due-soon";
  return "normal";
}

export interface PollOption {
  id: string;
  text: string;
  /** Per-option color (hex). When undefined, uses palette by index. */
  color?: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  creatorId: string;
  isOpen: boolean;
  /** Optional auto-close timestamp (ms). Undefined = indefinite. */
  closesAt?: number;
  /** When true, users may select multiple options. */
  allowMultiple: boolean;
  /** Map of userId -> array of selected optionIds (always an array, even for single-select). */
  votes: Record<string, string[]>;
  createdAt: number;
  /** Required per-poll accent color (hex). */
  color: string;
  /** Optional uploaded poll image URI. */
  imageUri?: string;
}

/** Distinct color palette used for poll option progress bars. Colors are picked by option index. */
export const POLL_OPTION_COLORS = [
  "#2D8CFF",
  "#FF9500",
  "#34C759",
  "#AF52DE",
  "#FF2D55",
  "#00C7BE",
] as const;

export function getPollOptionColor(index: number): string {
  return POLL_OPTION_COLORS[index % POLL_OPTION_COLORS.length];
}

/** Effective option color: prefer per-option color, fallback to palette. */
export function getPollOptionEffectiveColor(opt: PollOption, index: number): string {
  return opt.color ?? getPollOptionColor(index);
}

/** True when poll is closed because its auto-close timestamp has passed (vs forcefully closed). */
export function isPollAutoClosedByDate(p: Poll, now: number = Date.now()): boolean {
  return p.isOpen === true && typeof p.closesAt === "number" && p.closesAt <= now;
}

/** Format the poll's closing line: "Closes on Jan 5 (3 days away)" / "Closed on Jan 1 (2 days ago)". */
export function formatPollClosingLine(p: Poll, now: number = Date.now()): string {
  if (!p.closesAt) return p.isOpen ? "No close date" : "Closed";
  const d = new Date(p.closesAt);
  const dateLabel = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  const closed = !p.isOpen || p.closesAt <= now;
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const targetStart = new Date(p.closesAt);
  targetStart.setHours(0, 0, 0, 0);
  const diffDays = Math.round((targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  let rel: string;
  if (diffDays === 0) rel = closed ? "today" : "today";
  else if (diffDays > 0) rel = `${diffDays} day${diffDays === 1 ? "" : "s"} away`;
  else rel = `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`;
  return `${closed ? "Closed" : "Closes"} on ${dateLabel} (${rel})`;
}

/** A poll is effectively open only if explicitly open AND its close time (if any) is in the future. */
export function isPollEffectivelyOpen(p: Poll, now: number = Date.now()): boolean {
  if (!p.isOpen) return false;
  if (p.closesAt && p.closesAt <= now) return false;
  return true;
}

/** Returns the user's selected option ids as an array (handles legacy single-string format). */
export function getUserPollVotes(p: Poll, userId: string): string[] {
  const v = p.votes[userId];
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [v as unknown as string];
}

/** Total number of unique users who have voted at least once. */
export function getPollTotalVoters(p: Poll): number {
  let n = 0;
  for (const k in p.votes) {
    const arr = p.votes[k];
    if (Array.isArray(arr) ? arr.length > 0 : Boolean(arr)) n += 1;
  }
  return n;
}

/** Count of votes per option id. For multi-select polls each user may contribute to multiple options. */
export function getPollOptionCounts(p: Poll): Record<string, number> {
  const c: Record<string, number> = {};
  p.options.forEach((o) => (c[o.id] = 0));
  for (const userId in p.votes) {
    const arr = getUserPollVotes(p, userId);
    arr.forEach((optId) => {
      if (c[optId] !== undefined) c[optId] += 1;
    });
  }
  return c;
}

export function migratePoll(p: Record<string, unknown>): Poll {
  const rawOptions = (p.options as Record<string, unknown>[]) || [];
  const rawVotes = (p.votes as Record<string, unknown>) || {};
  const votes: Record<string, string[]> = {};
  Object.keys(rawVotes).forEach((uid) => {
    const v = rawVotes[uid];
    if (Array.isArray(v)) {
      votes[uid] = v.filter((x) => typeof x === "string") as string[];
    } else if (typeof v === "string" && v.length > 0) {
      votes[uid] = [v];
    }
  });
  return {
    id: (p.id as string) || `poll-${Date.now()}`,
    question: (p.question as string) || "",
    options: rawOptions.map((o, i) => ({
      id: (o.id as string) || `opt-${i}`,
      text: (o.text as string) || "",
      color: typeof o.color === "string" ? (o.color as string) : undefined,
    })),
    creatorId: (p.creatorId as string) || "m-1",
    isOpen: (p.isOpen as boolean) ?? true,
    closesAt: typeof p.closesAt === "number" ? (p.closesAt as number) : undefined,
    allowMultiple: (p.allowMultiple as boolean) ?? false,
    votes,
    createdAt: (p.createdAt as number) || Date.now(),
    color: typeof p.color === "string" ? (p.color as string) : "#2D8CFF",
    imageUri: typeof p.imageUri === "string" ? (p.imageUri as string) : undefined,
  };
}

export type EventType = "meeting" | "build" | "scrimmage" | "competition" | "outreach" | "other";

export interface TeamEvent {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm (24h) */
  startTime: string;
  /** HH:mm (24h) — optional */
  endTime?: string;
  type: EventType;
  description?: string;
  createdBy: string;
  createdAt: number;
}

export const EVENT_TYPE_INFO: { type: EventType; label: string; color: string }[] = [
  { type: "meeting", label: "Meeting", color: "#2D8CFF" },
  { type: "build", label: "Build", color: "#FF9500" },
  { type: "scrimmage", label: "Scrimmage", color: "#AF52DE" },
  { type: "competition", label: "Competition", color: "#FF453A" },
  { type: "outreach", label: "Outreach", color: "#34C759" },
  { type: "other", label: "Other", color: "#6B6B80" },
];

export function getEventTypeColor(type: EventType): string {
  return EVENT_TYPE_INFO.find((e) => e.type === type)?.color ?? "#6B6B80";
}

export function getEventTypeLabel(type: EventType): string {
  return EVENT_TYPE_INFO.find((e) => e.type === type)?.label ?? "Other";
}

/** Build a sortable timestamp from event date + start time. */
export function getEventStartTimestamp(e: TeamEvent): number {
  const [y, m, d] = e.date.split("-").map((x) => parseInt(x, 10));
  const [hh, mm] = (e.startTime || "00:00").split(":").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return 0;
  return new Date(y, m - 1, d, hh || 0, mm || 0).getTime();
}

export function formatTime12h(time: string): string {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatEventTimeRange(e: TeamEvent): string {
  const start = formatTime12h(e.startTime);
  if (!e.endTime) return start;
  return `${start} – ${formatTime12h(e.endTime)}`;
}

export function migrateEvent(e: Record<string, unknown>): TeamEvent {
  const validTypes: EventType[] = ["meeting", "build", "scrimmage", "competition", "outreach", "other"];
  const rawType = e.type as EventType;
  return {
    id: (e.id as string) || `event-${Date.now()}`,
    title: (e.title as string) || "",
    date: (e.date as string) || "",
    startTime: (e.startTime as string) || "00:00",
    endTime: typeof e.endTime === "string" ? (e.endTime as string) : undefined,
    type: validTypes.includes(rawType) ? rawType : "other",
    description: typeof e.description === "string" ? (e.description as string) : undefined,
    createdBy: (e.createdBy as string) || "m-1",
    createdAt: (e.createdAt as number) || Date.now(),
  };
}

export function migrateTask(task: Record<string, unknown>): TeamTask {
  const t = task as Record<string, unknown>;
  const assignedMembers = (t.assignedMembers as string[]) || [];
  const oldStatus = t.status as string | undefined;
  let defaultProgress = 0;
  if (oldStatus === "complete") defaultProgress = 100;
  else if (oldStatus === "finalizing") defaultProgress = 80;
  else if (oldStatus === "in_progress") defaultProgress = 50;

  const rawSubtasks = (t.subtasks as Record<string, unknown>[]) || [];

  return {
    id: (t.id as string) || `task-${Date.now()}`,
    name: (t.name as string) || "",
    description: (t.description as string) || "",
    color: (t.color as string) || "#007AFF",
    dueDate: (t.dueDate as string) || "",
    assignedMembers,
    editors: (t.editors as string[]) || [...assignedMembers],
    createdBy: (t.createdBy as string) || (assignedMembers[0] ?? "m-1"),
    subtasks: rawSubtasks.map((st, i) => ({
      id: (st.id as string) || `st-${i}`,
      title: (st.title as string) || "",
      color: (st.color as string) || SUBTASK_COLORS[i % SUBTASK_COLORS.length],
      progress: (st.progress as number) ?? ((st.completed as boolean) ? 100 : 0),
    })),
    progress: (t.progress as number) ?? defaultProgress,
    imageUri: t.imageUri as string | undefined,
    bannerUri: t.bannerUri as string | undefined,
  };
}
