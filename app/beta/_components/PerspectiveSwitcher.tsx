"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { Avatar } from "./ui";

/**
 * Simulates "who am I" without real auth — the app's Account perspective
 * switcher. Selecting a member re-scopes every "mine vs others" view.
 */
export function PerspectiveSwitcher({ direction = "up" }: { direction?: "up" | "down" }) {
  const { members, currentUser, currentUserId, setUser } = useApp();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(false);
  const closedByTabRef = useRef(false);

  useEffect(() => {
    if (open) {
      listboxRef.current?.focus();
    } else if (prevOpenRef.current) {
      if (closedByTabRef.current) {
        closedByTabRef.current = false;
      } else {
        triggerRef.current?.focus();
      }
    }
    prevOpenRef.current = open;
  }, [open]);

  if (!currentUser) return null;

  function openListbox() {
    const idx = members.findIndex((m) => m.id === currentUserId);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, members.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(members.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        setUser(members[activeIndex].id);
        close();
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        closedByTabRef.current = true;
        close();
        break;
    }
  }

  return (
    <div className="relative">
      {open ? (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          className="fixed inset-0 z-10 cursor-default"
          onClick={close}
        />
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : openListbox())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="perspective-listbox"
        className="flex w-full items-center gap-3 rounded-xl border border-edge bg-raised px-3 py-2.5 text-left transition-colors hover:border-signal-dim"
      >
        <Avatar member={currentUser} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-fg-dim">
            Viewing as
          </span>
          <span className="block truncate text-sm font-medium text-fg">
            {currentUser.firstName} {currentUser.lastName}
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-fg-dim" />
      </button>

      {open ? (
        <div
          ref={listboxRef}
          id="perspective-listbox"
          role="listbox"
          tabIndex={0}
          aria-activedescendant={
            members[activeIndex] ? `perspective-option-${members[activeIndex].id}` : undefined
          }
          onKeyDown={handleKeyDown}
          className={`absolute left-0 right-0 z-20 max-h-72 overflow-y-auto rounded-xl border border-edge bg-surface p-1 shadow-2xl focus:outline-none ${
            direction === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {members.map((m, i) => {
            const selected = m.id === currentUserId;
            const highlighted = i === activeIndex;
            return (
              <button
                key={m.id}
                id={`perspective-option-${m.id}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={selected}
                onClick={() => {
                  setUser(m.id);
                  close();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  selected
                    ? "bg-signal-dim/50"
                    : highlighted
                      ? "bg-raised"
                      : "hover:bg-raised"
                }`}
              >
                <Avatar member={m} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">
                    {m.firstName} {m.lastName}
                  </span>
                  <span className="block truncate text-xs text-fg-dim">
                    {m.isCoach ? "Coach" : m.teamRole}
                  </span>
                </span>
                {selected ? <Check className="h-4 w-4 shrink-0 text-signal" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
