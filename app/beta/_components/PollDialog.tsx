"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { POLL_OPTION_COLORS, Poll, PollOption } from "@/lib/beta/types";
import {
  CLOSING_PRESET_OPTIONS,
  ClosingPreset,
  computeClosesAtFromPreset,
} from "@/lib/beta/filters";
import { Dialog } from "./Dialog";
import { Button } from "./ui";
import {
  ColorPicker,
  DateField,
  Field,
  TextField,
  Toggle,
  inputBase,
} from "./fields";
import { newId } from "./util";

function toDateInput(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

// Mounted only while open, so state initializes once from props.
export function PollDialog({
  onClose,
  editing,
}: {
  onClose: () => void;
  editing?: Poll | null;
}) {
  const { currentUser, addPoll, updatePoll, deletePoll } = useApp();

  const [question, setQuestion] = useState(editing?.question ?? "");
  const [options, setOptions] = useState<PollOption[]>(
    editing
      ? editing.options.length
        ? editing.options
        : [{ id: "opt-a", text: "" }]
      : [
          { id: "opt-a", text: "" },
          { id: "opt-b", text: "" },
        ],
  );
  const [allowMultiple, setAllowMultiple] = useState(editing?.allowMultiple ?? false);
  const [color, setColor] = useState<string>(editing?.color ?? POLL_OPTION_COLORS[0]);
  const [preset, setPreset] = useState<ClosingPreset>(
    editing ? (editing.closesAt ? "custom" : "indefinite") : "1w",
  );
  const [customDate, setCustomDate] = useState(
    editing?.closesAt ? toDateInput(editing.closesAt) : "",
  );
  const [resetVotes, setResetVotes] = useState(false);

  const filledOptions = options.filter((o) => o.text.trim().length > 0);
  const canSave =
    question.trim().length > 0 && filledOptions.length >= 2 && !!currentUser;

  function setOptionText(id: string, text: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  }
  function addOption() {
    setOptions((prev) => [...prev, { id: newId("opt"), text: "" }]);
  }
  function removeOption(id: string) {
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((o) => o.id !== id)));
  }

  function handleSave() {
    if (!canSave || !currentUser) return;
    const cleanOptions = options
      .filter((o) => o.text.trim().length > 0)
      .map((o) => ({ id: o.id, text: o.text.trim() }));
    const closesAt = computeClosesAtFromPreset(preset, customDate);

    if (editing) {
      updatePoll({
        ...editing,
        question: question.trim(),
        options: cleanOptions,
        allowMultiple,
        color,
        closesAt,
        votes: resetVotes ? {} : editing.votes,
      });
    } else {
      const poll: Poll = {
        id: newId("poll"),
        question: question.trim(),
        options: cleanOptions,
        creatorId: currentUser.id,
        isOpen: true,
        closesAt,
        allowMultiple,
        votes: {},
        createdAt: Date.now(),
        color,
      };
      addPoll(poll);
    }
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? "Edit poll" : "New poll"}
      footer={
        <>
          {editing ? (
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                deletePoll(editing.id);
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
            {editing ? "Save changes" : "Create poll"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Question"
          value={question}
          onChange={setQuestion}
          placeholder="What should we name the robot?"
        />

        <Field label="Options" hint="At least two options.">
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={o.id} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: POLL_OPTION_COLORS[i % POLL_OPTION_COLORS.length] }}
                />
                <input
                  value={o.text}
                  onChange={(e) => setOptionText(o.id, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className={inputBase}
                />
                <button
                  type="button"
                  onClick={() => removeOption(o.id)}
                  disabled={options.length <= 2}
                  aria-label="Remove option"
                  className="text-fg-dim hover:text-danger disabled:opacity-30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button variant="secondary" onClick={addOption}>
              <Plus className="h-4 w-4" /> Add option
            </Button>
          </div>
        </Field>

        <Toggle
          label="Allow multiple answers"
          description="Voters can pick more than one option."
          checked={allowMultiple}
          onChange={setAllowMultiple}
        />

        <ColorPicker label="Accent color" value={color} onChange={setColor} options={POLL_OPTION_COLORS} />

        <Field label="Closes">
          <div className="flex flex-wrap gap-2">
            {CLOSING_PRESET_OPTIONS.map((p) => {
              const active = p.key === preset;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreset(p.key)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-signal bg-signal-dim text-signal"
                      : "border-edge text-fg-mid hover:text-fg"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </Field>
        {preset === "custom" ? (
          <DateField label="Close date" value={customDate} onChange={setCustomDate} />
        ) : null}

        {editing ? (
          <Toggle
            label="Reset votes"
            description="Clear all existing votes when saving."
            checked={resetVotes}
            onChange={setResetVotes}
          />
        ) : null}
      </div>
    </Dialog>
  );
}
