"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calendar as CalendarIcon,
  CheckSquare,
  ChevronRight,
  Folder,
  ListChecks,
} from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { MOCK_TEAM_NAME, MOCK_TEAM_NUMBER } from "@/lib/beta/mocks";
import {
  DeadlineUrgency,
  Task,
  TeamEvent,
  TeamTask,
  formatDateDisplay,
  formatEventTimeRange,
  formatProgress,
  getDaysAwayText,
  getDeadlineUrgency,
  getEventStartTimestamp,
  getEventTypeColor,
  getEventTypeLabel,
  getProjectProgress,
  getTaskItemProgress,
  getUserPollVotes,
} from "@/lib/beta/types";
import { Card, DeadlineInline, Pill, ProgressBar, StageBadge } from "./_components/ui";
import { WelcomePrimer } from "./_components/WelcomePrimer";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return 0;
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86400000);
}

function countdownText(dateStr: string): string {
  const n = daysUntil(dateStr);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n < 0) return `${Math.abs(n)} day${Math.abs(n) === 1 ? "" : "s"} ago`;
  return `in ${n} days`;
}

function greetingPhrase(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function dateStrFromTs(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function tsForDateOnly(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return 0;
  return new Date(y, m - 1, d).getTime();
}

interface UpcomingItem {
  key: string;
  title: string;
  date: string;
  label: string;
  color: string;
  href: string;
  sortDay: number;
  hasTime: boolean;
  sortTime: number;
  urgency?: DeadlineUrgency | null;
}

export default function HomePage() {
  const { currentUser, tasks, taskItems, polls, events } = useApp();
  // Capture "now" once at mount so render stays pure across re-renders.
  const [nowTs] = useState(() => Date.now());

  const myProjects = useMemo(() => {
    if (!currentUser) return [] as TeamTask[];
    return tasks
      .filter((t) => t.assignedMembers.includes(currentUser.id))
      .sort(
        (a, b) =>
          (new Date(a.dueDate).getTime() || Infinity) -
          (new Date(b.dueDate).getTime() || Infinity),
      )
      .slice(0, 4);
  }, [tasks, currentUser]);

  const myTasks = useMemo(() => {
    if (!currentUser) return [] as Task[];
    return taskItems
      .filter((t) => t.assignedMembers.includes(currentUser.id))
      .sort(
        (a, b) =>
          (new Date(a.dueDate).getTime() || Infinity) -
          (new Date(b.dueDate).getTime() || Infinity),
      )
      .slice(0, 4);
  }, [taskItems, currentUser]);

  const projectsById = useMemo(() => {
    const m: Record<string, TeamTask> = {};
    tasks.forEach((p) => (m[p.id] = p));
    return m;
  }, [tasks]);

  const futureEvents = useMemo(() => {
    return events
      .filter((e) => getEventStartTimestamp(e) >= nowTs)
      .sort((a, b) => getEventStartTimestamp(a) - getEventStartTimestamp(b));
  }, [events, nowTs]);

  const nextEvent = useMemo(
    () => futureEvents.find((e) => e.type !== "competition") ?? null,
    [futureEvents],
  );
  const nextKeyEvent = useMemo(
    () => futureEvents.find((e) => e.type === "competition") ?? null,
    [futureEvents],
  );

  const pendingFor = useMemo(() => {
    return (anchorDate: string | null) => {
      if (!currentUser || !anchorDate) return { projects: 0, tasks: 0, polls: 0 };
      const anchorEnd = new Date(`${anchorDate}T23:59:59`).getTime();
      const projects = tasks.filter(
        (p) =>
          p.assignedMembers.includes(currentUser.id) &&
          p.dueDate &&
          p.dueDate <= anchorDate &&
          getProjectProgress(p, taskItems) < 100,
      ).length;
      const t = taskItems.filter(
        (ti) =>
          ti.assignedMembers.includes(currentUser.id) &&
          ti.dueDate &&
          ti.dueDate <= anchorDate &&
          getTaskItemProgress(ti) < 100,
      ).length;
      const pl = polls.filter(
        (p) =>
          p.closesAt !== undefined &&
          p.closesAt <= anchorEnd &&
          getUserPollVotes(p, currentUser.id).length === 0,
      ).length;
      return { projects, tasks: t, polls: pl };
    };
  }, [currentUser, tasks, taskItems, polls]);

  const upcoming = useMemo<UpcomingItem[]>(() => {
    const startTs = (() => {
      const d = new Date(nowTs);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    const rows: UpcomingItem[] = [];

    events.forEach((e) => {
      const ts = getEventStartTimestamp(e);
      if (ts < startTs) return;
      rows.push({
        key: `e-${e.id}`,
        title: e.title,
        date: `${formatDateDisplay(e.date)} · ${formatEventTimeRange(e)}`,
        label: getEventTypeLabel(e.type),
        color: getEventTypeColor(e.type),
        href: "/beta/calendar",
        sortDay: tsForDateOnly(e.date),
        hasTime: true,
        sortTime: ts,
        urgency: null,
      });
    });
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const dayTs = tsForDateOnly(t.dueDate);
      if (!dayTs || dayTs < startTs) return;
      rows.push({
        key: `t-${t.id}`,
        title: t.name,
        date: formatDateDisplay(t.dueDate),
        label: "Project Due",
        color: t.color || "#2D8CFF",
        href: "/beta/team?tab=projects",
        sortDay: dayTs,
        hasTime: false,
        sortTime: dayTs,
        urgency: getDeadlineUrgency(t.dueDate, getProjectProgress(t, taskItems) >= 100),
      });
    });
    taskItems.forEach((t) => {
      if (!t.dueDate) return;
      const dayTs = tsForDateOnly(t.dueDate);
      if (!dayTs || dayTs < startTs) return;
      rows.push({
        key: `ti-${t.id}`,
        title: t.title,
        date: formatDateDisplay(t.dueDate),
        label: "Task Due",
        color: t.color || "#2D8CFF",
        href: "/beta/team?tab=tasks",
        sortDay: dayTs,
        hasTime: false,
        sortTime: dayTs,
        urgency: getDeadlineUrgency(t.dueDate, getTaskItemProgress(t) >= 100),
      });
    });
    polls.forEach((p) => {
      if (!p.closesAt) return;
      const dayTs = tsForDateOnly(dateStrFromTs(p.closesAt));
      if (dayTs < startTs) return;
      rows.push({
        key: `p-${p.id}`,
        title: p.question,
        date: formatDateDisplay(dateStrFromTs(p.closesAt)),
        label: "Poll Closes",
        color: "#AF52DE",
        href: "/beta/team?tab=polls",
        sortDay: dayTs,
        hasTime: true,
        sortTime: p.closesAt,
        urgency: null,
      });
    });

    rows.sort((a, b) => {
      if (a.sortDay !== b.sortDay) return a.sortDay - b.sortDay;
      if (a.hasTime !== b.hasTime) return a.hasTime ? -1 : 1;
      return a.sortTime - b.sortTime;
    });
    return rows.slice(0, 6);
  }, [events, tasks, taskItems, polls, nowTs]);

  const greetingName = currentUser
    ? currentUser.isCoach
      ? "Coach"
      : currentUser.firstName
    : "there";

  return (
    <div className="space-y-8">
      <WelcomePrimer />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {greetingPhrase()}, {greetingName}
        </h1>
        <p className="mt-1 text-fg-mid">
          Team {MOCK_TEAM_NUMBER} {MOCK_TEAM_NAME}
        </p>
      </header>

      {/* Event spotlight */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EventSpotlight
          title="Next Event"
          accent="#2D8CFF"
          event={nextEvent}
          showTime
          pending={pendingFor(nextEvent?.date ?? null)}
        />
        <EventSpotlight
          title="Next Key Event"
          accent="#FF453A"
          event={nextKeyEvent}
          showTime={false}
          pending={pendingFor(nextKeyEvent?.date ?? null)}
        />
      </div>

      {/* Three columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ListPanel
          title="My Tasks"
          viewAllHref="/beta/team?tab=tasks"
          empty="You're clear on assigned tasks."
        >
          {myTasks.map((t) => {
            const progress = formatProgress(getTaskItemProgress(t));
            const parent = t.parentProjectId ? projectsById[t.parentProjectId] : undefined;
            return (
              <WorkItemRow
                key={t.id}
                href="/beta/team?tab=tasks"
                title={t.title}
                color={t.color}
                progress={progress}
                dueDate={t.dueDate}
                parentName={parent?.name}
                parentColor={parent?.color}
              />
            );
          })}
        </ListPanel>

        <ListPanel
          title="My Projects"
          viewAllHref="/beta/team?tab=projects"
          empty="No assigned projects need attention."
        >
          {myProjects.map((t) => {
            const progress = formatProgress(getProjectProgress(t, taskItems));
            return (
              <WorkItemRow
                key={t.id}
                href="/beta/team?tab=projects"
                title={t.name}
                color={t.color}
                progress={progress}
                dueDate={t.dueDate}
              />
            );
          })}
        </ListPanel>

        <ListPanel
          title="Upcoming"
          viewAllHref="/beta/calendar"
          empty="Nothing upcoming."
        >
          {upcoming.map((u) => (
            <Link
              key={u.key}
              href={u.href}
              className="flex items-start justify-between gap-3 rounded-xl border border-edge bg-raised/40 px-3.5 py-3 transition-colors hover:border-signal-dim"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">{u.title}</p>
                <Pill label={u.label} color={u.color} className="mt-1.5" />
              </div>
              <DeadlineInline text={u.date} urgency={u.urgency ?? null} />
            </Link>
          ))}
        </ListPanel>
      </div>
    </div>
  );
}

function EventSpotlight({
  title,
  accent,
  event,
  showTime,
  pending,
}: {
  title: string;
  accent: string;
  event: TeamEvent | null;
  showTime: boolean;
  pending: { projects: number; tasks: number; polls: number };
}) {
  const total = pending.projects + pending.tasks + pending.polls;
  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ backgroundColor: accent }} />
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {event ? (
          <Link href="/beta/calendar" className="group block">
            <div className="flex items-center justify-between gap-3">
              <Pill label={getEventTypeLabel(event.type)} color={accent} />
              <span className="text-sm font-medium" style={{ color: accent }}>
                {countdownText(event.date)}
              </span>
            </div>
            <p className="mt-2.5 text-lg font-medium text-fg">{event.title}</p>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-fg-mid">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>
                {formatDateDisplay(event.date)}
                {showTime ? ` · ${formatEventTimeRange(event)}` : ""}
              </span>
              <ArrowRight className="ml-auto h-4 w-4 text-fg-dim transition-transform group-hover:translate-x-0.5" />
            </div>
            {total > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <PendingChip icon={<Folder className="h-3.5 w-3.5" />} count={pending.projects} noun="Project" />
                <PendingChip icon={<CheckSquare className="h-3.5 w-3.5" />} count={pending.tasks} noun="Task" />
                <PendingChip icon={<BarChart3 className="h-3.5 w-3.5" />} count={pending.polls} noun="Poll" />
              </div>
            ) : null}
          </Link>
        ) : (
          <p className="py-4 text-sm text-fg-dim">No upcoming {title.toLowerCase()}.</p>
        )}
      </div>
    </Card>
  );
}

function PendingChip({
  icon,
  count,
  noun,
}: {
  icon: React.ReactNode;
  count: number;
  noun: string;
}) {
  const quiet = count === 0;
  return (
    <div
      className={`flex items-center justify-center gap-1.5 rounded-lg bg-raised px-2 py-2 text-xs font-medium ${
        quiet ? "text-success" : "text-fg"
      }`}
    >
      <span className={quiet ? "text-success" : "text-fg-mid"}>{icon}</span>
      {count} {count === 1 ? noun : `${noun}s`}
    </div>
  );
}

function ListPanel({
  title,
  viewAllHref,
  empty,
  children,
}: {
  title: string;
  viewAllHref: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.some(Boolean) && items.flat().filter(Boolean).length > 0;
  return (
    <Card className="flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-signal hover:underline"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {hasItems ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-edge px-3.5 py-4 text-sm text-fg-dim">
          <ListChecks className="h-4 w-4" />
          {empty}
        </div>
      )}
    </Card>
  );
}

function WorkItemRow({
  href,
  title,
  color,
  progress,
  dueDate,
  parentName,
  parentColor,
}: {
  href: string;
  title: string;
  color: string;
  progress: number;
  dueDate: string;
  parentName?: string;
  parentColor?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-edge bg-raised/40 px-3.5 py-3 transition-colors hover:border-signal-dim"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-fg">{title}</p>
        <span className="shrink-0 text-xs text-fg-mid">{progress}%</span>
      </div>
      {parentName ? (
        <Pill label={parentName} color={parentColor ?? "#2D8CFF"} className="mt-1.5" />
      ) : null}
      <ProgressBar value={progress} color={color} className="mt-2" />
      <div className="mt-2 flex items-center justify-between">
        <StageBadge progress={progress} />
        {dueDate ? (
          <DeadlineInline
            text={`${formatDateDisplay(dueDate)} · ${getDaysAwayText(dueDate)}`}
            urgency={getDeadlineUrgency(dueDate, progress === 100)}
          />
        ) : null}
      </div>
    </Link>
  );
}
