"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import {
  Poll,
  Task,
  TeamEvent,
  TeamTask,
  formatDateDisplay,
  formatEventTimeRange,
  formatTime12h,
  getEventTypeColor,
  getEventTypeLabel,
} from "@/lib/beta/types";
import { DAY_HEADERS, MONTH_NAMES, getCalendarDays } from "@/lib/beta/filters";
import { Button, Card, EmptyState, IconButton, Pill, SegmentedTabs } from "../_components/ui";
import { SlideOver } from "../_components/Dialog";
import { EventDialog } from "../_components/EventDialog";
import { ProjectDialog } from "../_components/ProjectDialog";
import { TaskDialog } from "../_components/TaskDialog";
import { PollDialog } from "../_components/PollDialog";

type CalKind = "event" | "project" | "task" | "poll";

interface CalItem {
  kind: CalKind;
  id: string;
  title: string;
  color: string;
  label: string;
  date: string; // YYYY-MM-DD
  time?: string;
}

const KIND_LABELS: { key: CalKind; label: string }[] = [
  { key: "event", label: "Events" },
  { key: "project", label: "Projects" },
  { key: "task", label: "Tasks" },
  { key: "poll", label: "Polls" },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function dateKey(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}
function dateStrFromTs(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default function CalendarPage() {
  const { events, tasks, taskItems, polls } = useApp();
  const today = new Date();

  const [view, setView] = useState<"month" | "upcoming">("month");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [enabled, setEnabled] = useState<Set<CalKind>>(
    new Set<CalKind>(["event", "project", "task", "poll"]),
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // editor state
  const [eventDialog, setEventDialog] = useState<{ open: boolean; editing: TeamEvent | null }>({
    open: false,
    editing: null,
  });
  const [projectDialog, setProjectDialog] = useState<TeamTask | null>(null);
  const [taskDialog, setTaskDialog] = useState<Task | null>(null);
  const [pollDialog, setPollDialog] = useState<Poll | null>(null);

  const allItems = useMemo<CalItem[]>(() => {
    const items: CalItem[] = [];
    if (enabled.has("event")) {
      events.forEach((e) =>
        items.push({
          kind: "event",
          id: e.id,
          title: e.title,
          color: getEventTypeColor(e.type),
          label: getEventTypeLabel(e.type),
          date: e.date,
          time: formatEventTimeRange(e),
        }),
      );
    }
    if (enabled.has("project")) {
      tasks.forEach((p) => {
        if (!p.dueDate) return;
        items.push({
          kind: "project",
          id: p.id,
          title: p.name,
          color: p.color,
          label: "Project due",
          date: p.dueDate,
        });
      });
    }
    if (enabled.has("task")) {
      taskItems.forEach((t) => {
        if (!t.dueDate) return;
        items.push({
          kind: "task",
          id: t.id,
          title: t.title,
          color: t.color,
          label: "Task due",
          date: t.dueDate,
          time: t.dueTime ? formatTime12h(t.dueTime) : undefined,
        });
      });
    }
    if (enabled.has("poll")) {
      polls.forEach((p) => {
        if (!p.closesAt) return;
        items.push({
          kind: "poll",
          id: p.id,
          title: p.question,
          color: "#AF52DE",
          label: "Poll closes",
          date: dateStrFromTs(p.closesAt),
          time: formatTime12h(
            `${pad2(new Date(p.closesAt).getHours())}:${pad2(new Date(p.closesAt).getMinutes())}`,
          ),
        });
      });
    }
    return items;
  }, [events, tasks, taskItems, polls, enabled]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, CalItem[]> = {};
    allItems.forEach((it) => {
      (map[it.date] ??= []).push(it);
    });
    return map;
  }, [allItems]);

  const upcoming = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return allItems
      .filter((it) => new Date(`${it.date}T00:00:00`).getTime() >= start.getTime())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allItems]);

  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  function toggleKind(k: CalKind) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }
  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  function openItem(it: CalItem) {
    if (it.kind === "event") {
      const e = events.find((x) => x.id === it.id) ?? null;
      setEventDialog({ open: true, editing: e });
    } else if (it.kind === "project") {
      setProjectDialog(tasks.find((x) => x.id === it.id) ?? null);
    } else if (it.kind === "task") {
      setTaskDialog(taskItems.find((x) => x.id === it.id) ?? null);
    } else {
      setPollDialog(polls.find((x) => x.id === it.id) ?? null);
    }
    setSelectedDay(null);
  }

  const dayItems = selectedDay ? itemsByDate[selectedDay] ?? [] : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-fg-mid">Events, due dates, and poll closings.</p>
        </div>
        <Button onClick={() => setEventDialog({ open: true, editing: null })}>
          <Plus className="h-4 w-4" /> New event
        </Button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs
          options={[
            { label: "Month", value: "month" },
            { label: "Upcoming", value: "upcoming" },
          ]}
          value={view}
          onChange={setView}
        />
        <div className="flex flex-wrap gap-1.5">
          {KIND_LABELS.map(({ key, label }) => {
            const on = enabled.has(key);
            const color =
              key === "poll"
                ? "#AF52DE"
                : key === "event"
                  ? "#2D8CFF"
                  : key === "project"
                    ? "#FF9500"
                    : "#34C759";
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleKind(key)}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  borderColor: on ? color : "var(--color-edge)",
                  color: on ? color : "var(--color-fg-dim)",
                  backgroundColor: on ? `${color}1a` : "transparent",
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {view === "month" ? (
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">
              {MONTH_NAMES[month]} {year}
            </h2>
            <div className="flex gap-2">
              <IconButton className="h-9 w-9" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </IconButton>
              <IconButton className="h-9 w-9" onClick={nextMonth} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </IconButton>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="py-1 text-center text-xs font-medium text-fg-dim">
                {d}
              </div>
            ))}
            {days.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} />;
              const key = dateKey(year, month, day);
              const items = itemsByDate[key] ?? [];
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => items.length && setSelectedDay(key)}
                  className={`flex min-h-[68px] flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                    items.length ? "hover:border-signal-dim" : "cursor-default"
                  } ${isToday ? "border-signal/60 bg-signal-dim/20" : "border-edge"}`}
                >
                  <span
                    className={`text-xs ${isToday ? "font-semibold text-signal" : "text-fg-mid"}`}
                  >
                    {day}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {items.slice(0, 4).map((it, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: it.color }}
                      />
                    ))}
                    {items.length > 4 ? (
                      <span className="text-[9px] leading-none text-fg-dim">
                        +{items.length - 4}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {enabled.size === 0 ? (
            <EmptyState
              title="All categories hidden"
              subtitle="Toggle a category above to show upcoming items."
              action={{
                label: "Show all",
                onClick: () =>
                  setEnabled(new Set<CalKind>(["event", "project", "task", "poll"])),
              }}
            />
          ) : upcoming.length === 0 ? (
            <EmptyState
              title="Nothing upcoming"
              subtitle="No events, due dates, or poll closings scheduled from today onward."
              action={{
                label: "Add event",
                onClick: () => setEventDialog({ open: true, editing: null }),
              }}
            />
          ) : (
            upcoming.map((it) => (
              <button
                key={`${it.kind}-${it.id}`}
                type="button"
                onClick={() => openItem(it)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-edge bg-surface px-4 py-3 text-left transition-colors hover:border-signal-dim"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-8 w-1 rounded-full" style={{ backgroundColor: it.color }} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg">{it.title}</p>
                    <Pill label={it.label} color={it.color} className="mt-1" />
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs">
                  <p className="font-medium text-fg-mid">{formatDateDisplay(it.date)}</p>
                  {it.time ? <p className="text-fg-dim">{it.time}</p> : null}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Day panel */}
      {selectedDay ? (
        <SlideOver
          open
          onClose={() => setSelectedDay(null)}
          title={formatDateDisplay(selectedDay)}
        >
          <div className="space-y-2">
            {dayItems.length === 0 ? (
              <EmptyState
                title="No items visible"
                subtitle="All categories for this day are hidden. Toggle a category above to see them."
                action={{
                  label: "Show all",
                  onClick: () => {
                    setEnabled(new Set<CalKind>(["event", "project", "task", "poll"]));
                    setSelectedDay(null);
                  },
                }}
              />
            ) : (
              dayItems.map((it) => (
                <button
                  key={`${it.kind}-${it.id}`}
                  type="button"
                  onClick={() => openItem(it)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-edge bg-raised px-3.5 py-3 text-left transition-colors hover:border-signal-dim"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-8 w-1 rounded-full" style={{ backgroundColor: it.color }} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fg">{it.title}</p>
                      <Pill label={it.label} color={it.color} className="mt-1" />
                    </div>
                  </div>
                  {it.time ? (
                    <span className="shrink-0 text-xs text-fg-dim">{it.time}</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </SlideOver>
      ) : null}

      {eventDialog.open ? (
        <EventDialog
          editing={eventDialog.editing}
          defaultDate={selectedDay ?? undefined}
          onClose={() => setEventDialog({ open: false, editing: null })}
        />
      ) : null}
      {projectDialog ? (
        <ProjectDialog editing={projectDialog} onClose={() => setProjectDialog(null)} />
      ) : null}
      {taskDialog ? (
        <TaskDialog editing={taskDialog} onClose={() => setTaskDialog(null)} />
      ) : null}
      {pollDialog ? (
        <PollDialog editing={pollDialog} onClose={() => setPollDialog(null)} />
      ) : null}
    </div>
  );
}
