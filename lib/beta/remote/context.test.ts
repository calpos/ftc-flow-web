import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOT_FOUND, fetchWorkspace } from "@/lib/beta/remote/api";
import {
  getLastFetchAt,
  hasPendingWrites,
  refreshWorkspace,
  remoteErrorMessage,
  resetRemoteContextForTests,
  setRemoteContext,
  trackWrite,
} from "@/lib/beta/remote/context";
import { resetAppStoreForTests, useAppStore } from "@/lib/beta/store/appStore";
import { useToastStore } from "@/lib/beta/store/toastStore";
import type { AppData } from "@/lib/beta/storage";
import { friendlyError } from "@/lib/supabase/errors";

vi.mock(import("@/lib/beta/remote/api"), async (orig) => ({
  ...(await orig()),
  fetchWorkspace: vi.fn(),
}));

const TEAM = "6f1c2a9e-3b7d-4e8a-9c1f-2d5b8a7e4c30";
const OTHER_TEAM = "4d8b2f6a-1e3c-4a79-b5d2-8c6e0a9f3b17";
const ALICE = "0b6e3c52-8d4f-4a1e-b7c9-5f2a1d8e6b04";

const RELOAD_FAILED = "Couldn't reload your team. Refresh the page.";

const fetchMock = vi.mocked(fetchWorkspace);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Lets fire-and-forget work run: the rollback refresh, its dynamic import and
// the hydrate after it.
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

// A workspace whose one project is named `tag`, so tests can tell fetches apart.
function workspace(tag: string): AppData {
  return {
    members: [],
    tasks: [
      {
        id: "3c7a9e15-2b8d-4f6a-9e1c-8d4b2a7f5e03",
        name: tag,
        description: "",
        color: "#007AFF",
        dueDate: "",
        assignedMembers: [],
        editors: [],
        createdBy: ALICE,
        subtasks: [],
        progress: 0,
      },
    ],
    taskItems: [],
    polls: [],
    events: [],
    currentUserId: ALICE,
  };
}

function hydratedTag(): string | undefined {
  const state = useAppStore.getState();
  return state.hasHydrated ? state.tasks[0]?.name : undefined;
}

function toasts(): string[] {
  return useToastStore.getState().toasts.map((t) => t.message);
}

beforeEach(() => {
  resetRemoteContextForTests();
  resetAppStoreForTests();
  useToastStore.setState({ toasts: [] });
  fetchMock.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  setRemoteContext({ teamId: TEAM, userId: ALICE });
});

