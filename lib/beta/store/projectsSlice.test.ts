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
import {
  hasPendingWrites,
  resetRemoteContextForTests,
  setRemoteContext,
  trackWrite,
} from "@/lib/beta/remote/context";
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
const OTHER_TEAM = "a3d8f2c6-7b1e-4f94-8c5a-0e6b9d4f2a87";
const ALICE = "0b6e3c52-8d4f-4a1e-b7c9-5f2a1d8e6b04";
const P1 = "3c7a9e15-2b8d-4f6a-9e1c-8d4b2a7f5e03";
const P2 = "9d2e6b4a-1f7c-4a83-b5e9-3c8d1a6f2b70";
const C1 = "5b8e2f17-4a9d-4c36-8e1b-7d3a6c9f0e25";
const C2 = "e4a7c1d9-6b2f-4e58-9a3c-1f8d5b0e7a62";
const C3 = "2f9c6e8b-3d1a-4b75-a6e4-8c0b7d2f5a19";
const C4 = "8a1d5f3c-7e2b-4d96-b0c8-4f6e9a2d1b57";
const C5 = "c6e0b9a2-5d4f-4183-9b7e-2a8c3f1d6e04";
const C6 = "1e7f4a8d-9c3b-4e25-8d6a-5b0f2c9e7a31";

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

describe("projects slice in local mode", () => {
  it("updates the store without writing remotely", () => {
    const p1 = project(P1, { dueDate: "2026-11-01" });
    const child = taskItem(C1, { parentProjectId: P1, dueDate: "2026-11-01" });
    useAppStore.setState({ tasks: [p1], taskItems: [child] });

    const p2 = project(P2);
    store().addTask(p2);
    expect(store().tasks).toEqual([p1, p2]);

    const renamed = { ...p2, name: "Intake" };
    store().updateTask(renamed);
    expect(store().tasks).toEqual([p1, renamed]);

    const moved = { ...p1, dueDate: "2026-10-20" };
    store().updateProjectWithCascade(moved);
    expect(store().tasks).toEqual([moved, renamed]);
    expect(store().taskItems).toEqual([{ ...child, dueDate: "2026-10-20" }]);

    store().deleteTask(P1);
    expect(store().tasks).toEqual([renamed]);
    expect(store().taskItems).toEqual([]);

    for (const fn of apiMocks) expect(fn).not.toHaveBeenCalled();
    expect(trackWrite).not.toHaveBeenCalled();
  });
});

