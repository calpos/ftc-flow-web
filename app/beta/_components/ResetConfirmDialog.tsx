"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog } from "./Dialog";
import { Button } from "./ui";

interface ResetConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  counts: {
    taskItems: number;
    projects: number;
    events: number;
    polls: number;
  };
  isResetting: boolean;
}

function buildSummary(counts: ResetConfirmDialogProps["counts"]): string {
  const parts: string[] = [];
  if (counts.taskItems > 0)
    parts.push(`${counts.taskItems} ${counts.taskItems === 1 ? "task" : "tasks"}`);
  if (counts.projects > 0)
    parts.push(`${counts.projects} ${counts.projects === 1 ? "project" : "projects"}`);
  if (counts.events > 0)
    parts.push(`${counts.events} ${counts.events === 1 ? "event" : "events"}`);
  if (counts.polls > 0)
    parts.push(`${counts.polls} ${counts.polls === 1 ? "poll" : "polls"}`);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

export function ResetConfirmDialog({
  open,
  onClose,
  onConfirm,
  counts,
  isResetting,
}: ResetConfirmDialogProps) {
  const total = counts.taskItems + counts.projects + counts.events + counts.polls;
  const summary = buildSummary(counts);

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={isResetting} autoFocus>
        Cancel
      </Button>
      <Button variant="danger" onClick={onConfirm} disabled={isResetting}>
        {isResetting ? "Resetting..." : "Reset everything"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reset demo data"
      footer={footer}
      maxWidth="max-w-sm"
    >
      {total === 0 ? (
        <p className="text-sm text-fg-mid">
          There is nothing stored to erase. This will just reseed the demo defaults.
        </p>
      ) : (
        <p className="flex items-start gap-2 text-sm text-fg-mid">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <span>
            This will permanently erase <span className="text-fg">{summary}</span> stored on
            this device. The demo will reseed with default data on the next load.
          </span>
        </p>
      )}
    </Dialog>
  );
}
