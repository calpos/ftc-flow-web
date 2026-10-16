import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWorkspace, updateMembership, updateOwnProfile } from "@/lib/beta/remote/api";
import {
  hasPendingWrites,
  resetRemoteContextForTests,
  setRemoteContext,
} from "@/lib/beta/remote/context";
import { resetAppStoreForTests, useAppStore } from "@/lib/beta/store/appStore";
import { useToastStore } from "@/lib/beta/store/toastStore";
import type { AppData } from "@/lib/beta/storage";
import type { TeamMember } from "@/lib/beta/types";

vi.mock(import("@/lib/beta/remote/api"), async (orig) => ({
  ...(await orig()),
  updateOwnProfile: vi.fn(),
  updateMembership: vi.fn(),
  fetchWorkspace: vi.fn(),
}));

const TEAM = "6f1c2a9e-3b7d-4e8a-9c1f-2d5b8a7e4c30";
const ALICE = "0b6e3c52-8d4f-4a1e-b7c9-5f2a1d8e6b04";
const BOB = "7a2d9f41-6c3e-4b8a-a1d5-3e9c7b2f8a16";
const CARA = "c4e81b27-9f5a-4d3c-8b6e-1a7d2c9f4e58";

const profileMock = vi.mocked(updateOwnProfile);
const membershipMock = vi.mocked(updateMembership);
const fetchMock = vi.mocked(fetchWorkspace);

const alice: TeamMember = {
  id: ALICE,
  firstName: "Alice",
  lastName: "Ng",
  teamRole: "Captain",
  workRoles: ["Build"],
  grade: "11th",
  isCoach: false,
  accessRole: "owner",
};
const bob: TeamMember = {
  id: BOB,
  firstName: "Bob",
  lastName: "Ruiz",
  teamRole: "Builder",
  workRoles: ["Build", "CAD"],
  grade: "10th",
  isCoach: false,
  accessRole: "member",
};
const cara: TeamMember = {
  id: CARA,
  firstName: "Cara",
  lastName: "Ito",
  teamRole: "Programmer",
  workRoles: ["Code"],
  grade: "12th",
  isCoach: false,
  accessRole: "admin",
};

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

function workspace(members: TeamMember[]): AppData {
  return { members, tasks: [], taskItems: [], polls: [], events: [], currentUserId: ALICE };
}

function member(id: string): TeamMember | undefined {
  return useAppStore.getState().members.find((m) => m.id === id);
}

function toasts(): string[] {
  return useToastStore.getState().toasts.map((t) => t.message);
}

const updateMember = (updated: TeamMember) => useAppStore.getState().updateMember(updated);

beforeEach(() => {
  resetRemoteContextForTests();
  resetAppStoreForTests();
  useToastStore.setState({ toasts: [] });
  profileMock.mockReset().mockResolvedValue();
  membershipMock.mockReset().mockResolvedValue();
  fetchMock.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  useAppStore.setState({ members: [alice, bob, cara], currentUserId: ALICE });
});

describe("updateMember locally", () => {
  it("replaces the member wholesale without calling the api", () => {
    const edited = { ...bob, firstName: "  Robert ", teamRole: "Lead" };
    updateMember(edited);
    expect(member(BOB)).toBe(edited);
    expect(profileMock).not.toHaveBeenCalled();
    expect(membershipMock).not.toHaveBeenCalled();
  });
});

