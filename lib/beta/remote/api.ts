import type { SupabaseClient } from "@supabase/supabase-js";
import {
  eventToInsert,
  eventToUpdate,
  eventFromRow,
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
  type PollVoteInput,
} from "@/lib/beta/remote/mappers";
// Type-only: storage.ts pulls in the mocks.
import type { AppData } from "@/lib/beta/storage";
import type { Poll, Task, TeamEvent, TeamTask } from "@/lib/beta/types";
import { createClient } from "@/lib/supabase/client";
import type {
  Database,
  ProfileUpdate,
  TeamMemberUpdate,
  TeamRole,
} from "@/lib/supabase/database.types";
import { friendlyError } from "@/lib/supabase/errors";

/**
 * Reads and writes for the /beta workspace. Every function takes an optional
 * client (the browser singleton by default) and throws an Error whose message
 * is safe to show; the original error is its cause.
 */

type Client = SupabaseClient<Database>;

export const NOT_FOUND = "That item no longer exists, or you can't edit it.";

function resolve(client?: Client): Client {
  const resolved = client ?? createClient();
  if (!resolved) throw new Error("Supabase is not configured.");
  return resolved;
}

function fail(e: unknown): never {
  throw new Error(friendlyError(e), { cause: e });
}

function check({ error }: { error: unknown }): void {
  if (error) fail(error);
}

// RLS hides rows the caller can't update and a deleted row matches nothing;
// PostgREST reports both as success with zero rows, so that is checked here.
function checkRows({ data, error }: { data: unknown[] | null; error: unknown }): void {
  if (error) fail(error);
  if (!data || data.length === 0) throw new Error(NOT_FOUND);
}

// --- Workspace ---------------------------------------------------------------

export async function fetchWorkspace(
  teamId: string,
  userId: string,
  client?: Client,
): Promise<AppData> {
  const supabase = resolve(client);

  // Every query is filtered to the team: RLS returns every team the user is
  // in. Known limit: PostgREST caps each response at max-rows (1000 by
  // default), so a larger table comes back truncated.
  const [members, projects, taskItems, polls, events, votes] = await Promise.all([
    supabase
      .from("team_members")
      .select("user_id, role, title, work_roles, joined_at")
      .eq("team_id", teamId)
      .order("joined_at")
      .order("user_id"),
    supabase.from("projects").select("*").eq("team_id", teamId).order("created_at").order("id"),
    supabase.from("task_items").select("*").eq("team_id", teamId).order("created_at").order("id"),
    supabase.from("polls").select("*").eq("team_id", teamId).order("created_at").order("id"),
    supabase.from("events").select("*").eq("team_id", teamId).order("created_at").order("id"),
    supabase
      .from("poll_votes")
      .select("poll_id, user_id, option_ids, polls!inner(team_id)")
      .eq("polls.team_id", teamId),
  ]);

  const error =
    members.error ??
    projects.error ??
    taskItems.error ??
    polls.error ??
    events.error ??
    votes.error;
  if (error) fail(error);

  const memberRows = members.data ?? [];
  if (!memberRows.some((member) => member.user_id === userId)) fail("not_team_member");

  const ids = memberRows.map((member) => member.user_id);
  let profileRows: (MemberProfileInput & { id: string })[] = [];
  if (ids.length > 0) {
    const profiles = await supabase
      .from("profiles")
      .select("id, first_name, last_name, display_name, grade, is_coach")
      .in("id", ids);
    if (profiles.error) fail(profiles.error);
    profileRows = profiles.data ?? [];
  }

  const profileById = new Map(profileRows.map((profile) => [profile.id, profile]));
  const votesByPoll = new Map<string, PollVoteInput[]>();
  for (const vote of votes.data ?? []) {
    const list = votesByPoll.get(vote.poll_id);
    if (list) list.push(vote);
    else votesByPoll.set(vote.poll_id, [vote]);
  }
  const memberIds = new Set(ids);

  return {
    members: memberRows.map((member) => memberFromRows(member, profileById.get(member.user_id))),
    tasks: (projects.data ?? []).map(projectFromRow),
    taskItems: (taskItems.data ?? []).map(taskItemFromRow),
    polls: (polls.data ?? []).map((poll) =>
      pollFromRow(poll, votesByPoll.get(poll.id) ?? [], memberIds),
    ),
    events: (events.data ?? []).map(eventFromRow),
    currentUserId: userId,
  };
}

// --- Projects ----------------------------------------------------------------

// Writes are insert and update, never upsert: its ON CONFLICT DO UPDATE sets
// ungranted columns (id, team_id) and fails with 42501.
export async function insertProject(p: TeamTask, teamId: string, client?: Client): Promise<void> {
  check(await resolve(client).from("projects").insert(projectToInsert(p, teamId)));
}

