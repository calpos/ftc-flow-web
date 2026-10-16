import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/lib/beta/remote/api";
import {
  hasPendingWrites,
  resetRemoteContextForTests,
  setRemoteContext,
} from "@/lib/beta/remote/context";
import { resetAppStoreForTests, useAppStore } from "@/lib/beta/store/appStore";
import { resetEventWritesForTests } from "@/lib/beta/store/eventsSlice";
import {
  pollWriteChainCountForTests,
  resetPollWritesForTests,
} from "@/lib/beta/store/pollsSlice";
import { useToastStore } from "@/lib/beta/store/toastStore";
import { savePolls } from "@/lib/beta/storage";
import type { Poll } from "@/lib/beta/types";

vi.mock(import("@/lib/beta/remote/api"));
vi.mock(import("@/lib/beta/storage"), async (orig) => ({
  ...(await orig()),
  savePolls: vi.fn(async () => {}),
  saveEvents: vi.fn(async () => {}),
}));

const TEAM = "6f1c2a9e-3b7d-4e8a-9c1f-2d5b8a7e4c30";
const ALICE = "0b6e3c52-8d4f-4a1e-b7c9-5f2a1d8e6b04";
const BOB = "9a2d7e41-5c3b-4f8e-a6d1-3e7b0c9f2a58";
const POLL_ID = "2e8f4b17-6a3c-4d9e-8b5f-1c7a0d3e9b62";
const OTHER_POLL_ID = "7c3a1e95-0d6b-4f2a-9e8c-4b5d2a1f7e30";
const A = "5b1d8f3a-2c7e-4a96-b0d4-8e3f6a2c1b75";
const B = "d4e9a2c6-7f1b-4e3d-a5c8-0b6f2e9d3a17";

const savePollsMock = vi.mocked(savePolls);

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

function makePoll(overrides: Partial<Poll> = {}): Poll {
  return {
    id: POLL_ID,
    question: "Which drivetrain?",
    options: [
      { id: A, text: "Mecanum" },
      { id: B, text: "Tank" },
    ],
    creatorId: ALICE,
    isOpen: true,
    allowMultiple: false,
    votes: {},
    createdAt: 1_700_000_000_000,
    color: "#2D8CFF",
    ...overrides,
  };
}

function polls(): Poll[] {
  return useAppStore.getState().polls;
}

