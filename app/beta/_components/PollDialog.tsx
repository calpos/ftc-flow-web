"use client";

import { useEffect, useMemo, useState } from "react";
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
          You&apos;ll lose everything you&apos;ve entered on this poll.
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
  const [showConfirm, setShowConfirm] = useState(false);

  const [snapshot] = useState(() => ({
    question: editing?.question ?? "",
    optionsText: (editing?.options ?? [{ id: "opt-a", text: "" }, { id: "opt-b", text: "" }])
      .map((o) => o.text)
      .join("\0"),
    allowMultiple: editing?.allowMultiple ?? false,
    color: editing?.color ?? POLL_OPTION_COLORS[0],
    preset: (editing ? (editing.closesAt ? "custom" : "indefinite") : "1w") as ClosingPreset,
    customDate: editing?.closesAt ? toDateInput(editing.closesAt) : "",
    resetVotes: false,
  }));

  const isDirty = useMemo(() => {
    const effectiveCustomDate = preset === 'custom' ? customDate : '';
    const effectiveInitCustomDate = snapshot.preset === 'custom' ? snapshot.customDate : '';
    return (
      question !== snapshot.question ||
      options.map((o) => o.text).join("\0") !== snapshot.optionsText ||
      allowMultiple !== snapshot.allowMultiple ||
      color !== snapshot.color ||
      preset !== snapshot.preset ||
      effectiveCustomDate !== effectiveInitCustomDate ||
      resetVotes !== snapshot.resetVotes
    );
  }, [question, options, allowMultiple, color, preset, customDate, resetVotes, snapshot]);

  function guardedClose() {
    if (!isDirty) {
      onClose();
    } else {
      setShowConfirm(true);
    }
  }

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
    <>
      {showConfirm ? (
        <DiscardConfirm
          onKeep={() => setShowConfirm(false)}
          onDiscard={onClose}
        />
      ) : null}
      <Dialog
        open
        onClose={guardedClose}
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
          <Button variant="secondary" onClick={guardedClose}>
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
    </>
  );
}
