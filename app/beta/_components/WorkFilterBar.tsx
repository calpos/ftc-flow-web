"use client";

import { useState } from "react";
import { ArrowDownUp, Plus, SlidersHorizontal } from "lucide-react";
import { PROGRESS_STAGES, ProgressStage } from "@/lib/beta/types";
import {
  INVOLVEMENT_KEYS,
  INVOLVEMENT_LABELS,
  InvolvementKey,
  SORT_LABELS,
  SortMethod,
  TaskFilters,
  createDefaultTaskFilters,
  hasActiveTaskFilters,
} from "@/lib/beta/filters";
import { getProgressLabelColor } from "@/lib/beta/types";
import { Button, IconButton, SearchInput } from "./ui";
import { DateField } from "./fields";

const SORT_METHODS: SortMethod[] = ["relevancy", "targetDate", "alphabetical", "progress"];

export function WorkFilterBar({
  search,
  setSearch,
  filters,
  setFilters,
  onCreate,
  searchPlaceholder,
}: {
  search: string;
  setSearch: (v: string) => void;
  filters: TaskFilters;
  setFilters: (f: TaskFilters) => void;
  onCreate: () => void;
  searchPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const active = hasActiveTaskFilters(filters);

  function toggleInvolvement(key: InvolvementKey) {
    const next = new Set(filters.involvement);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setFilters({ ...filters, involvement: next });
  }
  function toggleStage(stage: ProgressStage) {
    const next = new Set(filters.stages);
    if (next.has(stage)) next.delete(stage);
    else next.add(stage);
    setFilters({ ...filters, stages: next });
  }

  return (
    <div className="relative flex items-center gap-2">
      <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />

      {open ? (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <IconButton active={active} onClick={() => setOpen((o) => !o)} aria-label="Filters">
        <SlidersHorizontal className="h-[18px] w-[18px]" />
      </IconButton>

      <Button onClick={onCreate} className="shrink-0">
        <Plus className="h-4 w-4" /> New
      </Button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-2xl border border-edge bg-surface p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Filters & sorting</p>
            <button
              type="button"
              disabled={!active}
              onClick={() => setFilters(createDefaultTaskFilters())}
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
                setFilters({ ...filters, sortMethod: e.target.value as SortMethod })
              }
              className="h-9 flex-1 rounded-[10px] border border-edge bg-raised px-2 text-sm text-fg [color-scheme:dark] focus:border-signal focus:outline-none"
            >
              {SORT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {SORT_LABELS[m]}
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
              aria-label={`Sort ${filters.sortOrder === "asc" ? "ascending" : "descending"}`}
            >
              <ArrowDownUp className="h-4 w-4" />
            </IconButton>
          </div>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-dim">
            Involvement
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {INVOLVEMENT_KEYS.map((k) => {
              const on = filters.involvement.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleInvolvement(k)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    on
                      ? "border-signal bg-signal-dim text-signal"
                      : "border-edge text-fg-mid hover:text-fg"
                  }`}
                >
                  {INVOLVEMENT_LABELS[k]}
                </button>
              );
            })}
          </div>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-dim">
            Progress stage
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {PROGRESS_STAGES.map((s) => {
              const on = filters.stages.has(s);
              const color = getProgressLabelColor(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStage(s)}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    borderColor: on ? color : "var(--color-edge)",
                    color: on ? color : "var(--color-fg-mid)",
                    backgroundColor: on ? `${color}22` : "transparent",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-dim">
            Due date range
          </p>
          <div className="grid grid-cols-2 gap-2">
            <DateField
              label="After"
              value={filters.dueAfter}
              onChange={(v) => setFilters({ ...filters, dueAfter: v })}
            />
            <DateField
              label="Before"
              value={filters.dueBefore}
              onChange={(v) => setFilters({ ...filters, dueBefore: v })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
