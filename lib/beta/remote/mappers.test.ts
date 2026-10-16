import { afterEach, describe, expect, it, vi } from "vitest";
import { newId } from "@/app/beta/_components/util";
import {
  eventFromRow,
  eventToInsert,
  eventToUpdate,
  memberFromRows,
  pollFromRow,
  pollToInsert,
  pollToUpdate,
  projectFromRow,
  projectToInsert,
  projectToUpdate,
  taskItemFromRow,
  taskItemToInsert,
  taskItemToUpdate,
  type MemberProfileInput,
  type MemberRowInput,
  type PollVoteInput,
} from "@/lib/beta/remote/mappers";
import type { Poll, Task, TeamEvent, TeamTask } from "@/lib/beta/types";
import type { Json, PollRow, ProjectRow, TaskItemRow } from "@/lib/supabase/database.types";

const TEAM = "6f1c2a9e-3b7d-4e8a-9c1f-2d5b8a7e4c30";
const ALICE = "0b6e3c52-8d4f-4a1e-b7c9-5f2a1d8e6b04";
const BOB = "9a4d7e21-6c3b-4f58-8e2a-1b7c9d0f3a65";
const CARA = "d2f8b1a7-4e6c-4d93-a5b0-7c1e8f2a9d46";
const PROJECT_ID = "3c7a9e15-2b8d-4f6a-9e1c-8d4b2a7f5e03";
const TASK_ID = "7e2b4d9a-1c5f-4a83-b6d0-9f3e2c8a1b57";
const POLL_ID = "5a9c1e7b-3d2f-4b64-8a0e-6c4d9b1f2e78";
const OTHER_POLL_ID = "1f8e3a6c-9b4d-4e27-a1c5-3d7b8e2f9a40";
const EVENT_ID = "8b3f6d2a-7e1c-4a95-b8d4-2e6a9c0f1b33";

const CREATED_AT = Date.UTC(2026, 9, 15, 12, 34, 56, 789);
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const SERVER_COLUMNS = ["created_by", "created_at", "updated_at"];
const LOCKED_COLUMNS = ["id", "team_id", ...SERVER_COLUMNS];

const GRANTED = {
  projects: [
    "assigned_members",
    "banner_uri",
    "color",
    "description",
    "due_date",
    "editors",
    "image_uri",
    "name",
    "progress",
    "subtasks",
  ],
  task_items: [
    "assigned_members",
    "color",
    "description",
    "due_date",
    "due_time",
    "editors",
    "override_flag",
    "parent_project_id",
    "progress",
    "subtasks",
    "title",
  ],
  polls: ["allow_multiple", "closes_at", "color", "image_uri", "is_open", "options", "question"],
  events: ["description", "end_time", "event_date", "event_type", "start_time", "title"],
};

// What the database adds on insert.
function withServerColumns<T extends object>(insert: T, createdBy: string, createdAt = CREATED_AT) {
  const iso = new Date(createdAt).toISOString();
  return { ...insert, created_by: createdBy, created_at: iso, updated_at: iso };
}

function voteRows(poll: Poll): PollVoteInput[] {
  return Object.entries(poll.votes).map(([user_id, option_ids]) => ({
    poll_id: poll.id,
    user_id,
    option_ids,
  }));
}

const fullProject: TeamTask = {
  id: PROJECT_ID,
  name: "Drivetrain",
  description: "Mecanum base",
  color: "#FF9500",
  dueDate: "2026-11-01",
  assignedMembers: [ALICE, BOB],
  editors: [ALICE],
  createdBy: ALICE,
  subtasks: [{ id: "st-1", title: "CAD", color: "#34C759", progress: 40 }],
  progress: 25,
  imageUri: "https://example.com/image.png",
  bannerUri: "https://example.com/banner.png",
};

const bareProject: TeamTask = {
  id: PROJECT_ID,
  name: "Intake",
  description: "",
  color: "#007AFF",
  dueDate: "",
  assignedMembers: [],
  editors: [],
  createdBy: ALICE,
  subtasks: [],
  progress: 0,
};

