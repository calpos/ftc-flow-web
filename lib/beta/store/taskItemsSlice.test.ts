import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteProject,
  deleteTaskItem,
  fetchWorkspace,
  insertProject,
  insertTaskItem,
  updateProject,
  updateTaskItem,
} from "@/lib/beta/remote/api";
import { resetRemoteContextForTests, setRemoteContext, trackWrite } from "@/lib/beta/remote/context";
import { resetAppStoreForTests, useAppStore } from "@/lib/beta/store/appStore";
import { resetRemoteWriteSequencerForTests } from "@/lib/beta/store/remoteWriteSequencer";
import { useToastStore } from "@/lib/beta/store/toastStore";
import type { AppData } from "@/lib/beta/storage";
import type { Task, TeamTask } from "@/lib/beta/types";

vi.mock(import("@/lib/beta/remote/api"), async (orig) => ({
  ...(await orig()),
  insertProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  insertTaskItem: vi.fn(),
  updateTaskItem: vi.fn(),
  deleteTaskItem: vi.fn(),
  // So a rollback never builds a real client.
  fetchWorkspace: vi.fn(),
}));

// The real trackWrite, wrapped so tests can see the slices' calls.
vi.mock(import("@/lib/beta/remote/context"), async (orig) => {
  const actual = await orig();
  return { ...actual, trackWrite: vi.fn(actual.trackWrite) };
});

const TEAM = "6f1c2a9e-3b7d-4e8a-9c1f-2d5b8a7e4c30";
const ALICE = "0b6e3c52-8d4f-4a1e-b7c9-5f2a1d8e6b04";
const P1 = "3c7a9e15-2b8d-4f6a-9e1c-8d4b2a7f5e03";
const P2 = "9d2e6b4a-1f7c-4a83-b5e9-3c8d1a6f2b70";
const C1 = "5b8e2f17-4a9d-4c36-8e1b-7d3a6c9f0e25";
const C2 = "e4a7c1d9-6b2f-4e58-9a3c-1f8d5b0e7a62";

const apiMocks = [
  insertProject,
  updateProject,
  deleteProject,
  insertTaskItem,
  updateTaskItem,
  deleteTaskItem,
].map((fn) => vi.mocked(fn));

// Every api mock but `called` stayed untouched: an action makes no stray writes.
function expectOnlyCalled(...called: unknown[]): void {
  for (const fn of apiMocks) if (!called.includes(fn)) expect(fn).not.toHaveBeenCalled();
}

const EMPTY: AppData = {
  members: [],
  tasks: [],
  taskItems: [],
  polls: [],
  events: [],
  currentUserId: ALICE,
};

function project(id: string, fields: Partial<TeamTask> = {}): TeamTask {
  return {
    id,
    name: "Drivetrain",
    description: "",
    color: "#007AFF",
    dueDate: "",
    assignedMembers: [],
    editors: [],
    createdBy: ALICE,
    subtasks: [],
    progress: 0,
    ...fields,
  };
}

function taskItem(id: string, fields: Partial<Task> = {}): Task {
  return {
    id,
    title: "Mount motors",
    description: "",
    color: "#2D8CFF",
    dueDate: "",
    assignedMembers: [],
    editors: [],
    subtasks: [],
    overrideFlag: false,
    progress: 0,
    createdBy: ALICE,
    createdAt: 0,
    ...fields,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Lets fire-and-forget work run: queued writes, trackWrite and its rollback.
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

// A Map-backed stand-in for window.localStorage.
function fakeStorage() {
  const items = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => items.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      items.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      items.delete(key);
    }),
  };
}

function toasts(): string[] {
  return useToastStore.getState().toasts.map((t) => t.message);
}

const store = () => useAppStore.getState();

