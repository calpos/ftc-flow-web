"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { TASK_COLORS, Task, TaskSubtask } from "@/lib/beta/types";
import { Dialog } from "./Dialog";
import { Button } from "./ui";
import {
  ColorPicker,
  DateField,
  Field,
  MemberMultiSelect,
  RangeField,
  TextAreaField,
  TextField,
  Toggle,
  inputBase,
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
          You&apos;ll lose everything you&apos;ve entered on this task.
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

export function TaskDialog({
  onClose,
  editing,
  defaultParentId,
  open = true,
}: {
  onClose: () => void;
  editing?: Task | null;
  defaultParentId?: string;
  open?: boolean;
}) {
  const { currentUser, members, tasks, addTaskItem, updateTaskItem, deleteTaskItem } =
    useApp();

  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [color, setColor] = useState<string>(editing?.color ?? TASK_COLORS[7]);
  const [parentId, setParentId] = useState<string>(
    editing?.parentProjectId ?? defaultParentId ?? "",
  );
  const [customDate, setCustomDate] = useState(editing?.overrideFlag ?? false);
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? "");
  const [dueTime, setDueTime] = useState(editing?.dueTime ?? "");
  const [assigned, setAssigned] = useState<string[]>(
    editing?.assignedMembers ?? (currentUser ? [currentUser.id] : []),
  );
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>(editing?.subtasks ?? []);
  const [progress, setProgress] = useState(editing?.progress ?? 0);
  const [newSub, setNewSub] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [snapshot] = useState(() => ({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    color: editing?.color ?? TASK_COLORS[7],
    dueDate: editing?.dueDate ?? "",
    dueTime: editing?.dueTime ?? "",
    subtasksSer: JSON.stringify(editing?.subtasks ?? []),
    assignedSer: JSON.stringify(
      editing?.assignedMembers ?? (currentUser ? [currentUser.id] : []),
    ),
    parentId: editing?.parentProjectId ?? "",
    customDate: editing?.overrideFlag ?? false,
    progress: editing?.progress ?? 0,
  }));

  const isDirty = useMemo(
    () =>
      title !== snapshot.title ||
      description !== snapshot.description ||
      color !== snapshot.color ||
      dueDate !== snapshot.dueDate ||
      dueTime !== snapshot.dueTime ||
      newSub !== "" ||
      JSON.stringify(subtasks) !== snapshot.subtasksSer ||
      JSON.stringify(assigned) !== snapshot.assignedSer ||
      parentId !== snapshot.parentId ||
      customDate !== snapshot.customDate ||
      progress !== snapshot.progress,
    [title, description, color, dueDate, dueTime, newSub, subtasks, assigned, parentId, customDate, progress, snapshot],
  );

  function guardedClose() {
    if (!isDirty) {
      onClose();
    } else {
      setShowConfirm(true);
    }
  }

  const parent = tasks.find((p) => p.id === parentId) ?? null;

  const inheritsDate = !!parent && !customDate;
  const effectiveDueDate = inheritsDate ? parent!.dueDate : dueDate;
  const canSave = title.trim().length > 0 && !!currentUser;

  function toggleMember(id: string) {
    setAssigned((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  function addSub() {
    if (!newSub.trim()) return;
    setSubtasks((prev) => [...prev, { id: newId("st"), title: newSub.trim(), completed: false }]);
    setNewSub("");
  }
  function toggleSub(id: string) {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)),
    );
  }
  function removeSub(id: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSave() {
    if (!canSave || !currentUser) return;
    const base = {
      title: title.trim(),
      description: description.trim(),
      color,
      dueDate: effectiveDueDate,
      dueTime: dueTime || undefined,
      assignedMembers: assigned,
      editors: assigned,
      subtasks,
      parentProjectId: parentId || undefined,
      overrideFlag: !!parent && customDate,
      progress,
    };
    if (editing) {
      updateTaskItem({ ...editing, ...base });
    } else {
      addTaskItem({
        id: newId("ti"),
        ...base,
        createdBy: currentUser.id,
        createdAt: Date.now(),
      });
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
        title={editing ? "Edit task" : "New task"}
        footer={
          <>
            {editing ? (
              <Button
                variant="danger"
                className="mr-auto"
                onClick={() => {
                  deleteTaskItem(editing.id);
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
              {editing ? "Save changes" : "Create task"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Title" value={title} onChange={setTitle} placeholder="Wire up odometry pods" />
          <TextAreaField label="Description" value={description} onChange={setDescription} />

          <Field label="Parent project">
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={`${inputBase} [color-scheme:dark]`}
            >
              <option value="">Standalone task</option>
              {tasks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <ColorPicker label="Color" value={color} onChange={setColor} options={TASK_COLORS} />

          {parent ? (
            <Toggle
              label="Custom due date"
              description={
                customDate
                  ? "This task uses its own due date."
                  : `Inherits the project date${parent.dueDate ? ` (${parent.dueDate})` : ""}.`
              }
              checked={customDate}
              onChange={setCustomDate}
            />
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            {!parent || customDate ? (
              <DateField label="Due date" value={dueDate} onChange={setDueDate} />
            ) : (
              <Field label="Due date">
                <div className={`${inputBase} flex items-center text-fg-dim`}>
                  {parent.dueDate || "Inherited"}
                </div>
              </Field>
            )}
            <Field label="Due time (optional)">
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className={`${inputBase} [color-scheme:dark]`}
              />
            </Field>
          </div>

          {/* Subtasks */}
          <Field label="Subtasks">
            <div className="space-y-2">
              {subtasks.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-[10px] border border-edge bg-raised px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={s.completed}
                    onChange={() => toggleSub(s.id)}
                    className="h-4 w-4 accent-signal"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      s.completed ? "text-fg-dim line-through" : "text-fg"
                    }`}
                  >
                    {s.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSub(s.id)}
                    aria-label="Remove subtask"
                    className="text-fg-dim hover:text-danger"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSub();
                    }
                  }}
                  placeholder="Add a subtask…"
                  className={inputBase}
                />
                <Button variant="secondary" onClick={addSub} disabled={!newSub.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Field>

          {subtasks.length === 0 ? (
            <RangeField label="Progress" value={progress} onChange={setProgress} color={color} />
          ) : (
            <p className="rounded-[10px] border border-edge bg-raised/40 px-3.5 py-3 text-xs text-fg-dim">
              Progress is calculated from completed subtasks.
            </p>
          )}

          <MemberMultiSelect
            label="Assigned members"
            members={members}
            selected={assigned}
            onToggle={toggleMember}
          />
        </div>
      </Dialog>
    </>
  );
}