describe("projects slice persistence", () => {
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

  it("writes the same keys as before in local mode", () => {
    const child = taskItem(C1, { parentProjectId: P1, dueDate: "2026-11-01" });
    useAppStore.setState({ tasks: [project(P1, { dueDate: "2026-11-01" })], taskItems: [child] });

    store().addTask(project(P2));
    expect(writtenKeys()).toEqual(["ftc_flow_tasks"]);

    store().updateTask(project(P2, { name: "Intake" }));
    expect(writtenKeys()).toEqual(["ftc_flow_tasks"]);

    // No child changed, so the task items aren't rewritten.
    store().updateProjectWithCascade(project(P1, { name: "Intake", dueDate: "2026-11-01" }));
    expect(writtenKeys()).toEqual(["ftc_flow_tasks"]);

    store().updateProjectWithCascade(project(P1, { dueDate: "2026-10-20" }));
    expect(writtenKeys()).toEqual(["ftc_flow_tasks", "ftc_flow_task_items"]);

    store().deleteTask(P1);
    expect(writtenKeys()).toEqual(["ftc_flow_tasks", "ftc_flow_task_items"]);
  });

  it("writes nothing to localStorage in remote mode", async () => {
    setRemoteContext({ teamId: TEAM, userId: ALICE });
    const child = taskItem(C1, { parentProjectId: P1, dueDate: "2026-11-01" });
    useAppStore.setState({ tasks: [project(P1, { dueDate: "2026-11-01" })], taskItems: [child] });

    store().addTask(project(P2));
    store().updateTask(project(P2, { name: "Intake" }));
    store().updateProjectWithCascade(project(P1, { dueDate: "2026-10-20" }));
    store().deleteTask(P1);
    await settle();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe("projects slice in remote mode", () => {
  beforeEach(() => {
    setRemoteContext({ teamId: TEAM, userId: ALICE });
  });

  it("addTask inserts the project", async () => {
    const p = project(P1);
    store().addTask(p);
    expect(store().tasks).toEqual([p]);
    expect(insertProject).toHaveBeenCalledTimes(1);
    expect(insertProject).toHaveBeenCalledWith(p, TEAM);
    expectOnlyCalled(insertProject);
    expect(trackWrite).toHaveBeenCalledTimes(1);
    expect(trackWrite).toHaveBeenCalledWith(expect.any(Promise), "the new project");
    await settle();
    expect(toasts()).toEqual([]);
  });

  it("updateTask updates the project", () => {
    useAppStore.setState({ tasks: [project(P1)] });
    const renamed = project(P1, { name: "Intake" });
    store().updateTask(renamed);
    expect(store().tasks).toEqual([renamed]);
    expect(updateProject).toHaveBeenCalledTimes(1);
    expect(updateProject).toHaveBeenCalledWith(renamed);
    expectOnlyCalled(updateProject);
    expect(trackWrite).toHaveBeenCalledWith(expect.any(Promise), "your changes to the project");
  });

  it("deleteTask deletes only the project, since the FK cascades its tasks", () => {
    const other = taskItem(C3, { parentProjectId: P2 });
    useAppStore.setState({
      tasks: [project(P1), project(P2)],
      taskItems: [
        taskItem(C1, { parentProjectId: P1 }),
        taskItem(C2, { parentProjectId: P1 }),
        other,
      ],
    });
    store().deleteTask(P1);
    expect(store().tasks).toEqual([project(P2)]);
    expect(store().taskItems).toEqual([other]);
    expect(deleteProject).toHaveBeenCalledTimes(1);
    expect(deleteProject).toHaveBeenCalledWith(P1);
    expectOnlyCalled(deleteProject);
    expect(trackWrite).toHaveBeenCalledWith(expect.any(Promise), "the project deletion");
  });

  it("applies a change locally before its write lands", async () => {
    const insert = deferred<void>();
    vi.mocked(insertProject).mockReturnValueOnce(insert.promise);
    const p = project(P1);
    store().addTask(p);
    expect(store().tasks).toEqual([p]);
    expect(hasPendingWrites()).toBe(true);

    insert.resolve();
    await settle();
    expect(hasPendingWrites()).toBe(false);
  });

  it("toasts a failed write instead of throwing", async () => {
    vi.mocked(insertProject).mockRejectedValueOnce(new Error("Nope."));
    expect(() => store().addTask(project(P1))).not.toThrow();
    await settle();
    expect(toasts().some((t) => t.startsWith("Couldn't save the new project."))).toBe(true);
  });
});

describe("updateProjectWithCascade in remote mode", () => {
  beforeEach(() => {
    setRemoteContext({ teamId: TEAM, userId: ALICE });
  });

  it("sends the project and only the tasks whose due date changed", () => {
    const tracking = taskItem(C1, { parentProjectId: P1, dueDate: "2026-11-01" });
    const alreadySame = taskItem(C2, { parentProjectId: P1, dueDate: "2026-10-20" });
    const overrideLater = taskItem(C3, {
      parentProjectId: P1,
      overrideFlag: true,
      dueDate: "2026-10-25",
    });
    const overrideEarlier = taskItem(C4, {
      parentProjectId: P1,
      overrideFlag: true,
      dueDate: "2026-10-10",
    });
    const overrideEmpty = taskItem(C5, { parentProjectId: P1, overrideFlag: true, dueDate: "" });
    const otherProject = taskItem(C6, { parentProjectId: P2, dueDate: "2026-12-01" });
    useAppStore.setState({
      tasks: [project(P1, { dueDate: "2026-11-01" }), project(P2)],
      taskItems: [tracking, alreadySame, overrideLater, overrideEarlier, overrideEmpty, otherProject],
    });

    const moved = project(P1, { dueDate: "2026-10-20" });
    store().updateProjectWithCascade(moved);

    const trackingNext = { ...tracking, dueDate: "2026-10-20" };
    const clamped = { ...overrideLater, dueDate: "2026-10-20" };
    expect(store().tasks).toEqual([moved, project(P2)]);
    expect(store().taskItems).toEqual([
      trackingNext,
      alreadySame,
      clamped,
      overrideEarlier,
      overrideEmpty,
      otherProject,
    ]);
    expect(store().taskItems[5]).toBe(otherProject);

    expect(updateProject).toHaveBeenCalledTimes(1);
    expect(updateProject).toHaveBeenCalledWith(moved);
    expect(vi.mocked(updateTaskItem).mock.calls).toEqual([[trackingNext], [clamped]]);
    expectOnlyCalled(updateProject, updateTaskItem);
    expect(trackWrite).toHaveBeenCalledTimes(1);
    expect(trackWrite).toHaveBeenCalledWith(expect.any(Promise), "your changes to the project");
  });

  it("doesn't clamp an override task to a project with no due date", () => {
    const override = taskItem(C1, { parentProjectId: P1, overrideFlag: true, dueDate: "2026-10-25" });
    useAppStore.setState({
      tasks: [project(P1, { dueDate: "2026-11-01" })],
      taskItems: [override],
    });
    store().updateProjectWithCascade(project(P1, { dueDate: "" }));
    expect(store().taskItems).toEqual([override]);
    expect(updateTaskItem).not.toHaveBeenCalled();
    expect(updateProject).toHaveBeenCalledTimes(1);
  });

  it("updates only the project when no task changed", () => {
    const same = taskItem(C1, { parentProjectId: P1, dueDate: "2026-11-01" });
    useAppStore.setState({ tasks: [project(P1, { dueDate: "2026-11-01" })], taskItems: [same] });
    const renamed = project(P1, { name: "Intake", dueDate: "2026-11-01" });
    store().updateProjectWithCascade(renamed);
    expect(updateProject).toHaveBeenCalledTimes(1);
    expect(updateProject).toHaveBeenCalledWith(renamed);
    expectOnlyCalled(updateProject);
    expect(trackWrite).toHaveBeenCalledTimes(1);
  });

  it("stays pending until every part lands, even after the project update fails", async () => {
    const child = taskItem(C1, { parentProjectId: P1, dueDate: "2026-11-01" });
    useAppStore.setState({ tasks: [project(P1, { dueDate: "2026-11-01" })], taskItems: [child] });
    const childUpdate = deferred<void>();
    vi.mocked(updateProject).mockRejectedValueOnce(new Error("Nope."));
    vi.mocked(updateTaskItem).mockReturnValueOnce(childUpdate.promise);

    store().updateProjectWithCascade(project(P1, { dueDate: "2026-10-20" }));
    await settle();
    expect(hasPendingWrites()).toBe(true);
    expect(toasts()).toEqual([]);
    expect(fetchWorkspace).not.toHaveBeenCalled();

    childUpdate.resolve();
    await settle();
    expect(hasPendingWrites()).toBe(false);
    expect(toasts()).toEqual(["Couldn't save your changes to the project. Nope."]);
    expect(fetchWorkspace).toHaveBeenCalledTimes(1);
  });
});

describe("project write ordering", () => {
  beforeEach(() => {
    setRemoteContext({ teamId: TEAM, userId: ALICE });
  });

  it("re-adding a deleted project waits for the delete", async () => {
    const p = project(P1);
    useAppStore.setState({ tasks: [p] });
    const del = deferred<void>();
    vi.mocked(deleteProject).mockReturnValueOnce(del.promise);

    store().deleteTask(P1);
    store().addTask(p);
    expect(store().tasks).toEqual([p]);
    await settle();
    expect(insertProject).not.toHaveBeenCalled();

    del.resolve();
    await settle();
    expect(insertProject).toHaveBeenCalledTimes(1);
    expect(insertProject).toHaveBeenCalledWith(p, TEAM);
  });

  it("a write queued before a team switch still goes to the old team", async () => {
    const p = project(P1);
    useAppStore.setState({ tasks: [p] });
    const del = deferred<void>();
    vi.mocked(deleteProject).mockReturnValueOnce(del.promise);

    store().deleteTask(P1);
    store().addTask(p);
    setRemoteContext({ teamId: OTHER_TEAM, userId: ALICE });
    del.resolve();
    await settle();
    expect(insertProject).toHaveBeenCalledTimes(1);
    expect(insertProject).toHaveBeenCalledWith(p, TEAM);
  });

  it("undoing a project delete re-inserts the project, then its task", async () => {
    const p = project(P1);
    const child = taskItem(C1, { parentProjectId: P1 });
    useAppStore.setState({ tasks: [p], taskItems: [child] });
    const del = deferred<void>();
    const insert = deferred<void>();
    vi.mocked(deleteProject).mockReturnValueOnce(del.promise);
    vi.mocked(insertProject).mockReturnValueOnce(insert.promise);

    store().deleteTask(P1);
    store().addTask(p);
    store().addTaskItem(child);
    await settle();
    expect(deleteProject).toHaveBeenCalledTimes(1);
    expect(insertProject).not.toHaveBeenCalled();
    expect(insertTaskItem).not.toHaveBeenCalled();

    del.resolve();
    await settle();
    expect(insertProject).toHaveBeenCalledWith(p, TEAM);
    expect(insertTaskItem).not.toHaveBeenCalled();

    insert.resolve();
    await settle();
    expect(insertTaskItem).toHaveBeenCalledTimes(1);
    expect(insertTaskItem).toHaveBeenCalledWith(child, TEAM);
  });

  it("re-inserts after a failed delete", async () => {
    const p = project(P1);
    useAppStore.setState({ tasks: [p] });
    const del = deferred<void>();
    vi.mocked(deleteProject).mockReturnValueOnce(del.promise);

    store().deleteTask(P1);
    store().addTask(p);
    del.reject(new Error("Nope."));
    await settle();
    expect(insertProject).toHaveBeenCalledTimes(1);
    expect(insertProject).toHaveBeenCalledWith(p, TEAM);
    expect(toasts()).toContain("Couldn't save the project deletion. Nope.");
  });

  it("an update right after an add waits for the insert", async () => {
    const insert = deferred<void>();
    vi.mocked(insertProject).mockReturnValueOnce(insert.promise);
    store().addTask(project(P1));
    const renamed = project(P1, { name: "Intake" });
    store().updateTask(renamed);
    await settle();
    expect(updateProject).not.toHaveBeenCalled();

    insert.resolve();
    await settle();
    expect(updateProject).toHaveBeenCalledTimes(1);
    expect(updateProject).toHaveBeenCalledWith(renamed);
  });

  it("a project delete waits for its task's update in flight", async () => {
    const child = taskItem(C1, { parentProjectId: P1 });
    useAppStore.setState({ tasks: [project(P1)], taskItems: [child] });
    const update = deferred<void>();
    vi.mocked(updateTaskItem).mockReturnValueOnce(update.promise);

    store().updateTaskItem({ ...child, title: "Mount servos" });
    store().deleteTask(P1);
    await settle();
    expect(deleteProject).not.toHaveBeenCalled();

    update.resolve();
    await settle();
    expect(deleteProject).toHaveBeenCalledTimes(1);
    expect(deleteProject).toHaveBeenCalledWith(P1);
  });
});
