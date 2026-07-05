import {
  MOCK_EVENTS,
  MOCK_MEMBERS,
  MOCK_POLLS,
  MOCK_PROJECTS,
  MOCK_TASK_ITEMS,
} from "@/lib/beta/mocks";
import {
  Poll,
  Task,
  TeamEvent,
  TeamMember,
  TeamTask,
  migrateEvent,
  migratePoll,
  migrateTask,
  migrateTaskItem,
} from "@/lib/beta/types";

/**
 * Web port of the app's appStorage.ts. Same AppData shape and same exported
 * function names so the Zustand slices are reused verbatim — only the backing
 * store changes from AsyncStorage to browser localStorage. All functions stay
 * async so the slices' fire-and-forget `saveWithWarning(label, Promise)` works
 * unchanged. SSR-safe: every access is guarded by a `typeof window` check.
 */

const MEMBERS_KEY = "ftc_flow_members";
const TASKS_KEY = "ftc_flow_tasks";
const USER_KEY = "ftc_flow_current_user";
const POLLS_KEY = "ftc_flow_polls";
const EVENTS_KEY = "ftc_flow_events";
const TASK_ITEMS_KEY = "ftc_flow_task_items";

export interface AppData {
  members: TeamMember[];
  tasks: TeamTask[];
  polls: Poll[];
  events: TeamEvent[];
  taskItems: Task[];
  currentUserId: string;
}

function getItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to write ${key} to localStorage:`, error);
  }
}

function parseArray(str: string | null): Record<string, unknown>[] | null {
  if (!str) return null;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : null;
  } catch {
    return null;
  }
}

export async function loadAppData(): Promise<AppData> {
  const membersStr = getItem(MEMBERS_KEY);
  const tasksStr = getItem(TASKS_KEY);
  const userIdStr = getItem(USER_KEY);
  const pollsStr = getItem(POLLS_KEY);
  const eventsStr = getItem(EVENTS_KEY);
  const taskItemsStr = getItem(TASK_ITEMS_KEY);

  const rawMembers = parseArray(membersStr);
  const members: TeamMember[] = rawMembers
    ? (rawMembers as unknown as TeamMember[])
    : MOCK_MEMBERS;

  const rawTasks = parseArray(tasksStr);
  const tasks: TeamTask[] = rawTasks ? rawTasks.map(migrateTask) : MOCK_PROJECTS;

  const rawTaskItems = parseArray(taskItemsStr);
  const taskItems: Task[] = rawTaskItems
    ? rawTaskItems.map(migrateTaskItem)
    : MOCK_TASK_ITEMS;

  const rawPolls = parseArray(pollsStr);
  const polls: Poll[] = rawPolls ? rawPolls.map(migratePoll) : MOCK_POLLS;

  const rawEvents = parseArray(eventsStr);
  const events: TeamEvent[] = rawEvents ? rawEvents.map(migrateEvent) : MOCK_EVENTS;

  const currentUserId = userIdStr || "m-1";

  return { members, tasks, polls, events, taskItems, currentUserId };
}

export async function saveMembers(members: TeamMember[]): Promise<void> {
  setItem(MEMBERS_KEY, JSON.stringify(members));
}

export async function saveTasks(tasks: TeamTask[]): Promise<void> {
  setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function savePolls(polls: Poll[]): Promise<void> {
  setItem(POLLS_KEY, JSON.stringify(polls));
}

export async function saveEvents(events: TeamEvent[]): Promise<void> {
  setItem(EVENTS_KEY, JSON.stringify(events));
}

export async function saveTaskItems(taskItems: Task[]): Promise<void> {
  setItem(TASK_ITEMS_KEY, JSON.stringify(taskItems));
}

export async function saveCurrentUserId(id: string): Promise<void> {
  setItem(USER_KEY, id);
}

/** Wipe all beta data so the demo reseeds from mocks on next load. */
export async function resetBetaData(): Promise<void> {
  if (typeof window === "undefined") return;
  [MEMBERS_KEY, TASKS_KEY, USER_KEY, POLLS_KEY, EVENTS_KEY, TASK_ITEMS_KEY].forEach(
    (key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  );
}
