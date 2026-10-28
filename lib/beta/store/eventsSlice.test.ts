import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/lib/beta/remote/api";
import {
  hasPendingWrites,
  resetRemoteContextForTests,
  setRemoteContext,
} from "@/lib/beta/remote/context";
import { resetAppStoreForTests, useAppStore } from "@/lib/beta/store/appStore";
import {
  eventWriteChainCountForTests,
  resetEventWritesForTests,
} from "@/lib/beta/store/eventsSlice";
import { resetPollWritesForTests } from "@/lib/beta/store/pollsSlice";
import { useToastStore } from "@/lib/beta/store/toastStore";
import { saveEvents } from "@/lib/beta/storage";
import type { TeamEvent } from "@/lib/beta/types";

vi.mock(import("@/lib/beta/remote/api"));
vi.mock(import("@/lib/beta/storage"), async (orig) => ({
  ...(await orig()),
  savePolls: vi.fn(async () => {}),
  saveEvents: vi.fn(async () => {}),
}));

const TEAM = "6f1c2a9e-3b7d-4e8a-9c1f-2d5b8a7e4c30";
const ALICE = "0b6e3c52-8d4f-4a1e-b7c9-5f2a1d8e6b04";
const EVENT_ID = "8d2b6f40-3e9a-4c17-b5d8-2a6e1f0c9b73";
const OTHER_EVENT_ID = "1f7e3a9c-5b2d-4e68-a0c4-9d3b7e2f6a15";

const saveEventsMock = vi.mocked(saveEvents);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Lets queued writes and trackWrite's bookkeeping run.
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

function toasts(): string[] {
  return useToastStore.getState().toasts.map((t) => t.message);
}

function makeEvent(overrides: Partial<TeamEvent> = {}): TeamEvent {
  return {
    id: EVENT_ID,
    title: "Build session",
    date: "2026-10-20",
    startTime: "16:00",
    endTime: "18:00",
    type: "build",
    createdBy: ALICE,
    createdAt: 1_700_000_000_000,
    ...overrides,
  };
}

function events(): TeamEvent[] {
  return useAppStore.getState().events;
}

// Seeds state directly, so no save or write is attributed to the setup.
function seed(...list: TeamEvent[]): void {
  useAppStore.setState({ events: list });
}

function expectNoApiCalls(): void {
  expect(api.insertEvent).not.toHaveBeenCalled();
  expect(api.updateEvent).not.toHaveBeenCalled();
  expect(api.deleteEvent).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  resetRemoteContextForTests();
  resetAppStoreForTests();
  resetPollWritesForTests();
  resetEventWritesForTests();
  useToastStore.setState({ toasts: [] });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.mocked(api.insertPoll).mockResolvedValue(undefined);
  vi.mocked(api.updatePoll).mockResolvedValue(undefined);
  vi.mocked(api.deletePoll).mockResolvedValue(undefined);
  vi.mocked(api.setPollVote).mockResolvedValue(undefined);
  vi.mocked(api.insertEvent).mockResolvedValue(undefined);
  vi.mocked(api.updateEvent).mockResolvedValue(undefined);
  vi.mocked(api.deleteEvent).mockResolvedValue(undefined);
  // A rollback refresh never hydrates over the state under test.
  vi.mocked(api.fetchWorkspace).mockReturnValue(new Promise(() => {}));
});

