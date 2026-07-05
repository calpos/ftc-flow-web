"use client";

import { useState } from "react";
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

  if (!currentUser) return null;

  return (
    <div className="relative">
      {open ? (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
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
          role="listbox"
          className={`absolute left-0 right-0 z-20 max-h-72 overflow-y-auto rounded-xl border border-edge bg-surface p-1 shadow-2xl ${
            direction === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {members.map((m) => {
            const active = m.id === currentUserId;
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setUser(m.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  active ? "bg-signal-dim/50" : "hover:bg-raised"
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
                {active ? <Check className="h-4 w-4 shrink-0 text-signal" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
