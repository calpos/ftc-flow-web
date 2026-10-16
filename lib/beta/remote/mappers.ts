import {
  EVENT_TYPE_INFO,
  SUBTASK_COLORS,
  type EventType,
  type Poll,
  type PollOption,
  type SubTask,
  type Task,
  type TaskSubtask,
  type TeamEvent,
  type TeamMember,
  type TeamTask,
} from "@/lib/beta/types";
import type {
  EventInsert,
  EventRow,
  EventUpdate,
  Json,
  PollInsert,
  PollRow,
  PollUpdate,
  PollVoteRow,
  ProfileRow,
  ProjectInsert,
  ProjectRow,
  ProjectUpdate,
  TaskItemInsert,
  TaskItemRow,
  TaskItemUpdate,
  Tables,
  TeamRole,
} from "@/lib/supabase/database.types";

/**
 * Pure conversions between the /beta domain types and the workspace rows.
 * Project = projects (TeamTask), TaskItem = task_items (Task), Poll = polls
 * plus poll_votes, Event = events (TeamEvent).
 */

// created_by defaults to auth.uid() and the insert policy requires exactly
// that; the timestamps default to now(). The client never sends any of them.
type ServerColumns = "created_by" | "created_at" | "updated_at";

export type MemberRowInput = Pick<
  Tables<"team_members">,
  "user_id" | "role" | "title" | "work_roles" | "joined_at"
>;
export type MemberProfileInput = Pick<
  ProfileRow,
  "first_name" | "last_name" | "display_name" | "grade" | "is_coach"
>;
export type PollVoteInput = Pick<PollVoteRow, "poll_id" | "user_id" | "option_ids">;

const TEAM_ROLES: readonly string[] = ["owner", "admin", "member"] satisfies TeamRole[];

function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === "string" && TEAM_ROLES.includes(value);
}

function isEventType(value: unknown): value is EventType {
  return EVENT_TYPE_INFO.some((info) => info.type === value);
}

// Date.parse handles PostgREST's "+00:00" offset and microsecond fractions,
// keeping millisecond precision.
function msFromIso(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

function isoFromMs(ms: number | undefined): string | null {
  return ms !== undefined && Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

// The progress columns are integer with CHECK 0..100.
function progressToColumn(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

// The time CHECKs reject '', so an empty optional time is stored as NULL.
function timeToColumn(value: string | undefined): string | null {
  return value || null;
}

// jsonb columns carry no shape constraint, so a non-array reads as empty and a
// malformed element is dropped, never patched with a made-up id.
function jsonRecords(value: Json): (Record<string, unknown> | undefined)[] {
  if (!Array.isArray(value)) return [];
  return value.map((element) =>
    typeof element === "object" && element !== null && !Array.isArray(element)
      ? (element as Record<string, unknown>)
      : undefined,
  );
}

function hasId(record: Record<string, unknown> | undefined): record is Record<string, unknown> & { id: string } {
  return record !== undefined && typeof record.id === "string" && record.id !== "";
}

// Legacy SubTask defaults match migrateTask's, by position in the stored list.
function subTasksFromJson(value: Json): SubTask[] {
  const subtasks: SubTask[] = [];
  jsonRecords(value).forEach((record, index) => {
    if (!hasId(record) || typeof record.title !== "string") return;
    subtasks.push({
      id: record.id,
      title: record.title,
      color:
        typeof record.color === "string"
          ? record.color
          : SUBTASK_COLORS[index % SUBTASK_COLORS.length],
      progress:
        typeof record.progress === "number" ? record.progress : record.completed === true ? 100 : 0,
    });
  });
  return subtasks;
}

function taskSubtasksFromJson(value: Json): TaskSubtask[] {
  const subtasks: TaskSubtask[] = [];
  for (const record of jsonRecords(value)) {
    if (!hasId(record) || typeof record.title !== "string") continue;
    subtasks.push({ id: record.id, title: record.title, completed: record.completed === true });
  }
  return subtasks;
}

function pollOptionsFromJson(value: Json): PollOption[] {
  const options: PollOption[] = [];
  for (const record of jsonRecords(value)) {
    if (!hasId(record) || typeof record.text !== "string") continue;
    options.push({
      id: record.id,
      text: record.text,
      color: typeof record.color === "string" ? record.color : undefined,
    });
  }
  return options;
}

function splitDisplayName(displayName: string | null): [string, string] {
  const match = /^(\S+)\s+([\s\S]*)$/.exec(displayName?.trim() ?? "");
  if (match) return [match[1], match[2]];
  return [displayName?.trim() ?? "", ""];
}

// --- Members -----------------------------------------------------------------

export function memberFromRows(
  member: MemberRowInput,
  profile: MemberProfileInput | undefined,
): TeamMember {
  const first = profile?.first_name?.trim() ?? "";
  const last = profile?.last_name?.trim() ?? "";
  const [firstName, lastName] =
    first || last ? [first, last] : splitDisplayName(profile?.display_name ?? null);
  return {
    id: member.user_id,
    firstName,
    lastName,
    teamRole: member.title ?? "Member",
    workRoles: member.work_roles,
    grade: profile?.grade ?? undefined,
    isCoach: profile?.is_coach ?? false,
    accessRole: isTeamRole(member.role) ? member.role : undefined,
  };
}

// --- Projects ----------------------------------------------------------------

export function projectFromRow(row: ProjectRow): TeamTask {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    dueDate: row.due_date ?? "",
    assignedMembers: row.assigned_members,
    editors: row.editors,
    createdBy: row.created_by ?? "",
    subtasks: subTasksFromJson(row.subtasks),
    progress: row.progress,
    imageUri: row.image_uri ?? undefined,
    bannerUri: row.banner_uri ?? undefined,
  };
}

export function projectToUpdate(p: TeamTask): Required<ProjectUpdate> {
  return {
    name: p.name,
    description: p.description,
    color: p.color,
    due_date: p.dueDate || null,
    assigned_members: p.assignedMembers,
    editors: p.editors,
    progress: progressToColumn(p.progress),
    subtasks: p.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      color: s.color,
      progress: s.progress,
    })),
    image_uri: p.imageUri ?? null,
    banner_uri: p.bannerUri ?? null,
  };
}

