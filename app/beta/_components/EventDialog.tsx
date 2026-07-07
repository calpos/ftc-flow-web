"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { EVENT_TYPE_INFO, EventType, TeamEvent } from "@/lib/beta/types";
import { Dialog } from "./Dialog";
import { Button } from "./ui";
import { DateField, Field, TextAreaField, TextField, TimeField } from "./fields";
import { newId } from "./util";

export function EventDialog({
  onClose,
  editing,
  defaultDate,
  open = true,
}: {
  onClose: () => void;
  editing?: TeamEvent | null;
  defaultDate?: string;
  open?: boolean;
}) {
  const { currentUser, addEvent, updateEvent, deleteEvent } = useApp();

  const [title, setTitle] = useState(editing?.title ?? "");
  const [type, setType] = useState<EventType>(editing?.type ?? "meeting");
  const [date, setDate] = useState(editing?.date ?? defaultDate ?? "");
  const [startTime, setStartTime] = useState(editing?.startTime || "16:00");
  const [endTime, setEndTime] = useState(editing?.endTime ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");

  const canSave = title.trim().length > 0 && date.length > 0 && !!currentUser;

  function handleSave() {
    if (!canSave || !currentUser) return;
    if (editing) {
      updateEvent({
        ...editing,
        title: title.trim(),
        type,
        date,
        startTime,
        endTime: endTime || undefined,
        description: description.trim() || undefined,
      });
    } else {
      const event: TeamEvent = {
        id: newId("event"),
        title: title.trim(),
        type,
        date,
        startTime,
        endTime: endTime || undefined,
        description: description.trim() || undefined,
        createdBy: currentUser.id,
        createdAt: Date.now(),
      };
      addEvent(event);
    }
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onSubmit={handleSave}
      title={editing ? "Edit event" : "New event"}
      footer={
        <>
          {editing ? (
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                deleteEvent(editing.id);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {editing ? "Save changes" : "Create event"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField label="Title" value={title} onChange={setTitle} placeholder="Weekly team meeting" />
        <Field label="Type">
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPE_INFO.map((t) => {
              const active = t.type === type;
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setType(t.type)}
                  className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: active ? `${t.color}26` : "transparent",
                    color: active ? t.color : "var(--color-fg-mid)",
                    border: `1px solid ${active ? t.color : "var(--color-edge)"}`,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </Field>
        <DateField label="Date" value={date} onChange={setDate} />
        <div className="grid grid-cols-2 gap-4">
          <TimeField label="Start time" value={startTime} onChange={setStartTime} />
          <TimeField label="End time (optional)" value={endTime} onChange={setEndTime} />
        </div>
        <TextAreaField
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="What's happening?"
        />
      </div>
    </Dialog>
  );
}
