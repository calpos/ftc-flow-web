import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRemoteContextForTests, setRemoteContext } from "@/lib/beta/remote/context";
import {
  loadAppData,
  saveCurrentUserId,
  saveEvents,
  saveMembers,
  savePolls,
  saveTaskItems,
  saveTasks,
} from "@/lib/beta/storage";

const TEAM = "6f1c2a9e-3b7d-4e8a-9c1f-2d5b8a7e4c30";
const ALICE = "0b6e3c52-8d4f-4a1e-b7c9-5f2a1d8e6b04";

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

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  storage = fakeStorage();
  vi.stubGlobal("window", { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetRemoteContextForTests();
});

describe("storage in remote mode", () => {
  it.each([
    ["saveMembers", () => saveMembers([]), "ftc_flow_members"],
    ["saveTasks", () => saveTasks([]), "ftc_flow_tasks"],
    ["savePolls", () => savePolls([]), "ftc_flow_polls"],
    ["saveEvents", () => saveEvents([]), "ftc_flow_events"],
    ["saveTaskItems", () => saveTaskItems([]), "ftc_flow_task_items"],
    ["saveCurrentUserId", () => saveCurrentUserId(ALICE), "ftc_flow_current_user"],
  ])("%s skips localStorage while a remote context is set", async (_, save, key) => {
    setRemoteContext({ teamId: TEAM, userId: ALICE });
    await save();
    expect(storage.setItem).not.toHaveBeenCalled();

    setRemoteContext(null);
    await save();
    expect(storage.setItem).toHaveBeenCalledWith(key, expect.any(String));
  });

  it("still reads in remote mode", async () => {
    storage.setItem("ftc_flow_current_user", ALICE);
    setRemoteContext({ teamId: TEAM, userId: ALICE });
    const data = await loadAppData();
    expect(storage.getItem).toHaveBeenCalledWith("ftc_flow_current_user");
    expect(data.currentUserId).toBe(ALICE);
  });
});
