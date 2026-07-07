"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { TASK_COLORS, TeamTask } from "@/lib/beta/types";
import { Dialog } from "./Dialog";
import { Button } from "./ui";
import {
  ColorPicker,
  DateField,
  MemberMultiSelect,
  RangeField,
  TextAreaField,
  TextField,
} from "./fields";
import { newId } from "./util";

function DiscardConfirm({
  onKeep,
  onDiscard,
}: {
  onKeep: () => void;
  onDiscard: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onKeep();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [onKeep]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="discard-title"
      aria-describedby="discard-desc"
    >
      <div
        className="absolute inset-0 bg-ink/50"
        onClick={onKeep}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-edge bg-surface p-6 shadow-2xl">
        <p id="discard-title" className="text-base font-semibold text-fg">
          Discard changes?
        </p>
        <p id="discard-desc" className="mt-2 text-sm text-fg-mid">
          You&apos;ll lose everything you&apos;ve entered on this project.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" autoFocus onClick={onKeep}>
            Keep editing
          </Button>
          <Button variant="danger" onClick={onDiscard}>
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProjectDialog({
  onClose,
  editing,
  open = true,
}: {
  onClose: () => void;
  editing?: TeamTask | null;
  open?: boolean;
}) {
  const { currentUser, members, taskItems, addTask, updateProjectWithCascade, deleteTask } =
    useApp();

  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [color, setColor] = useState<string>(editing?.color ?? TASK_COLORS[7]);
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? "");
  const [assigned, setAssigned] = useState<string[]>(
    editing?.assignedMembers ?? (currentUser ? [currentUser.id] : []),
  );
  const [progress, setProgress] = useState(editing?.progress ?? 0);
  const [showConfirm, setShowConfirm] = useState(false);

  const [snapshot] = useState(() => ({
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    color: editing?.color ?? TASK_COLORS[7],
    dueDate: editing?.dueDate ?? "",
    progress: editing?.progress ?? 0,
    assignedSer: JSON.stringify(
      editing?.assignedMembers ?? (currentUser ? [currentUser.id] : []),
    ),
  }));

  const isDirty = useMemo(
    () =>
      name !== snapshot.name ||
      description !== snapshot.description ||
      color !== snapshot.color ||
      dueDate !== snapshot.dueDate ||
      progress !== snapshot.progress ||
      JSON.stringify(assigned) !== snapshot.assignedSer,
    [name, description, color, dueDate, progress, assigned, snapshot],
  );

  function guardedClose() {
    if (!isDirty) {
      onClose();
    } else {
      setShowConfirm(true);
    }
  }

  const childCount = editing
    ? taskItems.filter((t) => t.parentProjectId === editing.id).length
    : 0;

  const canSave = name.trim().length > 0 && !!currentUser;

  function toggle(id: string) {
    setAssigned((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleSave() {
    if (!canSave || !currentUser) return;
    if (editing) {
      updateProjectWithCascade({
        ...editing,
        name: name.trim(),
        description: description.trim(),
        color,
        dueDate,
        assignedMembers: assigned,
        editors: assigned,
        progress,
      });
    } else {
      const project: TeamTask = {
        id: newId("pr"),
        name: name.trim(),
        description: description.trim(),
        color,
        dueDate,
        assignedMembers: assigned,
        editors: assigned,
        createdBy: currentUser.id,
        subtasks: [],
        progress,
      };
      addTask(project);
    }
    onClose();
  }

  return (
    <>
      {showConfirm ? (
        <DiscardConfirm
          onKeep={() => setShowConfirm(false)}
          onDiscard={onClose}
        />
      ) : null}
      <Dialog
        open={open}
        onClose={guardedClose}
        onSubmit={handleSave}
        title={editing ? "Edit project" : "New project"}
        footer={
          <>
            {editing ? (
              <Button
                variant="danger"
                className="mr-auto"
                onClick={() => {
                  deleteTask(editing.id);
                  onClose();
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            ) : null}
            <Button variant="secondary" onClick={guardedClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {editing ? "Save changes" : "Create project"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Name" value={name} onChange={setName} placeholder="Drivetrain redesign" />
          <TextAreaField
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="What is this project about?"
          />
          <ColorPicker label="Color" value={color} onChange={setColor} options={TASK_COLORS} />
          <DateField
            label="Target date"
            value={dueDate}
            onChange={setDueDate}
            hint="Tasks under this project inherit this date unless they set their own."
          />
          {childCount === 0 ? (
            <RangeField label="Progress" value={progress} onChange={setProgress} color={color} />
          ) : (
            <p className="rounded-[10px] border border-edge bg-raised/40 px-3.5 py-3 text-xs text-fg-dim">
              Progress is calculated from this project&apos;s {childCount} task
              {childCount === 1 ? "" : "s"}.
            </p>
          )}
          <MemberMultiSelect
            label="Assigned members"
            members={members}
            selected={assigned}
            onToggle={toggle}
          />
        </div>
      </Dialog>
    </>
  );
}