export function projectToInsert(
  p: TeamTask,
  teamId: string,
): Required<Omit<ProjectInsert, ServerColumns>> {
  return { id: p.id, team_id: teamId, ...projectToUpdate(p) };
}

// --- Task items --------------------------------------------------------------

export function taskItemFromRow(row: TaskItemRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    color: row.color,
    dueDate: row.due_date ?? "",
    dueTime: row.due_time ?? undefined,
    assignedMembers: row.assigned_members,
    editors: row.editors,
    subtasks: taskSubtasksFromJson(row.subtasks),
    parentProjectId: row.parent_project_id ?? undefined,
    overrideFlag: row.override_flag,
    progress: row.progress,
    createdBy: row.created_by ?? "",
    createdAt: msFromIso(row.created_at) ?? 0,
  };
}

export function taskItemToUpdate(t: Task): Required<TaskItemUpdate> {
  return {
    title: t.title,
    description: t.description,
    color: t.color,
    due_date: t.dueDate || null,
    due_time: timeToColumn(t.dueTime),
    assigned_members: t.assignedMembers,
    editors: t.editors,
    progress: progressToColumn(t.progress),
    subtasks: t.subtasks.map((s) => ({ id: s.id, title: s.title, completed: s.completed })),
    // A uuid column: '' would fail the cast, and means "standalone" anyway.
    parent_project_id: t.parentProjectId || null,
    override_flag: t.overrideFlag,
  };
}

export function taskItemToInsert(
  t: Task,
  teamId: string,
): Required<Omit<TaskItemInsert, ServerColumns>> {
  return { id: t.id, team_id: teamId, ...taskItemToUpdate(t) };
}

// --- Polls -------------------------------------------------------------------

// set_poll_vote validates ballots only at write time, so stale option ids,
// ballots from removed members and multi-id ballots on a now-single-select
// poll all persist and are filtered here.
function votesFromRows(
  row: PollRow,
  options: readonly PollOption[],
  votes: readonly PollVoteInput[],
  memberIds: ReadonlySet<string> | undefined,
): Record<string, string[]> {
  const optionIds = new Set(options.map((option) => option.id));
  const result: Record<string, string[]> = {};
  for (const vote of votes) {
    if (vote.poll_id !== row.id) continue;
    if (memberIds && !memberIds.has(vote.user_id)) continue;
    let ids = [...new Set(vote.option_ids.filter((id) => optionIds.has(id)))];
    if (!row.allow_multiple) ids = ids.slice(0, 1);
    if (ids.length > 0) result[vote.user_id] = ids;
  }
  return result;
}

export function pollFromRow(
  row: PollRow,
  votes: readonly PollVoteInput[],
  memberIds?: ReadonlySet<string>,
): Poll {
  const options = pollOptionsFromJson(row.options);
  return {
    id: row.id,
    question: row.question,
    options,
    creatorId: row.created_by ?? "",
    isOpen: row.is_open,
    closesAt: msFromIso(row.closes_at),
    allowMultiple: row.allow_multiple,
    votes: votesFromRows(row, options, votes, memberIds),
    createdAt: msFromIso(row.created_at) ?? 0,
    color: row.color,
    imageUri: row.image_uri ?? undefined,
  };
}

export function pollToUpdate(p: Poll): Required<PollUpdate> {
  return {
    question: p.question,
    options: p.options.map((o) => ({ id: o.id, text: o.text, color: o.color })),
    is_open: p.isOpen,
    closes_at: isoFromMs(p.closesAt),
    allow_multiple: p.allowMultiple,
    color: p.color,
    image_uri: p.imageUri ?? null,
  };
}

export function pollToInsert(
  p: Poll,
  teamId: string,
): Required<Omit<PollInsert, ServerColumns>> {
  return { id: p.id, team_id: teamId, ...pollToUpdate(p) };
}

// --- Events ------------------------------------------------------------------

export function eventFromRow(row: EventRow): TeamEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    type: isEventType(row.event_type) ? row.event_type : "other",
    description: row.description ?? undefined,
    createdBy: row.created_by ?? "",
    createdAt: msFromIso(row.created_at) ?? 0,
  };
}

export function eventToUpdate(e: TeamEvent): Required<EventUpdate> {
  return {
    title: e.title,
    event_date: e.date,
    start_time: e.startTime,
    end_time: timeToColumn(e.endTime),
    event_type: e.type,
    description: e.description ?? null,
  };
}

export function eventToInsert(
  e: TeamEvent,
  teamId: string,
): Required<Omit<EventInsert, ServerColumns>> {
  return { id: e.id, team_id: teamId, ...eventToUpdate(e) };
}