describe("updateMember remotely", () => {
  describe("as alice (owner)", () => {
    beforeEach(() => {
      setRemoteContext({ teamId: TEAM, userId: ALICE });
    });

    it("trims and writes own name through updateOwnProfile", async () => {
      updateMember({ ...alice, firstName: "  Ali ", lastName: " Ng-Lee  " });
      expect(member(ALICE)).toMatchObject({ firstName: "Ali", lastName: "Ng-Lee" });
      expect(profileMock).toHaveBeenCalledTimes(1);
      expect(profileMock).toHaveBeenCalledWith({
        first_name: "Ali",
        last_name: "Ng-Lee",
        display_name: "Ali Ng-Lee",
        is_coach: false,
        grade: "11th",
      });
      expect(membershipMock).not.toHaveBeenCalled();
      await settle();
      expect(toasts()).toEqual([]);
    });

    it("clears the grade when switching to coach", () => {
      updateMember({ ...alice, isCoach: true });
      expect(member(ALICE)?.isCoach).toBe(true);
      expect(member(ALICE)?.grade).toBeUndefined();
      expect(profileMock).toHaveBeenCalledWith(
        expect.objectContaining({ is_coach: true, grade: null }),
      );
    });

    it("keeps the previous first name when it is blank", () => {
      const before = useAppStore.getState().members;
      updateMember({ ...alice, firstName: "   " });
      expect(useAppStore.getState().members).toBe(before);
      expect(profileMock).not.toHaveBeenCalled();
      expect(membershipMock).not.toHaveBeenCalled();
    });

    it("keeps the previous first name when it is blank but the last name changed", () => {
      updateMember({ ...alice, firstName: "  ", lastName: "Ng-Lee" });
      expect(member(ALICE)).toMatchObject({ firstName: "Alice", lastName: "Ng-Lee" });
      expect(profileMock).toHaveBeenCalledTimes(1);
      expect(profileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "Alice",
          last_name: "Ng-Lee",
          display_name: "Alice Ng-Lee",
        }),
      );
    });

    it("writes both when profile and membership change, toasting once on failure", async () => {
      profileMock.mockRejectedValue(new Error("profile down"));
      membershipMock.mockRejectedValue(new Error("membership down"));
      fetchMock.mockResolvedValue(workspace([alice, bob, cara]));
      updateMember({ ...alice, firstName: "Ali", teamRole: "Co-captain" });
      expect(profileMock).toHaveBeenCalledTimes(1);
      expect(membershipMock).toHaveBeenCalledTimes(1);
      await settle();
      expect(toasts()).toHaveLength(1);
      expect(toasts()[0]).toMatch(/^Couldn't save your profile\./);
    });

    it("applies only the membership fields when editing someone else", () => {
      updateMember({ ...bob, firstName: "Robert", teamRole: "Lead builder" });
      expect(member(BOB)).toMatchObject({ firstName: "Bob", teamRole: "Lead builder" });
      expect(profileMock).not.toHaveBeenCalled();
      expect(membershipMock).toHaveBeenCalledTimes(1);
      expect(membershipMock).toHaveBeenCalledWith(TEAM, BOB, {
        title: "Lead builder",
        work_roles: ["Build", "CAD"],
      });
    });

    it("makes no calls for an identical update", async () => {
      const before = useAppStore.getState().members;
      updateMember({ ...alice, workRoles: [...alice.workRoles] });
      await settle();
      expect(useAppStore.getState().members).toBe(before);
      expect(profileMock).not.toHaveBeenCalled();
      expect(membershipMock).not.toHaveBeenCalled();
      expect(toasts()).toEqual([]);
    });

    it("ignores an unknown id", () => {
      const before = useAppStore.getState().members;
      updateMember({ ...bob, id: "missing", teamRole: "Lead" });
      expect(useAppStore.getState().members).toBe(before);
      expect(membershipMock).not.toHaveBeenCalled();
    });

    it("rolls back from the server when a write fails", async () => {
      const server = workspace([alice, { ...bob, teamRole: "Server title" }, cara]);
      fetchMock.mockResolvedValue(server);
      membershipMock.mockRejectedValue(new Error("nope"));
      updateMember({ ...bob, teamRole: "Lead" });
      expect(member(BOB)?.teamRole).toBe("Lead");
      await settle();
      expect(toasts()).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledWith(TEAM, ALICE);
      expect(useAppStore.getState().members).toEqual(server.members);
    });

    it("stays pending until every write settles", async () => {
      const membership = deferred<void>();
      profileMock.mockRejectedValue(new Error("profile down"));
      membershipMock.mockReturnValue(membership.promise);
      fetchMock.mockResolvedValue(workspace([alice, bob, cara]));
      updateMember({ ...alice, firstName: "Ali", teamRole: "Co-captain" });
      await settle();
      expect(hasPendingWrites()).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();

      membership.resolve();
      await settle();
      expect(hasPendingWrites()).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(toasts()).toHaveLength(1);
    });
  });

  describe("as cara (admin)", () => {
    beforeEach(() => {
      setRemoteContext({ teamId: TEAM, userId: CARA });
      useAppStore.setState({ currentUserId: CARA });
    });

    it("writes someone else's title through updateMembership", () => {
      updateMember({ ...bob, teamRole: "Lead builder" });
      expect(member(BOB)?.teamRole).toBe("Lead builder");
      expect(profileMock).not.toHaveBeenCalled();
      expect(membershipMock).toHaveBeenCalledTimes(1);
      expect(membershipMock).toHaveBeenCalledWith(TEAM, BOB, {
        title: "Lead builder",
        work_roles: ["Build", "CAD"],
      });
    });
  });

  describe("as bob (member)", () => {
    beforeEach(() => {
      setRemoteContext({ teamId: TEAM, userId: BOB });
    });

    it("writes own title and work roles through updateMembership only", () => {
      updateMember({ ...bob, teamRole: "Driver", workRoles: ["Drive"] });
      expect(member(BOB)).toMatchObject({ teamRole: "Driver", workRoles: ["Drive"] });
      expect(profileMock).not.toHaveBeenCalled();
      expect(membershipMock).toHaveBeenCalledTimes(1);
      expect(membershipMock).toHaveBeenCalledWith(TEAM, BOB, {
        title: "Driver",
        work_roles: ["Drive"],
      });
    });

    it("can't edit someone else's title", () => {
      const before = useAppStore.getState().members;
      updateMember({ ...cara, teamRole: "Intern" });
      expect(useAppStore.getState().members).toBe(before);
      expect(profileMock).not.toHaveBeenCalled();
      expect(membershipMock).not.toHaveBeenCalled();
    });
  });
});

describe("setUser", () => {
  it("is a no-op in remote mode", () => {
    setRemoteContext({ teamId: TEAM, userId: ALICE });
    useAppStore.getState().setUser(BOB);
    expect(useAppStore.getState().currentUserId).toBe(ALICE);
  });

  it("switches the user locally", () => {
    useAppStore.getState().setUser(BOB);
    expect(useAppStore.getState().currentUserId).toBe(BOB);
  });
});