beforeEach(() => {
  resetRemoteContextForTests();
  resetAppStoreForTests();
  resetRemoteWriteSequencerForTests();
  useToastStore.setState({ toasts: [] });
  // Resets every vi.fn to its original implementation: trackWrite stays real.
  vi.resetAllMocks();
  for (const fn of apiMocks) fn.mockResolvedValue(undefined);
  vi.mocked(fetchWorkspace).mockResolvedValue(EMPTY);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("task items slice in local mode", () => {
  it("updates the store without writing remotely", () => {
    const task = taskItem(C1, { parentProjectId: P1 });
    store().addTaskItem(task);
    expect(store().taskItems).toEqual([task]);

    const renamed = { ...task, title: "Mount servos" };
    store().updateTaskItem(renamed);
    expect(store().taskItems).toEqual([renamed]);

    store().deleteTaskItem(C1);
    expect(store().taskItems).toEqual([]);

    for (const fn of apiMocks) expect(fn).not.toHaveBeenCalled();
    expect(trackWrite).not.toHaveBeenCalled();
  });
});

describe("task items slice persistence", () => {
  let storage: ReturnType<typeof fakeStorage>;

  // Keys written since the last call. The saves are async, but setItem runs
  // before their first await, so it has landed by the time an action returns.
  function writtenKeys(): string[] {
    const keys = storage.setItem.mock.calls.map(([key]) => key);
    storage.setItem.mockClear();
    return keys;
  }

  beforeEach(() => {
    storage = fakeStorage();
    vi.stubGlobal("window", { localStorage: storage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes the task items key in local mode", () => {
    const task = taskItem(C1, { parentProjectId: P1 });
    store().addTaskItem(task);
    expect(writtenKeys()).toEqual(["ftc_flow_task_items"]);

    store().updateTaskItem({ ...task, title: "Mount servos" });
    expect(writtenKeys()).toEqual(["ftc_flow_task_items"]);

    store().deleteTaskItem(C1);
    expect(writtenKeys()).toEqual(["ftc_flow_task_items"]);
  });

  it("writes nothing to localStorage in remote mode", async () => {
    setRemoteContext({ teamId: TEAM, userId: ALICE });
    const task = taskItem(C1, { parentProjectId: P1 });
    store().addTaskItem(task);
    store().updateTaskItem({ ...task, title: "Mount servos" });
    store().deleteTaskItem(C1);
    await settle();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe("task items slice in remote mode", () => {
  beforeEach(() => {
    setRemoteContext({ teamId: TEAM, userId: ALICE });
  });

  it("addTaskItem inserts the task", async () => {
    const task = taskItem(C1, { parentProjectId: P1 });
    store().addTaskItem(task);
    expect(store().taskItems).toEqual([task]);
    expect(insertTaskItem).toHaveBeenCalledTimes(1);
    expect(insertTaskItem).toHaveBeenCalledWith(task, TEAM);
    expectOnlyCalled(insertTaskItem);
    expect(trackWrite).toHaveBeenCalledTimes(1);
    expect(trackWrite).toHaveBeenCalledWith(expect.any(Promise), "the new task");
    await settle();
    expect(toasts()).toEqual([]);
  });

  it("updateTaskItem updates the task", () => {
    useAppStore.setState({ taskItems: [taskItem(C1)] });
    const renamed = taskItem(C1, { title: "Mount servos" });
    store().updateTaskItem(renamed);
    expect(store().taskItems).toEqual([renamed]);
    expect(updateTaskItem).toHaveBeenCalledTimes(1);
    expect(updateTaskItem).toHaveBeenCalledWith(renamed);
    expectOnlyCalled(updateTaskItem);
    expect(trackWrite).toHaveBeenCalledWith(expect.any(Promise), "your changes to the task");
  });

  it("deleteTaskItem deletes the task", () => {
    const other = taskItem(C2);
    useAppStore.setState({ taskItems: [taskItem(C1, { parentProjectId: P1 }), other] });
    store().deleteTaskItem(C1);
    expect(store().taskItems).toEqual([other]);
    expect(deleteTaskItem).toHaveBeenCalledTimes(1);
    expect(deleteTaskItem).toHaveBeenCalledWith(C1);
    expectOnlyCalled(deleteTaskItem);
    expect(trackWrite).toHaveBeenCalledWith(expect.any(Promise), "the task deletion");
  });

  it("toasts a failed write instead of throwing", async () => {
    vi.mocked(insertTaskItem).mockRejectedValueOnce(new Error("Nope."));
    expect(() => store().addTaskItem(taskItem(C1))).not.toThrow();
    await settle();
    expect(toasts().some((t) => t.startsWith("Couldn't save the new task."))).toBe(true);
  });
});

describe("task item write ordering", () => {
  beforeEach(() => {
    setRemoteContext({ teamId: TEAM, userId: ALICE });
  });

  it("sends two quick updates to one task in order", async () => {
    useAppStore.setState({ taskItems: [taskItem(C1)] });
    const first = deferred<void>();
    vi.mocked(updateTaskItem).mockReturnValueOnce(first.promise);
    const one = taskItem(C1, { title: "One" });
    const two = taskItem(C1, { title: "Two" });

    store().updateTaskItem(one);
    store().updateTaskItem(two);
    expect(store().taskItems).toEqual([two]);
    await settle();
    expect(vi.mocked(updateTaskItem).mock.calls).toEqual([[one]]);

    first.resolve();
    await settle();
    expect(vi.mocked(updateTaskItem).mock.calls).toEqual([[one], [two]]);
  });

  it("an add under a project waits for the project's insert", async () => {
    const insert = deferred<void>();
    vi.mocked(insertProject).mockReturnValueOnce(insert.promise);
    const task = taskItem(C1, { parentProjectId: P1 });

    store().addTask(project(P1));
    store().addTaskItem(task);
    await settle();
    expect(insertTaskItem).not.toHaveBeenCalled();

    insert.resolve();
    await settle();
    expect(insertTaskItem).toHaveBeenCalledTimes(1);
    expect(insertTaskItem).toHaveBeenCalledWith(task, TEAM);
  });

  it("a move into a project waits for that project's insert", async () => {
    const task = taskItem(C1, { parentProjectId: P1 });
    useAppStore.setState({ tasks: [project(P1)], taskItems: [task] });
    const insert = deferred<void>();
    vi.mocked(insertProject).mockReturnValueOnce(insert.promise);

    store().addTask(project(P2));
    const moved = { ...task, parentProjectId: P2 };
    store().updateTaskItem(moved);
    await settle();
    expect(updateTaskItem).not.toHaveBeenCalled();

    insert.resolve();
    await settle();
    expect(updateTaskItem).toHaveBeenCalledTimes(1);
    expect(updateTaskItem).toHaveBeenCalledWith(moved);
  });

  it("a project delete waits for a task's move out of it", async () => {
    const task = taskItem(C1, { parentProjectId: P1 });
    useAppStore.setState({ tasks: [project(P1), project(P2)], taskItems: [task] });
    const move = deferred<void>();
    vi.mocked(updateTaskItem).mockReturnValueOnce(move.promise);

    const moved = { ...task, parentProjectId: P2 };
    store().updateTaskItem(moved);
    store().deleteTask(P1);
    // The task left P1 locally, so the delete keeps it.
    expect(store().taskItems).toEqual([moved]);
    await settle();
    expect(deleteProject).not.toHaveBeenCalled();

    move.resolve();
    await settle();
    expect(deleteProject).toHaveBeenCalledTimes(1);
    expect(deleteProject).toHaveBeenCalledWith(P1);
  });
});
