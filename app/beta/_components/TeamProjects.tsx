"use client";

import { useMemo, useState } from "react";
import { Folder } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { Task, TeamTask } from "@/lib/beta/types";
import {
  TaskFilters,
  createDefaultTaskFilters,
  getFilteredAndSortedTasks,
} from "@/lib/beta/filters";
import { EmptyState } from "./ui";
import { WorkFilterBar } from "./WorkFilterBar";
import { ProjectCard } from "./cards";
import { ProjectDetail } from "./details";
import { ProjectDialog } from "./ProjectDialog";
import { TaskDialog } from "./TaskDialog";

export function TeamProjects() {
  const { tasks, taskItems, members, currentUserId } = useApp();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TaskFilters>(() => createDefaultTaskFilters());

  const [projectDialog, setProjectDialog] = useState<{ open: boolean; editing: TeamTask | null }>({
    open: false,
    editing: null,
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [taskDialog, setTaskDialog] = useState<{
    open: boolean;
    editing: Task | null;
    parentId?: string;
  }>({ open: false, editing: null });

  const filtered = useMemo(
    () => getFilteredAndSortedTasks({ tasks, searchQuery: search, filters, currentUserId }),
    [tasks, search, filters, currentUserId],
  );

  const detail = detailId ? tasks.find((p) => p.id === detailId) ?? null : null;

  return (
    <div className="space-y-4">
      <WorkFilterBar
        search={search}
        setSearch={setSearch}
        filters={filters}
        setFilters={setFilters}
        searchPlaceholder="Search projects…"
        onCreate={() => setProjectDialog({ open: true, editing: null })}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Folder className="h-6 w-6" />}
          title={tasks.length === 0 ? "No projects yet" : "No matching projects"}
          subtitle={
            tasks.length === 0
              ? "Create your first team project to get started."
              : "Try adjusting your search or filters."
          }
          action={
            tasks.length === 0
              ? {
                  label: "Create project",
                  onClick: () => setProjectDialog({ open: true, editing: null }),
                }
              : {
                  label: "Clear filters",
                  onClick: () => {
                    setSearch("");
                    setFilters(createDefaultTaskFilters());
                  },
                }
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              taskItems={taskItems}
              members={members}
              onOpen={() => setDetailId(p.id)}
            />
          ))}
        </div>
      )}

      {projectDialog.open ? (
        <ProjectDialog
          editing={projectDialog.editing}
          onClose={() => setProjectDialog({ open: false, editing: null })}
        />
      ) : null}

      {detail ? (
        <ProjectDetail
          project={detail}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setProjectDialog({ open: true, editing: detail });
            setDetailId(null);
          }}
          onAddTask={() => setTaskDialog({ open: true, editing: null, parentId: detail.id })}
          onOpenTask={(taskId) => {
            const t = taskItems.find((x) => x.id === taskId) ?? null;
            setTaskDialog({ open: true, editing: t });
          }}
        />
      ) : null}

      {taskDialog.open ? (
        <TaskDialog
          editing={taskDialog.editing}
          defaultParentId={taskDialog.parentId}
          onClose={() => setTaskDialog({ open: false, editing: null })}
        />
      ) : null}
    </div>
  );
}
