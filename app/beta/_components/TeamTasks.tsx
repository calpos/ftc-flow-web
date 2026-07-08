"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { Task } from "@/lib/beta/types";
import { TaskFilters, createDefaultTaskFilters } from "@/lib/beta/filters";
import { getFilteredAndSortedTaskItems } from "./taskItemFilters";
import { EmptyState } from "./ui";
import { WorkFilterBar } from "./WorkFilterBar";
import { TaskCard } from "./cards";
import { TaskDetail } from "./details";
import { TaskDialog } from "./TaskDialog";
import { useDetailParam } from "./useDetailParam";

function TeamTasksContent() {
  const { tasks, taskItems, members, currentUserId } = useApp();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TaskFilters>(() => createDefaultTaskFilters());

  const [dialog, setDialog] = useState<{ open: boolean; editing: Task | null }>({
    open: false,
    editing: null,
  });

  const param = useDetailParam("task");
  const detail = taskItems.find((t) => t.id === param.value) ?? null;
  const { value: paramValue, close: paramClose } = param;

  useEffect(() => {
    if (paramValue && !detail) paramClose();
  }, [paramValue, detail, paramClose]);

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
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              parent={t.parentProjectId ? tasks.find((p) => p.id === t.parentProjectId) : undefined}
              members={members}
              onOpen={() => param.open(t.id)}
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
          onClose={() => param.close()}
          onEdit={() => {
            setDialog({ open: true, editing: detail });
            param.close();
          }}
        />
      ) : null}
    </div>
  );
}

export function TeamTasks() {
  return (
    <Suspense fallback={null}>
      <TeamTasksContent />
    </Suspense>
  );
}
