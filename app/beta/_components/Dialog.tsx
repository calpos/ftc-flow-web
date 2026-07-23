"use client";

import { ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Tailwind max-width class for the centered modal. */
  maxWidth?: string;
  /** Called when Ctrl/Cmd+Enter is pressed while the dialog is open. */
  onSubmit?: () => void;
}

function useAnimatedPresence(open: boolean, duration: number): { mounted: boolean; visible: boolean } {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (open) {
      let rAF2 = 0;
      const rAF1 = requestAnimationFrame(() => {
        setMounted(true);
        if (reduced) {
          setVisible(true);
          return;
        }
        rAF2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(rAF1);
        cancelAnimationFrame(rAF2);
      };
    } else {
      let timeoutId = 0;
      const rAF = requestAnimationFrame(() => {
        setVisible(false);
        if (reduced) {
          setMounted(false);
          return;
        }
        timeoutId = window.setTimeout(() => setMounted(false), duration + 20);
      });
      return () => {
        cancelAnimationFrame(rAF);
        clearTimeout(timeoutId);
      };
    }
  }, [open, duration]);

  return { mounted, visible };
}

function useFocusReturn(open: boolean) {
  const savedRef = useRef<Element | null>(null);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!prevOpenRef.current && open) {
      savedRef.current = document.activeElement;
    } else if (prevOpenRef.current && !open) {
      if (savedRef.current instanceof HTMLElement) {
        savedRef.current.focus();
      }
    }
    prevOpenRef.current = open;
  }, [open]);
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function usePanelInteraction(
  containerRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  onSubmit?: () => void,
) {
  const onCloseRef = useRef(onClose);
  const onSubmitRef = useRef(onSubmit);

  // Sync on every render without triggering the keydown effect
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
    onSubmitRef.current = onSubmit;
  });

  useEffect(() => {
    if (!open) return;

    const rAF = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.tabIndex >= 0);
      const firstField = focusable.find(
        (el) => el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT",
      );
      (firstField ?? focusable[0])?.focus();
    });

    function handleKeyDown(e: KeyboardEvent) {
      const container = containerRef.current;
      if (!container) return;

      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onSubmitRef.current?.();
        return;
      }

      if (e.key === "Tab") {
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => el.tabIndex >= 0);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        // Recapture focus if it escaped the container
        if (!container.contains(document.activeElement)) {
          e.preventDefault();
          if (e.shiftKey) {
            last.focus();
          } else {
            first.focus();
          }
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(rAF);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, containerRef]);
}

/** Centered modal dialog for create/edit forms. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-lg",
  onSubmit,
}: DialogProps) {
  const { mounted, visible } = useAnimatedPresence(open, 200);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusReturn(open);
  usePanelInteraction(panelRef, open, onClose, onSubmit);

  // Scroll lock is tied to mounted so it stays active during the exit animation
  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  if (!mounted) return null;

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
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 200ms ease-out",
        }}
      />
      <div
        ref={panelRef}
        className={`relative z-10 flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-edge bg-surface shadow-2xl`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(6px)",
          transition: "opacity 200ms ease-out, transform 200ms ease-out",
        }}
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
  /** Called when Ctrl/Cmd+Enter is pressed while the slide-over is open. */
  onSubmit?: () => void;
}

/** Right-anchored slide-over panel for detail views. */
export function SlideOver({
  open,
  onClose,
  title,
  children,
  footer,
  accent,
  onSubmit,
}: SlideOverProps) {
  const { mounted, visible } = useAnimatedPresence(open, 280);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusReturn(open);
  usePanelInteraction(panelRef, open, onClose, onSubmit);

  // Scroll lock is tied to mounted so it stays active during the exit animation
  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 280ms ease-out",
        }}
      />
      <div
        ref={panelRef}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-edge bg-surface shadow-2xl"
        style={{
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
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