const fullTask: Task = {
  id: TASK_ID,
  title: "Wire the hub",
  description: "Use the new harness",
  color: "#2D8CFF",
  dueDate: "2026-10-20",
  dueTime: "18:30",
  assignedMembers: [BOB],
  editors: [BOB, ALICE],
  subtasks: [
    { id: "sub-1", title: "Crimp", completed: true },
    { id: "sub-2", title: "Label", completed: false },
  ],
  parentProjectId: PROJECT_ID,
  overrideFlag: true,
  progress: 50,
  createdBy: BOB,
  createdAt: CREATED_AT,
};

const bareTask: Task = {
  id: TASK_ID,
  title: "Order parts",
  description: "",
  color: "#2D8CFF",
  dueDate: "",
  assignedMembers: [],
  editors: [],
  subtasks: [],
  overrideFlag: false,
  progress: 0,
  createdBy: BOB,
  createdAt: CREATED_AT,
};

const fullPoll: Poll = {
  id: POLL_ID,
  question: "Practice day?",
  options: [
    { id: "opt-a", text: "Saturday", color: "#FF2D55" },
    { id: "opt-b", text: "Sunday", color: "#00C7BE" },
  ],
  creatorId: ALICE,
  isOpen: true,
  closesAt: Date.UTC(2026, 9, 20, 23, 0, 0, 0),
  allowMultiple: true,
  votes: { [ALICE]: ["opt-a", "opt-b"], [BOB]: ["opt-b"] },
  createdAt: CREATED_AT,
  color: "#AF52DE",
  imageUri: "https://example.com/poll.png",
};

const barePoll: Poll = {
  id: POLL_ID,
  question: "Team name?",
  options: [{ id: "opt-a", text: "Gearheads" }],
  creatorId: ALICE,
  isOpen: false,
  allowMultiple: false,
  votes: {},
  createdAt: CREATED_AT,
  color: "#2D8CFF",
};

const fullEvent: TeamEvent = {
  id: EVENT_ID,
  title: "Qualifier",
  date: "2026-12-05",
  startTime: "08:00",
  endTime: "17:30",
  type: "competition",
  description: "Bring the pit kit",
  createdBy: CARA,
  createdAt: CREATED_AT,
};

const bareEvent: TeamEvent = {
  id: EVENT_ID,
  title: "Build night",
  date: "2026-10-16",
  startTime: "19:00",
  type: "build",
  createdBy: CARA,
  createdAt: CREATED_AT,
};

function pollRow(overrides: Partial<PollRow> = {}): PollRow {
  return { ...withServerColumns(pollToInsert(fullPoll, TEAM), ALICE), ...overrides };
}

function projectRow(subtasks: Json): ProjectRow {
  return { ...withServerColumns(projectToInsert(bareProject, TEAM), ALICE), subtasks };
}

