"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
import { useDetailParam } from "./useDetailParam";

function TeamProjectsContent({ onStaleCleared }: { onStaleCleared?: () => void }) {
  const { tasks, taskItems, members, currentUserId } = useApp();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TaskFilters>(() => createDefaultTaskFilters());

  const [projectDialog, setProjectDialog] = useState<{ open: boolean; editing: TeamTask | null }>({
    open: false,
    editing: null,
  });
  const [taskDialog, setTaskDialog] = useState<{
    open: boolean;
    editing: Task | null;
    parentId?: string;
  }>({ open: false, editing: null });

  const param = useDetailParam("project");
  const detail = tasks.find((p) => p.id === param.value) ?? null;
  const { value: paramValue, close: paramClose } = param;

  useEffect(() => {
    if (paramValue && !detail) {
      paramClose();
      onStaleCleared?.();
    }
  }, [paramValue, detail, paramClose, onStaleCleared]);

  const filtered = useMemo(
    () => getFilteredAndSortedTasks({ tasks, searchQuery: search, filters, currentUserId }),
    [tasks, search, filters, currentUserId],
  );

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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              taskItems={taskItems}
              members={members}
              onOpen={() => param.open(p.id)}
            />
          ))}
        </div>
      )}

      <ProjectDialog
        open={projectDialog.open}
        editing={projectDialog.editing}
        onClose={() => setProjectDialog({ open: false, editing: null })}
      />

      {detail ? (
        <ProjectDetail
          project={detail}
          onClose={() => param.close()}
          onEdit={() => {
            setProjectDialog({ open: true, editing: detail });
            param.close();
          }}
          onAddTask={() => setTaskDialog({ open: true, editing: null, parentId: detail.id })}
          onOpenTask={(taskId) => {
            const t = taskItems.find((x) => x.id === taskId) ?? null;
            setTaskDialog({ open: true, editing: t });
          }}
        />
      ) : null}

      <TaskDialog
        open={taskDialog.open}
        editing={taskDialog.editing}
        defaultParentId={taskDialog.parentId}
        onClose={() => setTaskDialog({ open: false, editing: null })}
      />
    </div>
  );
}

export function TeamProjects({ onStaleCleared }: { onStaleCleared?: () => void }) {
  return (
    <Suspense fallback={null}>
      <TeamProjectsContent onStaleCleared={onStaleCleared} />
    </Suspense>
  );
}