// Seeds state directly, so no save or write is attributed to the setup.
function seed(...list: Poll[]): void {
  useAppStore.setState({ polls: list });
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

function expectNoApiCalls(): void {
  expect(api.insertPoll).not.toHaveBeenCalled();
  expect(api.updatePoll).not.toHaveBeenCalled();
  expect(api.deletePoll).not.toHaveBeenCalled();
  expect(api.setPollVote).not.toHaveBeenCalled();
}

describe("pollsSlice in remote mode", () => {
  beforeEach(() => {
    setRemoteContext({ teamId: TEAM, userId: ALICE });
  });

  it("addPoll prepends and inserts the poll", async () => {
    const existing = makePoll({ id: OTHER_POLL_ID });
    seed(existing);
    const poll = makePoll();
    useAppStore.getState().addPoll(poll);

    expect(polls()).toEqual([poll, existing]);
    await settle();
    expect(api.insertPoll).toHaveBeenCalledTimes(1);
    expect(api.insertPoll).toHaveBeenCalledWith(poll, TEAM);
    expect(savePollsMock).toHaveBeenCalledTimes(1);
  });

  it("updatePoll replaces the poll and updates it", async () => {
    seed(makePoll());
    const edited = makePoll({ question: "Which wheels?" });
    useAppStore.getState().updatePoll(edited);

    expect(polls()).toEqual([edited]);
    await settle();
    expect(api.updatePoll).toHaveBeenCalledTimes(1);
    expect(api.updatePoll).toHaveBeenCalledWith(edited);
  });

  it("deletePoll removes the poll and deletes it", async () => {
    seed(makePoll());
    useAppStore.getState().deletePoll(POLL_ID);

    expect(polls()).toEqual([]);
    await settle();
    expect(api.deletePoll).toHaveBeenCalledTimes(1);
    expect(api.deletePoll).toHaveBeenCalledWith(POLL_ID);
  });

  it("setPollOpen sends the poll with isOpen changed", async () => {
    const poll = makePoll();
    seed(poll);
    useAppStore.getState().setPollOpen(POLL_ID, false);

    expect(polls()).toEqual([{ ...poll, isOpen: false }]);
    await settle();
    expect(api.updatePoll).toHaveBeenCalledTimes(1);
    expect(api.updatePoll).toHaveBeenCalledWith({ ...poll, isOpen: false });
  });

  it("sends nothing for an unknown id", async () => {
    seed(makePoll({ id: OTHER_POLL_ID }));
    const store = useAppStore.getState();
    store.updatePoll(makePoll());
    store.deletePoll(POLL_ID);
    store.setPollOpen(POLL_ID, false);
    store.votePoll(POLL_ID, ALICE, A);

    await settle();
    expectNoApiCalls();
    expect(hasPendingWrites()).toBe(false);
  });

  describe("votePoll", () => {
    it.each([
      { name: "single, no vote, click A", allowMultiple: false, prior: [], click: A, expected: [A] },
      { name: "single, voted A, click B", allowMultiple: false, prior: [A], click: B, expected: [B] },
      { name: "single, voted A, click A", allowMultiple: false, prior: [A], click: A, expected: [] },
      { name: "multi, voted A, click B", allowMultiple: true, prior: [A], click: B, expected: [A, B] },
      { name: "multi, voted A+B, click A", allowMultiple: true, prior: [A, B], click: A, expected: [B] },
      { name: "multi, voted A, click A", allowMultiple: true, prior: [A], click: A, expected: [] },
    ])("$name", async ({ allowMultiple, prior, click, expected }) => {
      const votes: Record<string, string[]> = { [BOB]: [B] };
      if (prior.length > 0) votes[ALICE] = prior;
      seed(makePoll({ allowMultiple, votes }));
      useAppStore.getState().votePoll(POLL_ID, ALICE, click);

      const after = polls()[0].votes;
      expect(after[ALICE]).toEqual(expected.length > 0 ? expected : undefined);
      expect(ALICE in after).toBe(expected.length > 0);
      expect(after[BOB]).toEqual([B]);
      expect(savePollsMock).toHaveBeenCalledTimes(1);
      await settle();
      expect(api.setPollVote).toHaveBeenCalledTimes(1);
      expect(api.setPollVote).toHaveBeenCalledWith(POLL_ID, expected);
    });

    it("treats a legacy string ballot as a one-element ballot", async () => {
      const legacy = (): Poll =>
        makePoll({ votes: { [ALICE]: A as unknown as string[], [BOB]: [B] } });

      seed(legacy());
      useAppStore.getState().votePoll(POLL_ID, ALICE, A);
      expect(ALICE in polls()[0].votes).toBe(false);
      expect(polls()[0].votes[BOB]).toEqual([B]);
      await settle();
      expect(api.setPollVote).toHaveBeenCalledTimes(1);
      expect(api.setPollVote).toHaveBeenLastCalledWith(POLL_ID, []);

      seed(legacy());
      useAppStore.getState().votePoll(POLL_ID, ALICE, B);
      expect(polls()[0].votes[ALICE]).toEqual([B]);
      await settle();
      expect(api.setPollVote).toHaveBeenCalledTimes(2);
      expect(api.setPollVote).toHaveBeenLastCalledWith(POLL_ID, [B]);
    });

    it("removes every copy of a duplicated id from a multi-select ballot", async () => {
      seed(makePoll({ allowMultiple: true, votes: { [ALICE]: [A, A] } }));
      useAppStore.getState().votePoll(POLL_ID, ALICE, A);

      expect(ALICE in polls()[0].votes).toBe(false);
      await settle();
      expect(api.setPollVote).toHaveBeenCalledTimes(1);
      expect(api.setPollVote).toHaveBeenCalledWith(POLL_ID, []);
    });

    it.each([
      { name: "isOpen false", poll: makePoll({ isOpen: false, votes: { [ALICE]: [A] } }) },
      {
        name: "closesAt in the past",
        poll: makePoll({ closesAt: Date.now() - 60_000, votes: { [ALICE]: [A] } }),
      },
    ])("ignores a closed poll ($name)", async ({ poll }) => {
      seed(poll);
      useAppStore.getState().votePoll(POLL_ID, ALICE, B);

      expect(polls()[0].votes).toEqual({ [ALICE]: [A] });
      expect(savePollsMock).not.toHaveBeenCalled();
      await settle();
      expect(api.setPollVote).not.toHaveBeenCalled();
    });

    it("drops a vote cast for another user", async () => {
      seed(makePoll());
      const before = polls();
      useAppStore.getState().votePoll(POLL_ID, BOB, A);

      expect(polls()).toBe(before);
      expect(savePollsMock).not.toHaveBeenCalled();
      await settle();
      expectNoApiCalls();
    });
  });

  it("re-adding a deleted poll waits for the delete", async () => {
    const poll = makePoll();
    seed(poll);
    const del = deferred<void>();
    vi.mocked(api.deletePoll).mockReturnValueOnce(del.promise);

    useAppStore.getState().deletePoll(POLL_ID);
    useAppStore.getState().addPoll(poll);
    await settle();
    expect(api.deletePoll).toHaveBeenCalledTimes(1);
    expect(api.insertPoll).not.toHaveBeenCalled();
    expect(hasPendingWrites()).toBe(true);

    del.resolve();
    await settle();
    expect(api.insertPoll).toHaveBeenCalledTimes(1);
    expect(api.insertPoll).toHaveBeenCalledWith(poll, TEAM);
    expect(vi.mocked(api.deletePoll).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(api.insertPoll).mock.invocationCallOrder[0],
    );
    expect(hasPendingWrites()).toBe(false);
    expect(pollWriteChainCountForTests()).toBe(0);
    expect(polls()).toEqual([poll]);
  });

  it("a vote on a new poll waits for its insert", async () => {
    const insert = deferred<void>();
    vi.mocked(api.insertPoll).mockReturnValueOnce(insert.promise);

    useAppStore.getState().addPoll(makePoll());
    useAppStore.getState().votePoll(POLL_ID, ALICE, A);
    await settle();
    expect(api.setPollVote).not.toHaveBeenCalled();

    insert.resolve();
    await settle();
    expect(api.setPollVote).toHaveBeenCalledTimes(1);
    expect(api.setPollVote).toHaveBeenCalledWith(POLL_ID, [A]);
  });

  it("a failed write doesn't block the next one for the same poll", async () => {
    seed(makePoll());
    vi.mocked(api.updatePoll).mockRejectedValueOnce(new Error("Network down."));
    const first = makePoll({ question: "First" });
    const second = makePoll({ question: "Second" });

    useAppStore.getState().updatePoll(first);
    useAppStore.getState().updatePoll(second);
    await settle();
    expect(api.updatePoll).toHaveBeenCalledTimes(2);
    expect(api.updatePoll).toHaveBeenNthCalledWith(1, first);
    expect(api.updatePoll).toHaveBeenNthCalledWith(2, second);
    expect(toasts()).toEqual(["Couldn't save the poll. Network down."]);
  });

  it("toasts a failed vote", async () => {
    seed(makePoll());
    vi.mocked(api.setPollVote).mockRejectedValueOnce(new Error("Network down."));

    useAppStore.getState().votePoll(POLL_ID, ALICE, A);
    await settle();
    expect(toasts()).toEqual(["Couldn't save your vote. Network down."]);
  });

  it("a rollback waits for queued writes to drain", async () => {
    vi.mocked(api.insertPoll).mockRejectedValueOnce(new Error("Network down."));
    const vote = deferred<void>();
    vi.mocked(api.setPollVote).mockReturnValueOnce(vote.promise);

    useAppStore.getState().addPoll(makePoll());
    useAppStore.getState().votePoll(POLL_ID, ALICE, A);
    await settle();
    expect(api.setPollVote).toHaveBeenCalledTimes(1);
    expect(api.fetchWorkspace).not.toHaveBeenCalled();

    vote.resolve();
    await settle();
    expect(api.fetchWorkspace).toHaveBeenCalledTimes(1);
    expect(toasts()).toContain("Couldn't save the poll. Network down.");
  });

  it("writes for different polls don't wait on each other", async () => {
    seed(makePoll(), makePoll({ id: OTHER_POLL_ID }));
    const slow = deferred<void>();
    vi.mocked(api.updatePoll).mockReturnValueOnce(slow.promise);
    const first = makePoll({ question: "Slow" });
    const other = makePoll({ id: OTHER_POLL_ID, question: "Fast" });

    useAppStore.getState().updatePoll(first);
    useAppStore.getState().updatePoll(other);
    await settle();
    expect(api.updatePoll).toHaveBeenCalledTimes(2);
    expect(api.updatePoll).toHaveBeenNthCalledWith(2, other);
    expect(hasPendingWrites()).toBe(true);

    slow.resolve();
    await settle();
    expect(hasPendingWrites()).toBe(false);
    expect(pollWriteChainCountForTests()).toBe(0);
  });
});

describe("pollsSlice in local mode", () => {
  it("applies every action locally and sends nothing", async () => {
    const store = useAppStore.getState();
    const existing = makePoll({ id: OTHER_POLL_ID });
    seed(existing);
    const poll = makePoll();

    store.addPoll(poll);
    expect(polls()).toEqual([poll, existing]);
    expect(savePollsMock).toHaveBeenCalledTimes(1);

    const edited = makePoll({ question: "Edited", allowMultiple: true });
    store.updatePoll(edited);
    expect(polls()).toEqual([edited, existing]);
    expect(savePollsMock).toHaveBeenCalledTimes(2);

    store.votePoll(POLL_ID, ALICE, A);
    const voted = { ...edited, votes: { [ALICE]: [A] } };
    expect(polls()).toEqual([voted, existing]);
    expect(savePollsMock).toHaveBeenCalledTimes(3);

    store.setPollOpen(POLL_ID, false);
    expect(polls()).toEqual([{ ...voted, isOpen: false }, existing]);
    expect(savePollsMock).toHaveBeenCalledTimes(4);

    store.deletePoll(POLL_ID);
    expect(polls()).toEqual([existing]);
    expect(savePollsMock).toHaveBeenCalledTimes(5);
    expect(savePollsMock).toHaveBeenLastCalledWith([existing]);

    await settle();
    expectNoApiCalls();
    expect(hasPendingWrites()).toBe(false);
  });

  it("still applies a vote for another user", async () => {
    seed(makePoll());
    useAppStore.getState().votePoll(POLL_ID, BOB, A);

    expect(polls()[0].votes).toEqual({ [BOB]: [A] });
    expect(savePollsMock).toHaveBeenCalledTimes(1);
    await settle();
    expectNoApiCalls();
  });
});
