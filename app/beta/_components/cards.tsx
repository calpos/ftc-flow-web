"use client";

import { CalendarDays, Check, ListChecks, Trash2 } from "lucide-react";
import {
  Task,
  TeamEvent,
  TeamMember,
  TeamTask,
  formatDateDisplay,
  formatEventTimeRange,
  formatProgress,
  getDaysAwayText,
  getEventTypeColor,
  getEventTypeLabel,
  getProjectProgress,
  getTaskItemProgress,
} from "@/lib/beta/types";
import { AvatarStack, Card, Pill, ProgressBar, StageBadge } from "./ui";

function membersByIds(members: TeamMember[], ids: string[]): TeamMember[] {
  return ids
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is TeamMember => !!m);
}

export function ProjectCard({
  project,
  taskItems,
  members,
  onOpen,
}: {
  project: TeamTask;
  taskItems: Task[];
  members: TeamMember[];
  onOpen: () => void;
}) {
  const progress = formatProgress(getProjectProgress(project, taskItems));
  const childCount = taskItems.filter((t) => t.parentProjectId === project.id).length;
  const assigned = membersByIds(members, project.assignedMembers);

  return (
    <Card onClick={onOpen} className="overflow-hidden">
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: project.color }} />
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate font-medium text-fg">{project.name}</h3>
            {project.dueDate ? (
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-fg-mid">
                  {formatDateDisplay(project.dueDate)}
                </p>
                <p className="text-[11px] text-fg-dim">{getDaysAwayText(project.dueDate)}</p>
              </div>
            ) : null}
          </div>
          {project.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-fg-mid">{project.description}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={progress} color={project.color} className="flex-1" />
            <span className="text-xs font-medium text-fg">{progress}%</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <StageBadge progress={progress} />
              <span className="inline-flex items-center gap-1 text-xs text-fg-dim">
                <ListChecks className="h-3.5 w-3.5" />
                {childCount} task{childCount === 1 ? "" : "s"}
              </span>
            </div>
            {assigned.length ? <AvatarStack members={assigned} /> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TaskCard({
  task,
  parent,
  members,
  onOpen,
  onComplete,
  onDelete,
}: {
  task: Task;
  parent?: TeamTask;
  members: TeamMember[];
  onOpen: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
}) {
  const progress = formatProgress(getTaskItemProgress(task));
  const isComplete = getTaskItemProgress(task) >= 100;
  const assigned = membersByIds(members, task.assignedMembers);
  const doneSubs = task.subtasks.filter((s) => s.completed).length;

  return (
    <Card as="div" className="overflow-hidden group hover:border-signal-dim cursor-default">
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: task.color }} />
        <div className={`min-w-0 flex-1 p-4${isComplete ? " opacity-60 transition-opacity duration-300" : ""}`}>
          <button
            type="button"
            onClick={onOpen}
            className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal rounded-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className={`truncate font-medium${isComplete ? " line-through text-fg-dim transition-all duration-300" : " text-fg"}`}>
                  {task.title}
                </h3>
                {parent ? (
                  <Pill label={parent.name} color={parent.color} className="mt-1.5" />
                ) : null}
              </div>
              {task.dueDate ? (
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-fg-mid">
                    {formatDateDisplay(task.dueDate)}
                  </p>
                  <p className="text-[11px] text-fg-dim">{getDaysAwayText(task.dueDate)}</p>
                </div>
              ) : null}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={progress} color={task.color} className="flex-1" />
              <span className="text-xs font-medium text-fg">{progress}%</span>
            </div>
          </button>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <StageBadge progress={progress} />
              {task.subtasks.length ? (
                <span className="text-xs text-fg-dim">
                  {doneSubs}/{task.subtasks.length} subtasks
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              {assigned.length ? <AvatarStack members={assigned} /> : null}
              {(onComplete || onDelete) ? (
                <div className="pointer-events-none flex items-center gap-1 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(pointer:coarse)]:pointer-events-auto [@media(pointer:coarse)]:opacity-100">
                  {onComplete ? (
                    <button
                      type="button"
                      aria-label={isComplete ? "Mark incomplete" : "Mark complete"}
                      onClick={(e) => { e.stopPropagation(); onComplete(); }}
                      className={`grid h-7 w-7 place-items-center rounded-lg transition-transform duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34C759] active:scale-90${isComplete ? " border border-[#34C759]/40 bg-[#34C759]/10 text-[#34C759]" : " text-fg-dim hover:bg-[#34C759]/10 hover:text-[#34C759]"}`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      aria-label="Delete task"
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                      className="grid h-7 w-7 place-items-center rounded-lg text-fg-dim transition-transform duration-100 hover:bg-[#FF453A]/10 hover:text-[#FF453A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF453A] active:scale-90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function EventCard({
  event,
  onOpen,
}: {
  event: TeamEvent;
  onOpen: () => void;
}) {
  const color = getEventTypeColor(event.type);
  return (
    <Card onClick={onOpen} className="overflow-hidden">
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: color }} />
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center justify-between gap-3">
            <Pill label={getEventTypeLabel(event.type)} color={color} />
            <span className="text-xs text-fg-dim">{getDaysAwayText(event.date)}</span>
          </div>
          <h3 className="mt-2 truncate font-medium text-fg">{event.title}</h3>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-fg-mid">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDateDisplay(event.date)} · {formatEventTimeRange(event)}
          </div>
        </div>
      </div>
    </Card>
  );
}
