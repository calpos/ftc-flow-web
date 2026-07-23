"use client";

import { Check, Pencil, Plus } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import {
  Task,
  TeamTask,
  formatDateDisplay,
  formatProgress,
  formatTime12h,
  getDaysAwayText,
  getDeadlineUrgency,
  getProjectProgress,
  getTaskItemProgress,
} from "@/lib/beta/types";
import { SlideOver } from "./Dialog";
import { Avatar, Button, Pill, ProgressBar, StageBadge } from "./ui";

function MemberList({ ids }: { ids: string[] }) {
  const { members } = useApp();
  const resolved = ids
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);
  if (!resolved.length) return <p className="text-sm text-fg-dim">No one assigned.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {resolved.map((m) => (
        <span
          key={m.id}
          className="inline-flex items-center gap-2 rounded-full border border-edge bg-raised py-1 pl-1 pr-3"
        >
          <Avatar member={m} size={22} />
          <span className="text-xs text-fg">
            {m.firstName} {m.lastName}
          </span>
        </span>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-dim">
      {children}
    </p>
  );
}

export function TaskDetail({
  task,
  onClose,
  onEdit,
  open = true,
}: {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  open?: boolean;
}) {
  const { currentUser, tasks, updateTaskItem, deleteTaskItem } = useApp();
  const parent = task.parentProjectId
    ? tasks.find((p) => p.id === task.parentProjectId)
    : undefined;
  const progress = formatProgress(getTaskItemProgress(task));
  const amAssigned = currentUser ? task.assignedMembers.includes(currentUser.id) : false;

  function toggleSub(id: string) {
    updateTaskItem({
      ...task,
      subtasks: task.subtasks.map((s) =>
        s.id === id ? { ...s, completed: !s.completed } : s,
      ),
    });
  }
  function toggleJoin() {
    if (!currentUser) return;
    const assignedMembers = amAssigned
      ? task.assignedMembers.filter((id) => id !== currentUser.id)
      : [...task.assignedMembers, currentUser.id];
    updateTaskItem({ ...task, assignedMembers });
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={task.title}
      accent={task.color}
      footer={
        <>
          <Button
            variant="danger"
            className="mr-auto"
            onClick={() => {
              deleteTaskItem(task.id);
              onClose();
            }}
          >
            Delete
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {parent ? <Pill label={parent.name} color={parent.color} /> : null}
        {task.description ? (
          <p className="text-sm leading-relaxed text-fg-mid">{task.description}</p>
        ) : null}

        <div>
          <SectionLabel>Progress</SectionLabel>
          <div className="flex items-center gap-3">
            <ProgressBar value={progress} color={task.color} className="flex-1" />
            <span className="text-sm font-medium text-fg">{progress}%</span>
          </div>
          <div className="mt-1.5">
            <StageBadge progress={progress} />
          </div>
        </div>

        {task.dueDate ? (
          <div>
            <SectionLabel>Due</SectionLabel>
            {(() => {
              const u = getDeadlineUrgency(task.dueDate, progress === 100);
              const relCls = (u === "overdue" || u === "today") ? "ml-2 text-danger" : u === "due-soon" ? "ml-2 text-warning" : "ml-2 text-fg-dim";
              return (
                <p className="text-sm text-fg">
                  {formatDateDisplay(task.dueDate)}
                  {task.dueTime ? ` · ${formatTime12h(task.dueTime)}` : ""}
                  <span className={relCls}>{getDaysAwayText(task.dueDate)}</span>
                </p>
              );
            })()}
          </div>
        ) : null}

        {task.subtasks.length ? (
          <div>
            <SectionLabel>Subtasks</SectionLabel>
            <div className="space-y-1.5">
              {task.subtasks.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSub(s.id)}
                  className="flex w-full items-center gap-2.5 rounded-[10px] border border-edge bg-raised px-3 py-2 text-left"
                >
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                      s.completed ? "border-success bg-success text-ink" : "border-fg-dim"
                    }`}
                  >
                    {s.completed ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span
                    className={`text-sm ${
                      s.completed ? "text-fg-dim line-through" : "text-fg"
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <SectionLabel>Assigned</SectionLabel>
          <MemberList ids={task.assignedMembers} />
          {currentUser ? (
            <button
              type="button"
              onClick={toggleJoin}
              className="mt-3 text-sm font-medium text-signal hover:underline"
            >
              {amAssigned ? "Leave this task" : "Join this task"}
            </button>
          ) : null}
        </div>
      </div>
    </SlideOver>
  );
}

export function ProjectDetail({
  project,
  onClose,
  onEdit,
  onOpenTask,
  onAddTask,
  open = true,
}: {
  project: TeamTask;
  onClose: () => void;
  onEdit: () => void;
  onOpenTask: (taskId: string) => void;
  onAddTask: () => void;
  open?: boolean;
}) {
  const { currentUser, taskItems, updateProjectWithCascade, deleteTask } = useApp();
  const children = taskItems.filter((t) => t.parentProjectId === project.id);
  const progress = formatProgress(getProjectProgress(project, taskItems));
  const amAssigned = currentUser
    ? project.assignedMembers.includes(currentUser.id)
    : false;

  function toggleJoin() {
    if (!currentUser) return;
    const assignedMembers = amAssigned
      ? project.assignedMembers.filter((id) => id !== currentUser.id)
      : [...project.assignedMembers, currentUser.id];
    updateProjectWithCascade({ ...project, assignedMembers, editors: assignedMembers });
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={project.name}
      accent={project.color}
      footer={
        <>
          <Button
            variant="danger"
            className="mr-auto"
            onClick={() => {
              deleteTask(project.id);
              onClose();
            }}
          >
            Delete
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {project.description ? (
          <p className="text-sm leading-relaxed text-fg-mid">{project.description}</p>
        ) : null}

        <div>
          <SectionLabel>Progress</SectionLabel>
          <div className="flex items-center gap-3">
            <ProgressBar value={progress} color={project.color} className="flex-1" />
            <span className="text-sm font-medium text-fg">{progress}%</span>
          </div>
          <div className="mt-1.5">
            <StageBadge progress={progress} />
          </div>
        </div>

        {project.dueDate ? (
          <div>
            <SectionLabel>Target date</SectionLabel>
            {(() => {
              const u = getDeadlineUrgency(project.dueDate, progress === 100);
              const relCls = (u === "overdue" || u === "today") ? "ml-2 text-danger" : u === "due-soon" ? "ml-2 text-warning" : "ml-2 text-fg-dim";
              return (
                <p className="text-sm text-fg">
                  {formatDateDisplay(project.dueDate)}
                  <span className={relCls}>{getDaysAwayText(project.dueDate)}</span>
                </p>
              );
            })()}
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel>Tasks ({children.length})</SectionLabel>
            <button
              type="button"
              onClick={onAddTask}
              className="inline-flex items-center gap-1 text-xs font-medium text-signal hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
          </div>
          {children.length ? (
            <div className="space-y-1.5">
              {children.map((t) => {
                const p = formatProgress(getTaskItemProgress(t));
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onOpenTask(t.id)}
                    className="w-full rounded-[10px] border border-edge bg-raised px-3 py-2.5 text-left transition-colors hover:border-signal-dim"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-fg">{t.title}</span>
                      <span className="shrink-0 text-xs text-fg-mid">{p}%</span>
                    </div>
                    <ProgressBar value={p} color={t.color} className="mt-1.5" />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-fg-dim">No tasks yet.</p>
          )}
        </div>

        <div>
          <SectionLabel>Assigned</SectionLabel>
          <MemberList ids={project.assignedMembers} />
          {currentUser ? (
            <button
              type="button"
              onClick={toggleJoin}
              className="mt-3 text-sm font-medium text-signal hover:underline"
            >
              {amAssigned ? "Leave this project" : "Join this project"}
            </button>
          ) : null}
        </div>
      </div>
    </SlideOver>
  );
}