export async function updateProject(p: TeamTask, client?: Client): Promise<void> {
  checkRows(
    await resolve(client).from("projects").update(projectToUpdate(p)).eq("id", p.id).select("id"),
  );
}

export async function deleteProject(id: string, client?: Client): Promise<void> {
  check(await resolve(client).from("projects").delete().eq("id", id));
}

// --- Task items --------------------------------------------------------------

export async function insertTaskItem(t: Task, teamId: string, client?: Client): Promise<void> {
  check(await resolve(client).from("task_items").insert(taskItemToInsert(t, teamId)));
}

export async function updateTaskItem(t: Task, client?: Client): Promise<void> {
  checkRows(
    await resolve(client).from("task_items").update(taskItemToUpdate(t)).eq("id", t.id).select("id"),
  );
}

export async function deleteTaskItem(id: string, client?: Client): Promise<void> {
  check(await resolve(client).from("task_items").delete().eq("id", id));
}

// --- Polls -------------------------------------------------------------------

export async function insertPoll(p: Poll, teamId: string, client?: Client): Promise<void> {
  check(await resolve(client).from("polls").insert(pollToInsert(p, teamId)));
}

export async function updatePoll(p: Poll, client?: Client): Promise<void> {
  checkRows(
    await resolve(client).from("polls").update(pollToUpdate(p)).eq("id", p.id).select("id"),
  );
}

export async function deletePoll(id: string, client?: Client): Promise<void> {
  check(await resolve(client).from("polls").delete().eq("id", id));
}

/** Casts or changes the caller's ballot. An empty optionIds retracts it. */
export async function setPollVote(
  pollId: string,
  optionIds: string[],
  client?: Client,
): Promise<void> {
  check(
    await resolve(client).rpc("set_poll_vote", { p_poll_id: pollId, p_option_ids: optionIds }),
  );
}

// --- Events ------------------------------------------------------------------

const START_TIME = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// start_time and event_date are NOT NULL with CHECKs; catch a cleared field
// here so the user gets specific copy instead of a generic 23514.
function validateEvent(e: TeamEvent): void {
  if (!START_TIME.test(e.startTime)) throw new Error("Choose a start time for this event.");
  if (!DATE.test(e.date)) throw new Error("Choose a date for this event.");
}

export async function insertEvent(e: TeamEvent, teamId: string, client?: Client): Promise<void> {
  // Resolve first so an unconfigured client still reports that.
  const supabase = resolve(client);
  validateEvent(e);
  check(await supabase.from("events").insert(eventToInsert(e, teamId)));
}

export async function updateEvent(e: TeamEvent, client?: Client): Promise<void> {
  // Resolve first so an unconfigured client still reports that.
  const supabase = resolve(client);
  validateEvent(e);
  checkRows(await supabase.from("events").update(eventToUpdate(e)).eq("id", e.id).select("id"));
}

export async function deleteEvent(id: string, client?: Client): Promise<void> {
  check(await resolve(client).from("events").delete().eq("id", id));
}

// --- Profile and membership --------------------------------------------------

// An all-undefined patch serializes to {}, which PostgREST answers with zero
// rows; checkRows would then misreport it as NOT_FOUND.
function definedOnly<T extends object>(fields: T): T {
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)) as T;
}

export async function updateOwnProfile(fields: ProfileUpdate, client?: Client): Promise<void> {
  const supabase = resolve(client);
  const patch = definedOnly(fields);
  if (Object.keys(patch).length === 0) return;
  const { data, error } = await supabase.auth.getUser();
  // A missing session comes back as an error; keep its copy when there is one.
  if (!data.user) fail(error ?? "not_authenticated");
  checkRows(
    await supabase.from("profiles").update(patch).eq("id", data.user.id).select("id"),
  );
}

export async function updateMembership(
  teamId: string,
  userId: string,
  fields: TeamMemberUpdate,
  client?: Client,
): Promise<void> {
  const supabase = resolve(client);
  const patch = definedOnly(fields);
  if (Object.keys(patch).length === 0) return;
  checkRows(
    await supabase
      .from("team_members")
      .update(patch)
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .select("user_id"),
  );
}

export async function regenerateJoinCode(teamId: string, client?: Client): Promise<string> {
  const { data, error } = await resolve(client).rpc("regenerate_join_code", { p_team_id: teamId });
  if (error) fail(error);
  return data;
}

export async function setMemberRole(
  teamId: string,
  userId: string,
  role: TeamRole,
  client?: Client,
): Promise<void> {
  check(
    await resolve(client).rpc("set_member_role", {
      p_role: role,
      p_team_id: teamId,
      p_user_id: userId,
    }),
  );
}

export async function removeMember(teamId: string, userId: string, client?: Client): Promise<void> {
  check(await resolve(client).rpc("remove_member", { p_team_id: teamId, p_user_id: userId }));
}
