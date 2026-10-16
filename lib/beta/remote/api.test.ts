import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NOT_FOUND,
  fetchWorkspace,
  insertEvent,
  insertProject,
  regenerateJoinCode,
  removeMember,
  setMemberRole,
  setPollVote,
  updateEvent,
  updateMembership,
  updateOwnProfile,
  updateProject,
} from "@/lib/beta/remote/api";
import type { TeamEvent, TeamTask } from "@/lib/beta/types";
import type { Database } from "@/lib/supabase/database.types";
import { friendlyError } from "@/lib/supabase/errors";

const TEAM = "6f1c2a9e-3b7d-4e8a-9c1f-2d5b8a7e4c30";
const ALICE = "0b6e3c52-8d4f-4a1e-b7c9-5f2a1d8e6b04";
const BOB = "9a4d7e21-6c3b-4f58-8e2a-1b7c9d0f3a65";
const POLL_ID = "5a9c1e7b-3d2f-4b64-8a0e-6c4d9b1f2e78";

type Result = { data?: unknown; error?: unknown };
type Call = { table: string; ops: [string, unknown[]][] };

// Just enough of supabase-js: every builder method records itself and returns
// the builder, and awaiting it resolves to the canned result for its table.
// rpc and auth.getUser resolve to the canned result for "rpc:<name>" and "auth".
function fakeClient(results: Record<string, Result> = {}) {
  const calls: Call[] = [];
  const rpc = vi.fn<(name: string, args?: unknown) => Promise<Result>>(async (name) => ({
    data: null,
    error: null,
    ...results[`rpc:${name}`],
  }));
  const auth = {
    getUser: async () => ({ data: { user: { id: ALICE } }, error: null, ...results.auth }),
  };
  const from = (table: string) => {
    const call: Call = { table, ops: [] };
    calls.push(call);
    const builder: Record<string, unknown> = {
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null, ...results[table] }).then(resolve, reject),
    };
    for (const op of ["select", "insert", "update", "delete", "eq", "in", "order"]) {
      builder[op] = (...args: unknown[]) => {
        call.ops.push([op, args]);
        return builder;
      };
    }
    return builder;
  };
  const client = { from, rpc, auth } as unknown as SupabaseClient<Database>;
  return { client, calls, rpc };
}

const event: TeamEvent = {
  id: "8b3f6d2a-7e1c-4a95-b8d4-2e6a9c0f1b33",
  title: "Build night",
  date: "2026-10-16",
  startTime: "19:00",
  type: "build",
  createdBy: ALICE,
  createdAt: 0,
};

const project: TeamTask = {
  id: "3c7a9e15-2b8d-4f6a-9e1c-8d4b2a7f5e03",
  name: "Drivetrain",
  description: "",
  color: "#007AFF",
  dueDate: "",
  assignedMembers: [],
  editors: [],
  createdBy: ALICE,
  subtasks: [],
  progress: 0,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("api", () => {
  it("rejects when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.resetModules();
    // Fresh import: env.ts reads the variables at module load.
    const api = await import("@/lib/beta/remote/api");
    await expect(api.fetchWorkspace(TEAM, ALICE)).rejects.toThrow("Supabase is not configured.");
  });

  it("wraps a Supabase error in friendly copy with the original as cause", async () => {
    const original = { code: "42501", message: "permission denied for table projects" };
    const { client } = fakeClient({ projects: { error: original } });
    const error = await insertProject(project, TEAM, client).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(friendlyError(original));
    expect((error as Error).message).toBe("You don't have permission to do that.");
    expect((error as Error).cause).toBe(original);
  });

  it("rejects an update that touched zero rows", async () => {
    const { client, calls } = fakeClient({ events: { data: [] } });
    await expect(updateEvent(event, client)).rejects.toThrow(NOT_FOUND);
    expect(calls[0].ops).toContainEqual(["eq", ["id", event.id]]);
  });

  it("retracts a vote with an empty option list", async () => {
    const { client, rpc } = fakeClient();
    await setPollVote(POLL_ID, [], client);
    expect(rpc).toHaveBeenCalledWith("set_poll_vote", { p_poll_id: POLL_ID, p_option_ids: [] });
  });

  it("filters every workspace query by team and requires membership", async () => {
    const members = [
      { user_id: BOB, role: "member", title: null, work_roles: [], joined_at: "2026-09-01T00:00:00+00:00" },
    ];
    const { client, calls } = fakeClient({ team_members: { data: members } });
    await expect(fetchWorkspace(TEAM, ALICE, client)).rejects.toThrow(friendlyError("not_team_member"));

    for (const table of ["team_members", "projects", "task_items", "polls", "events"]) {
      const call = calls.find((c) => c.table === table);
      expect(call?.ops).toContainEqual(["eq", ["team_id", TEAM]]);
    }
    const votes = calls.find((c) => c.table === "poll_votes")?.ops;
    // The inner join is what lets the team filter apply to poll_votes.
    expect(votes).toContainEqual(["select", ["poll_id, user_id, option_ids, polls!inner(team_id)"]]);
    expect(votes).toContainEqual(["eq", ["polls.team_id", TEAM]]);
  });

  it("builds the workspace for a member", async () => {
    const { client } = fakeClient({
      team_members: {
        data: [
          { user_id: ALICE, role: "owner", title: "Captain", work_roles: [], joined_at: "2026-09-01T00:00:00+00:00" },
        ],
      },
      profiles: {
        data: [{ id: ALICE, first_name: "Ada", last_name: "L", display_name: null, grade: null, is_coach: false }],
      },
      polls: {
        data: [
          {
            id: POLL_ID,
            team_id: TEAM,
            question: "?",
            options: [{ id: "a", text: "A" }],
            is_open: true,
            closes_at: null,
            allow_multiple: false,
            color: "#2D8CFF",
            image_uri: null,
            created_by: ALICE,
            created_at: "2026-10-15T00:00:00+00:00",
            updated_at: "2026-10-15T00:00:00+00:00",
          },
        ],
      },
      poll_votes: {
        data: [
          { poll_id: POLL_ID, user_id: ALICE, option_ids: ["a"] },
          { poll_id: POLL_ID, user_id: BOB, option_ids: ["a"] },
        ],
      },
    });
    const data = await fetchWorkspace(TEAM, ALICE, client);
    expect(data.currentUserId).toBe(ALICE);
    expect(data.members).toMatchObject([{ id: ALICE, firstName: "Ada", accessRole: "owner" }]);
    // BOB is not a member, so that ballot is ignored.
    expect(data.polls[0].votes).toEqual({ [ALICE]: ["a"] });
    expect(data.tasks).toEqual([]);
  });

  it("resolves an update that touched a row", async () => {
    const { client, calls } = fakeClient({ projects: { data: [{ id: project.id }] } });
    await expect(updateProject(project, client)).resolves.toBeUndefined();
    expect(calls[0].ops).toContainEqual(["select", ["id"]]);
    expect(calls[0].ops).toContainEqual(["eq", ["id", project.id]]);
  });
});