describe("eventsSlice in remote mode", () => {
  beforeEach(() => {
    setRemoteContext({ teamId: TEAM, userId: ALICE });
  });

  it("addEvent appends and inserts the event", async () => {
    const existing = makeEvent({ id: OTHER_EVENT_ID });
    seed(existing);
    const event = makeEvent();
    useAppStore.getState().addEvent(event);

    expect(events()).toEqual([existing, event]);
    await settle();
    expect(api.insertEvent).toHaveBeenCalledTimes(1);
    expect(api.insertEvent).toHaveBeenCalledWith(event, TEAM);
    expect(saveEventsMock).toHaveBeenCalledTimes(1);
  });

  it("updateEvent replaces the event and updates it", async () => {
    seed(makeEvent());
    const edited = makeEvent({ title: "Scrimmage prep" });
    useAppStore.getState().updateEvent(edited);

    expect(events()).toEqual([edited]);
    await settle();
    expect(api.updateEvent).toHaveBeenCalledTimes(1);
    expect(api.updateEvent).toHaveBeenCalledWith(edited);
  });

  it("deleteEvent removes the event and deletes it", async () => {
    seed(makeEvent());
    useAppStore.getState().deleteEvent(EVENT_ID);

    expect(events()).toEqual([]);
    await settle();
    expect(api.deleteEvent).toHaveBeenCalledTimes(1);
    expect(api.deleteEvent).toHaveBeenCalledWith(EVENT_ID);
  });

  it("sends nothing for an unknown id", async () => {
    seed(makeEvent({ id: OTHER_EVENT_ID }));
    useAppStore.getState().updateEvent(makeEvent());
    useAppStore.getState().deleteEvent(EVENT_ID);

    await settle();
    expectNoApiCalls();
    expect(hasPendingWrites()).toBe(false);
  });

  it("re-adding a deleted event waits for the delete", async () => {
    const event = makeEvent();
    seed(event);
    const del = deferred<void>();
    vi.mocked(api.deleteEvent).mockReturnValueOnce(del.promise);

    useAppStore.getState().deleteEvent(EVENT_ID);
    useAppStore.getState().addEvent(event);
    await settle();
    expect(api.deleteEvent).toHaveBeenCalledTimes(1);
    expect(api.insertEvent).not.toHaveBeenCalled();
    expect(hasPendingWrites()).toBe(true);

    del.resolve();
    await settle();
    expect(api.insertEvent).toHaveBeenCalledTimes(1);
    expect(api.insertEvent).toHaveBeenCalledWith(event, TEAM);
    expect(vi.mocked(api.deleteEvent).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(api.insertEvent).mock.invocationCallOrder[0],
    );
    expect(hasPendingWrites()).toBe(false);
    expect(eventWriteChainCountForTests()).toBe(0);
    expect(events()).toEqual([event]);
  });

  it("a failed write doesn't block the next one for the same event", async () => {
    seed(makeEvent());
    vi.mocked(api.updateEvent).mockRejectedValueOnce(new Error("Network down."));
    const first = makeEvent({ title: "First" });
    const second = makeEvent({ title: "Second" });

    useAppStore.getState().updateEvent(first);
    useAppStore.getState().updateEvent(second);
    await settle();
    expect(api.updateEvent).toHaveBeenCalledTimes(2);
    expect(api.updateEvent).toHaveBeenNthCalledWith(1, first);
    expect(api.updateEvent).toHaveBeenNthCalledWith(2, second);
    expect(toasts()).toEqual(["Couldn't save the event. Network down."]);
  });

  it("writes for different events don't wait on each other", async () => {
    seed(makeEvent(), makeEvent({ id: OTHER_EVENT_ID }));
    const slow = deferred<void>();
    vi.mocked(api.updateEvent).mockReturnValueOnce(slow.promise);
    const other = makeEvent({ id: OTHER_EVENT_ID, title: "Fast" });

    useAppStore.getState().updateEvent(makeEvent({ title: "Slow" }));
    useAppStore.getState().updateEvent(other);
    await settle();
    expect(api.updateEvent).toHaveBeenCalledTimes(2);
    expect(api.updateEvent).toHaveBeenNthCalledWith(2, other);

    slow.resolve();
    await settle();
    expect(hasPendingWrites()).toBe(false);
    expect(eventWriteChainCountForTests()).toBe(0);
  });
});

describe("eventsSlice in local mode", () => {
  it("applies every action locally and sends nothing", async () => {
    const store = useAppStore.getState();
    const existing = makeEvent({ id: OTHER_EVENT_ID });
    seed(existing);
    const event = makeEvent();

    store.addEvent(event);
    expect(events()).toEqual([existing, event]);
    expect(saveEventsMock).toHaveBeenCalledTimes(1);

    const edited = makeEvent({ title: "Edited" });
    store.updateEvent(edited);
    expect(events()).toEqual([existing, edited]);
    expect(saveEventsMock).toHaveBeenCalledTimes(2);

    store.deleteEvent(EVENT_ID);
    expect(events()).toEqual([existing]);
    expect(saveEventsMock).toHaveBeenCalledTimes(3);
    expect(saveEventsMock).toHaveBeenLastCalledWith([existing]);

    await settle();
    expectNoApiCalls();
    expect(hasPendingWrites()).toBe(false);
  });
});
