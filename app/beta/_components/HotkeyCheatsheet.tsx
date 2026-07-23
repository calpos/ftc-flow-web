"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.getAttribute("contenteditable") !== null) return true;
  return false;
}

function isModalOpen(): boolean {
  return !!document.querySelector('[aria-modal="true"]');
}

const KBD_CLS =
  "rounded-md bg-raised border border-edge px-1.5 py-0.5 font-mono text-xs text-fg-mid";

function KeySeq({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((k, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <span className="text-[10px] text-fg-dim">then</span>
          )}
          <kbd className={KBD_CLS}>{k}</kbd>
        </span>
      ))}
    </span>
  );
}

const SHORTCUTS: { keys: string[]; desc: string; group: string }[] = [
  { group: "Navigation", keys: ["g", "h"], desc: "Go to Home" },
  { group: "Navigation", keys: ["g", "t"], desc: "Go to Team" },
  { group: "Navigation", keys: ["g", "c"], desc: "Go to Calendar" },
  { group: "Navigation", keys: ["g", "a"], desc: "Go to Account" },
  { group: "General", keys: ["?"], desc: "Open this cheatsheet" },
];

export function HotkeyCheatsheet() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevFocusRef = useRef<Element | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function openModal() {
    prevFocusRef.current = document.activeElement;
    setOpen(true);
    requestAnimationFrame(() => {
      setVisible(true);
      closeButtonRef.current?.focus();
    });
  }

  function closeModal() {
    setVisible(false);
    setTimeout(() => {
      setOpen(false);
      if (prevFocusRef.current instanceof HTMLElement) {
        prevFocusRef.current.focus();
      }
    }, 150);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (open && e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }
      if (!open && e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isInputFocused() || isModalOpen()) return;
        e.preventDefault();
        openModal();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  const groups = Array.from(new Set(SHORTCUTS.map((s) => s.group)));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl border border-edge bg-surface shadow-2xl transition-all duration-150 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-4 border-b border-edge px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">Keyboard shortcuts</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeModal}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-fg-mid transition-colors hover:bg-raised hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Body */}
        <div className="px-5 py-4">
          {groups.map((group) => (
            <div key={group} className="mb-4 last:mb-0">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-dim">
                {group}
              </p>
              <div className="space-y-2">
                {SHORTCUTS.filter((s) => s.group === group).map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <KeySeq keys={s.keys} />
                    <span className="text-xs text-fg-mid">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
