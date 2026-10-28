import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWorkspace } from "@/lib/beta/remote/api";
import {
  hasPendingWrites,
  refreshWorkspace,
  resetRemoteContextForTests,
  setRemoteContext,
} from "@/lib/beta/remote/context";
import { resetAppStoreForTests, useAppStore } from "@/lib/beta/store/appStore";
import { useToastStore } from "@/lib/beta/store/toastStore";
import type { AppData } from "@/lib/beta/storage";
import type { TeamMember } from "@/lib/beta/types";
import { runTeamRpc } from "./teamRpc";

vi.mock(import("@/lib/beta/remote/api"), async (orig) => ({
  ...(await orig()),
  fetchWorkspace: vi.fn(),
}));

const TEAM = "6f1c2a9e-3b7d-4e8a-9c1f-2d5b8a7e4c30";
const ALICE = "0b6e3c52-8d4f-4a1e-b7c9-5f2a1d8e6b04";
const BOB = "7a2d9f41-6c3e-4b8a-a1d5-3e9c7b2f8a16";

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

// Lets fire-and-forget work run: a rescheduled refetch, its dynamic import and
// the hydrate after it.
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

function person(id: string, firstName: string, accessRole: TeamMember["accessRole"]): TeamMember {
  return {
    id,
    firstName,
    lastName: "Ng",
    teamRole: "Builder",
    workRoles: [],
    grade: "11th",
    isCoach: false,
    accessRole,
  };
}

function workspace(members: TeamMember[]): AppData {
  return { members, tasks: [], taskItems: [], polls: [], events: [], currentUserId: ALICE };
}

// Before the RPC: bob is a member. After: bob is an admin.
const STALE = workspace([person(ALICE, "Alice", "owner"), person(BOB, "Bob", "member")]);
const FRESH = workspace([person(ALICE, "Alice", "owner"), person(BOB, "Bob", "admin")]);

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

describe("runTeamRpc", () => {
  describe("with a background refresh already in flight", () => {
    async function start() {
      const stale = deferred<AppData>();
      const fresh = deferred<AppData>();
      fetchMock
        .mockReturnValueOnce(stale.promise)
        .mockReturnValueOnce(fresh.promise)
        .mockResolvedValue(FRESH);
      const bg = refreshWorkspace();
      await runTeamRpc(Promise.resolve());
      const fg = refreshWorkspace();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      return { stale, fresh, bg, fg };
    }

    it("keeps the post-RPC roster when the stale fetch lands first", async () => {
      const { stale, fresh, bg, fg } = await start();
      stale.resolve(STALE);
      fresh.resolve(FRESH);
      await Promise.all([bg, fg]);
      await settle();
      expect(useAppStore.getState().members).toEqual(FRESH.members);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("keeps the post-RPC roster when the fresh fetch lands first", async () => {
      const { stale, fresh, bg, fg } = await start();
      fresh.resolve(FRESH);
      await fg;
      stale.resolve(STALE);
      await bg;
      await settle();
      expect(useAppStore.getState().members).toEqual(FRESH.members);
    });
  });

  it("rejects with the RPC's error without toasting or staying pending", async () => {
    const error = new Error("last_owner");
    await expect(runTeamRpc(Promise.reject(error))).rejects.toBe(error);
    expect(hasPendingWrites()).toBe(false);
    await settle();
    expect(toasts()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves to the RPC's value", async () => {
    await expect(runTeamRpc(Promise.resolve("NEWCODE1"))).resolves.toBe("NEWCODE1");
    expect(hasPendingWrites()).toBe(false);
  });
});
