"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Tailwind max-width class for the centered modal. */
  maxWidth?: string;
}

function useDismissable(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);
}

/** Centered modal dialog for create/edit forms. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-lg",
}: DialogProps) {
  useDismissable(open, onClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative z-10 flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-edge bg-surface shadow-2xl`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-edge px-5 py-4">
          <h2 className="text-lg font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-lg text-fg-mid transition-colors hover:bg-raised hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-edge px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Accent color bar shown at the top of the panel. */
  accent?: string;
}

/** Right-anchored slide-over panel for detail views. */
export function SlideOver({
  open,
  onClose,
  title,
  children,
  footer,
  accent,
}: SlideOverProps) {
  useDismissable(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-edge bg-surface shadow-2xl">
        {accent ? <div className="h-1 shrink-0" style={{ backgroundColor: accent }} /> : null}
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-edge px-5 py-4">
          <h2 className="truncate text-lg font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-fg-mid transition-colors hover:bg-raised hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-edge px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