describe("trackWrite", () => {
  it("toasts a failed write and rolls back from the server", async () => {
    fetchMock.mockResolvedValue(workspace("server"));
    await expect(trackWrite(Promise.reject(new Error(NOT_FOUND)), "the project")).resolves.toBe(
      false,
    );
    expect(toasts()).toEqual([`Couldn't save the project. ${NOT_FOUND}`]);

    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(TEAM, ALICE);
    expect(hydratedTag()).toBe("server");
    expect(getLastFetchAt()).not.toBeNull();
  });

  it("resolves true for a successful write without toasting or fetching", async () => {
    await expect(trackWrite(Promise.resolve(), "the project")).resolves.toBe(true);
    await settle();
    expect(toasts()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("waits for pending writes, then rolls back once", async () => {
    fetchMock.mockResolvedValue(workspace("server"));
    const b = deferred<void>();
    const writeB = trackWrite(b.promise, "the task");
    await expect(trackWrite(Promise.reject(new Error(NOT_FOUND)), "the project")).resolves.toBe(
      false,
    );
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();

    b.resolve();
    await expect(writeB).resolves.toBe(true);
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(hydratedTag()).toBe("server");
  });

  it("discards a refresh that a write overlapped and refetches after it", async () => {
    const first = deferred<AppData>();
    fetchMock.mockReturnValueOnce(first.promise).mockResolvedValueOnce(workspace("second"));
    const refresh = refreshWorkspace();
    const write = deferred<void>();
    const tracked = trackWrite(write.promise, "the project");

    first.resolve(workspace("first"));
    await refresh;
    expect(hydratedTag()).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    write.resolve();
    await tracked;
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(hydratedTag()).toBe("second");
  });

  it("refetches when a write pending at the start drained before the fetch", async () => {
    const first = deferred<AppData>();
    fetchMock.mockReturnValueOnce(first.promise).mockResolvedValueOnce(workspace("second"));
    const write = deferred<void>();
    const tracked = trackWrite(write.promise, "the project");
    const refresh = refreshWorkspace();
    write.resolve();
    await tracked;

    first.resolve(workspace("first"));
    await refresh;
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(hydratedTag()).toBe("second");
  });

  it("only toasts a failed write from an old context", async () => {
    const write = deferred<void>();
    const tracked = trackWrite(write.promise, "the project");
    setRemoteContext({ teamId: OTHER_TEAM, userId: ALICE });
    write.reject(new Error(NOT_FOUND));

    await expect(tracked).resolves.toBe(false);
    await settle();
    expect(toasts()).toEqual([`Couldn't save the project. ${NOT_FOUND}`]);
    expect(fetchMock).not.toHaveBeenCalled();

    // The stale failure must not owe the new context a rollback either.
    await trackWrite(Promise.resolve(), "the task");
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("doesn't count a write from an old context against the new one", async () => {
    const stale = deferred<void>();
    const trackedStale = trackWrite(stale.promise, "the project");
    setRemoteContext({ teamId: OTHER_TEAM, userId: ALICE });
    const current = deferred<void>();
    const trackedCurrent = trackWrite(current.promise, "the task");

    stale.resolve();
    await trackedStale;
    expect(hasPendingWrites()).toBe(true);

    current.resolve();
    await trackedCurrent;
    expect(hasPendingWrites()).toBe(false);
  });

  it("only warns when a deferred refetch fails", async () => {
    const first = deferred<AppData>();
    fetchMock
      .mockReturnValueOnce(first.promise)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const refresh = refreshWorkspace().catch(() => {});
    await trackWrite(Promise.resolve(), "the project");

    first.resolve(workspace("first"));
    await refresh;
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(toasts()).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to refetch the workspace:",
      expect.any(TypeError),
    );
  });

  it("still owes a rollback after its refresh is discarded", async () => {
    const rollback = deferred<AppData>();
    fetchMock
      .mockReturnValueOnce(rollback.promise)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await trackWrite(Promise.reject(new Error(NOT_FOUND)), "the project");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Overlaps the rollback refresh, so its result is discarded.
    await trackWrite(Promise.resolve(), "the task");
    rollback.resolve(workspace("stale"));
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(hydratedTag()).toBeUndefined();
    expect(toasts()).toEqual([`Couldn't save the project. ${NOT_FOUND}`, RELOAD_FAILED]);
  });
});

describe("refreshWorkspace", () => {
  it("drops a result from an old context", async () => {
    const fetch = deferred<AppData>();
    fetchMock.mockReturnValueOnce(fetch.promise);
    const refresh = refreshWorkspace();
    setRemoteContext({ teamId: OTHER_TEAM, userId: ALICE });

    fetch.resolve(workspace("team a"));
    await expect(refresh).resolves.toBeUndefined();
    expect(hydratedTag()).toBeUndefined();
    expect(getLastFetchAt()).toBeNull();
  });

  it("does nothing without a context", async () => {
    setRemoteContext(null);
    await refreshWorkspace();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shares one fetch between concurrent calls", async () => {
    fetchMock.mockResolvedValue(workspace("server"));
    const a = refreshWorkspace();
    const b = refreshWorkspace();
    expect(b).toBe(a);
    await Promise.all([a, b]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(hydratedTag()).toBe("server");
  });

  it("maps a failed store import to friendly copy", async () => {
    fetchMock.mockResolvedValueOnce(workspace("server"));
    // Vitest rethrows this as its own plain Error with raw text, the same
    // shape as Turbopack's "Failed to load chunk" error.
    vi.doMock(import("@/lib/beta/store/appStore"), () => {
      throw new Error("Failed to load chunk /_next/static/chunks/appStore.js");
    });
    try {
      const error: unknown = await refreshWorkspace().then(
        () => undefined,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(Error);
      expect(remoteErrorMessage(error)).toBe(friendlyError(undefined));
      expect((error as Error).cause).toBeInstanceOf(Error);
    } finally {
      vi.doUnmock(import("@/lib/beta/store/appStore"));
    }
  });

  it("rejects with the api error", async () => {
    const error = new Error(NOT_FOUND);
    fetchMock.mockRejectedValueOnce(error);
    await expect(refreshWorkspace()).rejects.toBe(error);
  });

  it("toasts when the rollback refresh fails", async () => {
    fetchMock.mockRejectedValue(new Error(friendlyError("not_team_member")));
    await trackWrite(Promise.reject(new Error(NOT_FOUND)), "the project");
    await settle();
    expect(toasts()).toEqual([`Couldn't save the project. ${NOT_FOUND}`, RELOAD_FAILED]);
  });
});

describe("remoteErrorMessage", () => {
  it("keeps the copy of a plain Error from api.ts", () => {
    expect(remoteErrorMessage(new Error(NOT_FOUND))).toBe(NOT_FOUND);
  });

  it("maps a PostgrestError by code", () => {
    const error = Object.assign(new Error("permission denied for table projects"), {
      name: "PostgrestError",
      code: "42501",
    });
    expect(remoteErrorMessage(error)).toBe("You don't have permission to do that.");
  });

  it("maps a fetch TypeError to the network copy", () => {
    expect(remoteErrorMessage(new TypeError("Failed to fetch"))).toBe(
      "Can't reach FTC Flow. Check your connection and try again.",
    );
  });

  it("falls back for an Error without a message", () => {
    expect(remoteErrorMessage(new Error(""))).toBe(friendlyError(undefined));
    expect(remoteErrorMessage(new Error(""))).toBe("Something went wrong. Try again.");
  });
});
