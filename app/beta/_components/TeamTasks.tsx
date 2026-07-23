"use client";

import { useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { Task, getTaskItemProgress } from "@/lib/beta/types";
import { TaskFilters, createDefaultTaskFilters } from "@/lib/beta/filters";
import { getFilteredAndSortedTaskItems } from "./taskItemFilters";
import { Button, EmptyState } from "./ui";
import { WorkFilterBar } from "./WorkFilterBar";
import { TaskCard } from "./cards";
import { TaskDetail } from "./details";
import { TaskDialog } from "./TaskDialog";
import { Dialog } from "./Dialog";

export function TeamTasks() {
  const { tasks, taskItems, members, currentUserId, updateTaskItem, deleteTaskItem } = useApp();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TaskFilters>(() => createDefaultTaskFilters());

  const [dialog, setDialog] = useState<{ open: boolean; editing: Task | null }>({
    open: false,
    editing: null,
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      getFilteredAndSortedTaskItems({
        taskItems,
        searchQuery: search,
        filters,
        currentUserId,
      }),
    [taskItems, search, filters, currentUserId],
  );

  const detail = detailId ? taskItems.find((t) => t.id === detailId) ?? null : null;

  return (
    <div className="space-y-4">
      <WorkFilterBar
        search={search}
        setSearch={setSearch}
        filters={filters}
        setFilters={setFilters}
        searchPlaceholder="Search tasks…"
        onCreate={() => setDialog({ open: true, editing: null })}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title={taskItems.length === 0 ? "No tasks yet" : "No matching tasks"}
          subtitle={
            taskItems.length === 0
              ? "Add a task — standalone or under a project."
              : "Try adjusting your search or filters."
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              parent={t.parentProjectId ? tasks.find((p) => p.id === t.parentProjectId) : undefined}
              members={members}
              onOpen={() => setDetailId(t.id)}
              onComplete={() => {
                const isComplete = getTaskItemProgress(t) >= 100;
                if (t.subtasks.length > 0) {
                  updateTaskItem({
                    ...t,
                    subtasks: t.subtasks.map((s) => ({ ...s, completed: !isComplete })),
                  });
                } else {
                  updateTaskItem({ ...t, progress: isComplete ? 0 : 100 });
                }
              }}
              onDelete={() => setPendingDeleteId(t.id)}
            />
          ))}
        </div>
      )}

      {dialog.open ? (
        <TaskDialog
          editing={dialog.editing}
          onClose={() => setDialog({ open: false, editing: null })}
        />
      ) : null}

      {detail ? (
        <TaskDetail
          task={detail}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDialog({ open: true, editing: detail });
            setDetailId(null);
          }}
        />
      ) : null}

      {pendingDeleteId !== null ? (
        <Dialog
          open
          onClose={() => setPendingDeleteId(null)}
          title="Delete task?"
          maxWidth="max-w-sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setPendingDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteTaskItem(pendingDeleteId);
                  setPendingDeleteId(null);
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-fg-mid">
            This permanently deletes the task and cannot be undone.
          </p>
        </Dialog>
      ) : null}
    </div>
  );
}
