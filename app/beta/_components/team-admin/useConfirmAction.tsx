"use client";

import { ReactNode, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { remoteErrorMessage } from "@/lib/beta/remote/context";
import { useToastStore } from "@/lib/beta/store/toastStore";
import { Dialog } from "../Dialog";
import { Button } from "../ui";

export type ConfirmRequest = {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  tone?: "danger" | "primary";
  run: () => Promise<void>;
  successToast?: string;
  /** Stay pending after success, for a run that navigates away. */
  keepPendingOnSuccess?: boolean;
};

/** One confirm dialog per caller: ask() opens it, `dialog` must be rendered. */
export function useConfirmAction(): {
  ask(req: ConfirmRequest): void;
  open: boolean;
  dialog: ReactNode;
} {
  // Kept after closing so the content doesn't blank during the exit transition.
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function ask(req: ConfirmRequest) {
    setRequest(req);
    setError(null);
    setPending(false);
    setOpen(true);
  }

  function close() {
    if (pending) return;
    setOpen(false);
  }

  async function confirm() {
    if (!request || pending) return;
    setError(null);
    setPending(true);
    try {
      await request.run();
    } catch (e) {
      setError(remoteErrorMessage(e));
      setPending(false);
      return;
    }
    if (request.successToast) useToastStore.getState().push(request.successToast);
    if (request.keepPendingOnSuccess) return;
    setPending(false);
    setOpen(false);
  }

  const dialog = request ? (
    <Dialog
      open={open}
      onClose={close}
      title={request.title}
      maxWidth="max-w-sm"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending} autoFocus>
            Cancel
          </Button>
          <Button
            variant={request.tone ?? "danger"}
            onClick={confirm}
            disabled={pending}
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? request.pendingLabel : request.confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-fg-mid">{request.body}</div>
      {error ? (
        <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </Dialog>
  ) : null;

  return { ask, open, dialog };
}
