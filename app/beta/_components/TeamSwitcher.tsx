"use client";

import { useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useActiveTeam } from "@/lib/beta/ActiveTeamProvider";
import { useToastStore } from "@/lib/beta/store/toastStore";
import { friendlyError } from "@/lib/supabase/errors";
import { setActiveTeam } from "@/lib/teams/actions";
import { teamLabel } from "@/lib/teams/types";

/**
 * Header control for users who belong to more than one team. Picking a team
 * sets the active-team cookie on the server, then reloads /beta so every
 * server-resolved value follows. Renders nothing in local mode or with a
 * single team. A disclosure of plain buttons, not a listbox, so Tab reaches
 * the "create or join" link.
 */
export function TeamSwitcher() {
  const active = useActiveTeam();
  const pushToast = useToastStore((s) => s.push);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // The sidebar renders twice (desktop and mobile drawer), so ids can't be fixed.
  const panelId = useId();

  if (active.mode !== "remote" || active.memberships.length <= 1) return null;
  const activeTeamId = active.team.id;

  function close() {
    setOpen(false);
  }

  function select(teamId: string) {
    if (teamId === activeTeamId) {
      close();
      return;
    }
    startTransition(async () => {
      // The action can reject (network drop, deploy skew); with no error
      // boundary an uncaught rejection here would take the page down.
      try {
        const result = await setActiveTeam(teamId);
        if (result.ok) {
          window.location.assign("/beta");
        } else {
          pushToast(result.error);
        }
      } catch (error) {
        pushToast(friendlyError(error));
      }
    });
  }

  return (
    <div
      ref={rootRef}
      className="relative mt-2"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          e.stopPropagation();
          close();
          triggerRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        // Tabbing out of the popover closes it.
        if (open && !rootRef.current?.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      {open ? (
        // Not focusable: a button here would take focus on click, then
        // unmount and drop focus on <body>.
        <div
          aria-hidden
          className="fixed inset-0 z-10 cursor-default"
          onMouseDown={(e) => {
            e.preventDefault();
            close();
          }}
        />
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-2 rounded-xl border border-edge bg-raised px-3 py-2 text-left transition-colors hover:border-signal-dim"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
          {teamLabel(active.team)}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-fg-dim" />
      </button>

      {open ? (
        <div
          id={panelId}
          // Keeps focus where it is on mouse presses, so Safari (which doesn't
          // focus buttons on click) can't blur the root and close the panel
          // before a row's click fires. Clicks and navigation are unaffected.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-xl border border-edge bg-surface p-1 shadow-2xl"
        >
          {active.memberships.map(({ team, role }) => {
            const selected = team.id === activeTeamId;
            return (
              <button
                key={team.id}
                type="button"
                disabled={pending}
                aria-current={selected ? "true" : undefined}
                onClick={() => select(team.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors disabled:opacity-60 ${
                  selected ? "bg-signal-dim/50" : "hover:bg-raised"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{teamLabel(team)}</span>
                  <span className="block truncate text-xs capitalize text-fg-dim">{role}</span>
                </span>
                {selected ? <Check className="h-4 w-4 shrink-0 text-signal" /> : null}
              </button>
            );
          })}
          <Link
            href="/onboarding?step=team"
            className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-edge px-2.5 py-2 text-sm text-fg-mid transition-colors hover:bg-raised hover:text-fg"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Create or join another team
          </Link>
        </div>
      ) : null}
    </div>
  );
}