function taskRow(overrides: Partial<TaskItemRow> = {}): TaskItemRow {
  return { ...withServerColumns(taskItemToInsert(bareTask, TEAM), BOB), ...overrides };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("round trips", () => {
  it.each([
    ["every optional field set", fullProject],
    ["every optional field unset", bareProject],
  ])("project: %s", (_, project) => {
    expect(projectFromRow(withServerColumns(projectToInsert(project, TEAM), project.createdBy))).toEqual(
      project,
    );
  });

  it.each([
    ["every optional field set", fullTask],
    ["every optional field unset", bareTask],
  ])("task item: %s", (_, task) => {
    expect(
      taskItemFromRow(withServerColumns(taskItemToInsert(task, TEAM), task.createdBy, task.createdAt)),
    ).toEqual(task);
  });

  it.each([
    ["every optional field set", fullPoll],
    ["every optional field unset", barePoll],
  ])("poll: %s", (_, poll) => {
    const row = withServerColumns(pollToInsert(poll, TEAM), poll.creatorId, poll.createdAt);
    expect(pollFromRow(row, voteRows(poll))).toEqual(poll);
  });

  it.each([
    ["every optional field set", fullEvent],
    ["every optional field unset", bareEvent],
  ])("event: %s", (_, event) => {
    expect(
      eventFromRow(withServerColumns(eventToInsert(event, TEAM), event.createdBy, event.createdAt)),
    ).toEqual(event);
  });
});

describe("nullable columns", () => {
  it("maps an empty dueDate to a null due_date and back", () => {
    expect(projectToInsert(bareProject, TEAM).due_date).toBeNull();
    expect(projectFromRow(projectRow([])).dueDate).toBe("");
    expect(taskItemToInsert(bareTask, TEAM).due_date).toBeNull();
    expect(taskItemFromRow(taskRow({ due_date: null })).dueDate).toBe("");
  });

  it("maps undefined optional text to null and back", () => {
    const project = projectToInsert(bareProject, TEAM);
    expect(project.image_uri).toBeNull();
    expect(project.banner_uri).toBeNull();
    const task = taskItemToInsert(bareTask, TEAM);
    expect(task.due_time).toBeNull();
    expect(task.parent_project_id).toBeNull();
    expect(pollToInsert(barePoll, TEAM).image_uri).toBeNull();
    const event = eventToInsert(bareEvent, TEAM);
    expect(event.end_time).toBeNull();
    expect(event.description).toBeNull();

    const read = taskItemFromRow(taskRow({ due_time: null, parent_project_id: null }));
    expect(read.dueTime).toBeUndefined();
    expect(read.parentProjectId).toBeUndefined();
  });

  it("writes an empty time as null, since the time CHECKs reject ''", () => {
    expect(taskItemToUpdate({ ...bareTask, dueTime: "" }).due_time).toBeNull();
    expect(eventToUpdate({ ...bareEvent, endTime: "" }).end_time).toBeNull();
  });
});

describe("timestamps", () => {
  it("writes ms as ISO", () => {
    expect(pollToUpdate(fullPoll).closes_at).toBe("2026-10-20T23:00:00.000Z");
    expect(pollToUpdate(barePoll).closes_at).toBeNull();
  });

  it("reads a microsecond +00:00 timestamp to the right ms", () => {
    const task = taskItemFromRow(taskRow({ created_at: "2026-10-15T12:34:56.123456+00:00" }));
    expect(task.createdAt).toBe(Date.UTC(2026, 9, 15, 12, 34, 56, 123));
    const poll = pollFromRow(pollRow({ closes_at: "2026-10-20T23:00:00.000001+00:00" }), []);
    expect(poll.closesAt).toBe(Date.UTC(2026, 9, 20, 23, 0, 0, 0));
  });

  it("reads a bad created_at as 0 and a bad closes_at as undefined", () => {
    expect(taskItemFromRow(taskRow({ created_at: "not a date" })).createdAt).toBe(0);
    const poll = pollFromRow(pollRow({ created_at: "", closes_at: "soon" }), []);
    expect(poll.createdAt).toBe(0);
    expect(poll.closesAt).toBeUndefined();
  });
});

describe("poll votes", () => {
  const options = [
    { id: "opt-a", text: "A" },
    { id: "opt-b", text: "B" },
  ];

  it("drops stale option ids and duplicates", () => {
    const row = pollRow({ options, allow_multiple: true });
    const poll = pollFromRow(row, [
      { poll_id: POLL_ID, user_id: ALICE, option_ids: ["gone", "opt-b", "opt-a", "opt-b"] },
    ]);
    expect(poll.votes).toEqual({ [ALICE]: ["opt-b", "opt-a"] });
  });

  it("keeps only the first surviving id on a single-select poll", () => {
    const row = pollRow({ options, allow_multiple: false });
    const poll = pollFromRow(row, [
      { poll_id: POLL_ID, user_id: ALICE, option_ids: ["gone", "opt-b", "opt-a"] },
    ]);
    expect(poll.votes).toEqual({ [ALICE]: ["opt-b"] });
  });

  it("drops a ballot whose ids are all stale", () => {
    const poll = pollFromRow(pollRow({ options }), [
      { poll_id: POLL_ID, user_id: ALICE, option_ids: ["gone", "also-gone"] },
    ]);
    expect(poll.votes).toEqual({});
  });

  it("drops non-members only when memberIds is passed", () => {
    const votes = [
      { poll_id: POLL_ID, user_id: ALICE, option_ids: ["opt-a"] },
      { poll_id: POLL_ID, user_id: BOB, option_ids: ["opt-b"] },
    ];
    const row = pollRow({ options });
    expect(pollFromRow(row, votes).votes).toEqual({ [ALICE]: ["opt-a"], [BOB]: ["opt-b"] });
    expect(pollFromRow(row, votes, new Set([ALICE])).votes).toEqual({ [ALICE]: ["opt-a"] });
  });

  it("ignores ballots for another poll", () => {
    const poll = pollFromRow(pollRow({ options }), [
      { poll_id: OTHER_POLL_ID, user_id: ALICE, option_ids: ["opt-a"] },
    ]);
    expect(poll.votes).toEqual({});
  });
});

describe("column sets", () => {
  it.each([
    ["projects", Object.keys(projectToUpdate(fullProject))],
    ["task_items", Object.keys(taskItemToUpdate(fullTask))],
    ["polls", Object.keys(pollToUpdate(fullPoll))],
    ["events", Object.keys(eventToUpdate(fullEvent))],
  ] as const)("%s update sends exactly the granted columns", (table, keys) => {
    expect([...keys].sort()).toEqual(GRANTED[table]);
    for (const locked of LOCKED_COLUMNS) expect(keys).not.toContain(locked);
  });

  it.each([
    ["projects", Object.keys(projectToInsert(bareProject, TEAM))],
    ["task_items", Object.keys(taskItemToInsert(bareTask, TEAM))],
    ["polls", Object.keys(pollToInsert(barePoll, TEAM))],
    ["events", Object.keys(eventToInsert(bareEvent, TEAM))],
  ] as const)("%s insert sends id, team_id and the content columns", (table, keys) => {
    expect([...keys].sort()).toEqual([...GRANTED[table], "id", "team_id"].sort());
    for (const server of SERVER_COLUMNS) expect(keys).not.toContain(server);
  });

  it("puts the team id on inserts", () => {
    expect(projectToInsert(fullProject, TEAM)).toMatchObject({ id: PROJECT_ID, team_id: TEAM });
  });
});

describe("members", () => {
  const member: MemberRowInput = {
    user_id: ALICE,
    role: "member",
    title: "Captain",
    work_roles: ["Programmer", "Driver"],
    joined_at: "2026-09-01T00:00:00+00:00",
  };
  const profile: MemberProfileInput = {
    first_name: "Ada",
    last_name: "Lovelace",
    display_name: "Countess of Lovelace",
    grade: "11",
    is_coach: false,
  };

  it("prefers the profile's first and last names", () => {
    expect(memberFromRows(member, profile)).toEqual({
      id: ALICE,
      firstName: "Ada",
      lastName: "Lovelace",
      teamRole: "Captain",
      workRoles: ["Programmer", "Driver"],
      grade: "11",
      isCoach: false,
      accessRole: "member",
    });
  });

  it("splits display_name on the first whitespace run", () => {
    const blank = { ...profile, first_name: null, last_name: "" };
    const split = memberFromRows(member, { ...blank, display_name: "Mary  Jane Watson" });
    expect([split.firstName, split.lastName]).toEqual(["Mary", "Jane Watson"]);
    const single = memberFromRows(member, { ...blank, display_name: "Prince" });
    expect([single.firstName, single.lastName]).toEqual(["Prince", ""]);
  });

  it("handles a missing profile", () => {
    const result = memberFromRows(member, undefined);
    expect([result.firstName, result.lastName]).toEqual(["", ""]);
    expect(result.isCoach).toBe(false);
    expect(result.grade).toBeUndefined();
  });

  it("defaults a null title to Member and a null grade to undefined", () => {
    const result = memberFromRows({ ...member, title: null }, { ...profile, grade: null, is_coach: true });
    expect(result.teamRole).toBe("Member");
    expect(result.grade).toBeUndefined();
    expect(result.isCoach).toBe(true);
  });

  it("narrows role to accessRole", () => {
    expect(memberFromRows({ ...member, role: "owner" }, profile).accessRole).toBe("owner");
    expect(memberFromRows({ ...member, role: "superuser" }, profile).accessRole).toBeUndefined();
  });
});

describe("events", () => {
  it("reads an unknown event_type as other", () => {
    const row = { ...withServerColumns(eventToInsert(fullEvent, TEAM), CARA), event_type: "party" };
    expect(eventFromRow(row).type).toBe("other");
  });

  // api.ts validates start times; the mapper must not invent or reshape one.
  it("passes a valid start time through unchanged", () => {
    const e = { ...bareEvent, startTime: "09:30" };
    expect(eventToInsert(e, TEAM).start_time).toBe("09:30");
    expect(eventToUpdate(e).start_time).toBe("09:30");
  });
});

describe("malformed jsonb", () => {
  it.each([
    ["an object", { id: "st-1", title: "CAD" }],
    ["a scalar", 42],
    ["null", null],
  ])("reads %s as []", (_, value) => {
    expect(projectFromRow(projectRow(value)).subtasks).toEqual([]);
    expect(taskItemFromRow(taskRow({ subtasks: value })).subtasks).toEqual([]);
    expect(pollFromRow(pollRow({ options: value }), []).options).toEqual([]);
  });

  it("drops bad elements without inventing ids", () => {
    const tasks = taskItemFromRow(
      taskRow({
        subtasks: [
          "nope",
          null,
          [1, 2],
          { title: "no id" },
          { id: 7, title: "numeric id" },
          { id: "sub-x", title: 5 },
          { id: "sub-ok", title: "Keep", completed: true },
        ],
      }),
    );
    expect(tasks.subtasks).toEqual([{ id: "sub-ok", title: "Keep", completed: true }]);

    const poll = pollFromRow(
      pollRow({
        options: [{ id: "opt-a" }, { text: "no id" }, { id: "opt-b", text: "B", color: 3 }],
      }),
      [],
    );
    expect(poll.options).toEqual([{ id: "opt-b", text: "B" }]);
  });

  it("defaults a legacy SubTask's missing color and progress", () => {
    const project = projectFromRow(
      projectRow([
        { id: "st-1", title: "No color" },
        { id: "st-2", title: "Done", completed: true },
      ]),
    );
    expect(project.subtasks).toEqual([
      { id: "st-1", title: "No color", color: "#FF3B30", progress: 0 },
      { id: "st-2", title: "Done", color: "#FF6B35", progress: 100 },
    ]);
  });
});

describe("progress", () => {
  it.each([
    [33.6, 34],
    [-5, 0],
    [140, 100],
    [Number.NaN, 0],
  ])("writes %s as %s", (input, expected) => {
    expect(projectToUpdate({ ...bareProject, progress: input }).progress).toBe(expected);
    expect(taskItemToUpdate({ ...bareTask, progress: input }).progress).toBe(expected);
  });
});

describe("newId", () => {
  it("returns a v4 UUID", () => {
    expect(newId("task")).toMatch(UUID_V4);
  });

  it("falls back to getRandomValues without randomUUID", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: real.getRandomValues.bind(real) });
    const ids = new Set([newId("poll"), newId("poll"), newId("poll")]);
    expect(ids.size).toBe(3);
    for (const id of ids) expect(id).toMatch(UUID_V4);
  });
});
