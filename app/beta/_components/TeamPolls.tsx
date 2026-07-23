"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, BarChart3, Plus, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { Poll } from "@/lib/beta/types";
import {
  POLL_SORT_LABELS,
  PollActiveKey,
  PollFilters,
  PollSortMethod,
  createDefaultPollFilters,
  getFilteredAndSortedPolls,
  hasActivePollFilters,
} from "@/lib/beta/filters";
import { Button, EmptyState, IconButton, SearchInput } from "./ui";
import { PollCard } from "./PollCard";
import { PollDialog } from "./PollDialog";

const POLL_SORTS: PollSortMethod[] = ["datePosted", "closingDate", "alphabetical"];
const ACTIVE_KEYS: { key: PollActiveKey; label: string }[] = [
  { key: "active", label: "Open" },
  { key: "inactive", label: "Closed" },
];

export function TeamPolls() {
  const { polls, members, currentUser, currentUserId, votePoll } = useApp();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<PollFilters>(() => createDefaultPollFilters());
  const [filterOpen, setFilterOpen] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; editing: Poll | null }>({
    open: false,
    editing: null,
  });

  const active = hasActivePollFilters(filters);

  const filtered = useMemo(
    () => getFilteredAndSortedPolls({ polls, searchQuery: search, filters, currentUserId }),
    [polls, search, filters, currentUserId],
  );

  function creatorName(id: string) {
    const m = members.find((mm) => mm.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Unknown";
  }
  function canManage(poll: Poll) {
    return poll.creatorId === currentUserId || !!currentUser?.isCoach;
  }
  function toggleActive(key: PollActiveKey) {
    const next = new Set(filters.active);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setFilters({ ...filters, active: next });
  }

  return (
    <div className="space-y-4">
      <div className="relative flex items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search polls…" />
        {filterOpen ? (
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setFilterOpen(false)}
          />
        ) : null}
        <IconButton active={active} onClick={() => setFilterOpen((o) => !o)} aria-label="Filters">
          <SlidersHorizontal className="h-[18px] w-[18px]" />
        </IconButton>
        <Button onClick={() => setDialog({ open: true, editing: null })} className="shrink-0">
          <Plus className="h-4 w-4" /> New
        </Button>

        {filterOpen ? (
          <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-edge bg-surface p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Filters & sorting</p>
              <button
                type="button"
                disabled={!active}
                onClick={() => setFilters(createDefaultPollFilters())}
                className="text-xs font-medium text-danger disabled:opacity-30"
              >
                Reset
              </button>
            </div>

            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-dim">
              Sort by
            </p>
            <div className="mb-3 flex items-center gap-2">
              <select
                value={filters.sortMethod}
                onChange={(e) =>
                  setFilters({ ...filters, sortMethod: e.target.value as PollSortMethod })
                }
                className="h-9 flex-1 rounded-[10px] border border-edge bg-raised px-2 text-sm text-fg [color-scheme:dark] focus:border-signal focus:outline-none"
              >
                {POLL_SORTS.map((m) => (
                  <option key={m} value={m}>
                    {POLL_SORT_LABELS[m]}
                  </option>
                ))}
              </select>
              <IconButton
                className="h-9 w-9"
                onClick={() =>
                  setFilters({
                    ...filters,
                    sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
                  })
                }
                aria-label="Toggle sort order"
              >
                <ArrowDownUp className="h-4 w-4" />
              </IconButton>
            </div>

            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-dim">
              Status
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {ACTIVE_KEYS.map(({ key, label }) => {
                const on = filters.active.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleActive(key)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      on
                        ? "border-signal bg-signal-dim text-signal"
                        : "border-edge text-fg-mid hover:text-fg"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setFilters({ ...filters, unvotedOnly: !filters.unvotedOnly })}
              className={`w-full rounded-[10px] border px-3 py-2 text-left text-sm font-medium transition-colors ${
                filters.unvotedOnly
                  ? "border-signal bg-signal-dim/40 text-signal"
                  : "border-edge text-fg-mid hover:text-fg"
              }`}
            >
              Only polls I haven&apos;t voted on
            </button>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title={polls.length === 0 ? "No polls yet" : "No matching polls"}
          subtitle={
            polls.length === 0
              ? "Create a poll to gather decisions from your team."
              : "Try adjusting your search or filters."
          }
          action={
            polls.length === 0
              ? { label: "Create poll", onClick: () => setDialog({ open: true, editing: null }) }
              : {
                  label: "Clear filters",
                  onClick: () => {
                    setSearch("");
                    setFilters(createDefaultPollFilters());
                  },
                }
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              currentUserId={currentUserId}
              creatorName={creatorName(poll.creatorId)}
              canManage={canManage(poll)}
              onVote={(optId) => votePoll(poll.id, currentUserId, optId)}
              onManage={() => setDialog({ open: true, editing: poll })}
            />
          ))}
        </div>
      )}

      <PollDialog
        open={dialog.open}
        editing={dialog.editing}
        onClose={() => setDialog({ open: false, editing: null })}
      />
    </div>
  );
}