describe("event validation", () => {
  it.each([
    ["start time", { startTime: "" }, "Choose a start time for this event."],
    ["date", { date: "" }, "Choose a date for this event."],
  ])("rejects an empty %s before any table call", async (_, patch, message) => {
    const { client, calls } = fakeClient();
    await expect(insertEvent({ ...event, ...patch }, TEAM, client)).rejects.toThrow(message);
    await expect(updateEvent({ ...event, ...patch }, client)).rejects.toThrow(message);
    expect(calls).toEqual([]);
  });
});

describe("updateOwnProfile", () => {
  it("rejects when signed out without querying profiles", async () => {
    const authError = { name: "AuthSessionMissingError", message: "Auth session missing!" };
    const { client, calls } = fakeClient({ auth: { data: { user: null }, error: authError } });
    await expect(updateOwnProfile({ first_name: "Ada" }, client)).rejects.toThrow(
      friendlyError(authError),
    );
    expect(calls).toEqual([]);
  });

  it("updates the caller's row with only the defined fields", async () => {
    const { client, calls } = fakeClient({ profiles: { data: [{ id: ALICE }] } });
    await updateOwnProfile({ first_name: "Ada", last_name: undefined }, client);
    expect(calls[0].ops).toContainEqual(["update", [{ first_name: "Ada" }]]);
    expect(calls[0].ops).toContainEqual(["eq", ["id", ALICE]]);
  });

  it("skips an all-undefined patch", async () => {
    const { client, calls } = fakeClient();
    await updateOwnProfile({ first_name: undefined }, client);
    expect(calls).toEqual([]);
  });
});

describe("updateMembership", () => {
  it("updates the member's row with only the defined fields", async () => {
    const { client, calls } = fakeClient({ team_members: { data: [{ user_id: BOB }] } });
    await updateMembership(TEAM, BOB, { title: "Driver", work_roles: undefined }, client);
    expect(calls[0].ops).toContainEqual(["update", [{ title: "Driver" }]]);
    expect(calls[0].ops).toContainEqual(["eq", ["team_id", TEAM]]);
    expect(calls[0].ops).toContainEqual(["eq", ["user_id", BOB]]);
  });
});

describe("rpc wrappers", () => {
  it("returns the new join code", async () => {
    const { client, rpc } = fakeClient({ "rpc:regenerate_join_code": { data: "ABC123" } });
    await expect(regenerateJoinCode(TEAM, client)).resolves.toBe("ABC123");
    expect(rpc).toHaveBeenCalledWith("regenerate_join_code", { p_team_id: TEAM });
  });

  it("passes the member and role through", async () => {
    const { client, rpc } = fakeClient();
    await setMemberRole(TEAM, BOB, "admin", client);
    expect(rpc).toHaveBeenCalledWith("set_member_role", {
      p_team_id: TEAM,
      p_user_id: BOB,
      p_role: "admin",
    });
    await removeMember(TEAM, BOB, client);
    expect(rpc).toHaveBeenCalledWith("remove_member", { p_team_id: TEAM, p_user_id: BOB });
  });

  it("turns a raised last_owner into friendly copy", async () => {
    const original = { code: "P0001", message: "last_owner" };
    const { client } = fakeClient({ "rpc:remove_member": { error: original } });
    const error = await removeMember(TEAM, ALICE, client).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Make someone else an owner first.");
    expect((error as Error).cause).toBe(original);
  });
});
