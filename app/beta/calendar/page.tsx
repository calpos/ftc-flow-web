"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import { getEventStatus } from "../_components/util";
import { Button, Card, EmptyState, IconButton, Pill, SegmentedTabs } from "../_components/ui";
import { SlideOver } from "../_components/Dialog";
import { EventDialog } from "../_components/EventDialog";
import { ProjectDialog } from "../_components/ProjectDialog";
import { TaskDialog } from "../_components/TaskDialog";
import { PollDialog } from "../_components/PollDialog";
import { useDetailParam } from "../_components/useDetailParam";

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

function useNow(intervalMs = 60000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

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

const ITEM_PARAM_KEYS = ["event", "project", "task", "poll"] as const;

function CalendarContent() {
  const { events, tasks, taskItems, polls } = useApp();
  const today = new Date();
  const now = useNow();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [view, setView] = useState<"month" | "upcoming">("month");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [enabled, setEnabled] = useState<Set<CalKind>>(
    new Set<CalKind>(["event", "project", "task", "poll"]),
  );
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [createDay, setCreateDay] = useState<string | null>(null);

  const eventParam = useDetailParam("event");
  const projectParam = useDetailParam("project");
  const taskParam = useDetailParam("task");
  const pollParam = useDetailParam("poll");
  const dayParam = useDetailParam("day");

  const editingEvent = events.find((e) => e.id === eventParam.value) ?? null;
  const editingProject = tasks.find((p) => p.id === projectParam.value) ?? null;
  const editingTask = taskItems.find((t) => t.id === taskParam.value) ?? null;
  const editingPoll = polls.find((p) => p.id === pollParam.value) ?? null;
  const selectedDay = dayParam.value;

  const { value: eventValue, close: eventClose } = eventParam;
  const { value: projectValue, close: projectClose } = projectParam;
  const { value: taskValue, close: taskClose } = taskParam;
  const { value: pollValue, close: pollClose } = pollParam;

  useEffect(() => {
    if (eventValue && !editingEvent) eventClose();
  }, [eventValue, editingEvent, eventClose]);
  useEffect(() => {
    if (projectValue && !editingProject) projectClose();
  }, [projectValue, editingProject, projectClose]);
  useEffect(() => {
    if (taskValue && !editingTask) taskClose();
  }, [taskValue, editingTask, taskClose]);
  useEffect(() => {
    if (pollValue && !editingPoll) pollClose();
  }, [pollValue, editingPoll, pollClose]);

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

  const upcomingAll = useMemo(() => {
    const items: CalItem[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const startTs = start.getTime();
    events.forEach((e) => {
      items.push({ kind: "event", id: e.id, title: e.title, color: getEventTypeColor(e.type), label: getEventTypeLabel(e.type), date: e.date, time: formatEventTimeRange(e) });
    });
    tasks.forEach((p) => { if (!p.dueDate) return; items.push({ kind: "project", id: p.id, title: p.name, color: p.color, label: "Project due", date: p.dueDate }); });
    taskItems.forEach((t) => { if (!t.dueDate) return; items.push({ kind: "task", id: t.id, title: t.title, color: t.color, label: "Task due", date: t.dueDate, time: t.dueTime ? formatTime12h(t.dueTime) : undefined }); });
    polls.forEach((p) => { if (!p.closesAt) return; items.push({ kind: "poll", id: p.id, title: p.question, color: "#AF52DE", label: "Poll closes", date: dateStrFromTs(p.closesAt), time: formatTime12h(`${pad2(new Date(p.closesAt).getHours())}:${pad2(new Date(p.closesAt).getMinutes())}`) }); });
    return items.filter((it) => new Date(`${it.date}T00:00:00`).getTime() >= startTs);
  }, [events, tasks, taskItems, polls]);

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
    const params = new URLSearchParams(searchParams.toString());
    ITEM_PARAM_KEYS.forEach((k) => params.delete(k));
    params.set(it.kind, it.id);
    router.push(`${pathname}?${params.toString()}`);
  }

  // Improvement 4: keyboard month navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (view !== "month" || selectedDay !== null) return;
      const el = document.activeElement;
      if (!el) return;
      const tag = (el as Element).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (el.closest('[role="dialog"]')) return;
      if (e.key === "ArrowLeft") {
        if (month === 0) { setMonth(11); setYear((y) => y - 1); }
        else setMonth((m) => m - 1);
      } else if (e.key === "ArrowRight") {
        if (month === 11) { setMonth(0); setYear((y) => y + 1); }
        else setMonth((m) => m + 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, selectedDay, month]);

  const dayItems = selectedDay ? itemsByDate[selectedDay] ?? [] : [];

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-fg-mid">Events, due dates, and poll closings.</p>
        </div>
        <Button onClick={() => setNewEventOpen(true)}>
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
            {/* Improvement 3: Today button + prev/next */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="h-9 px-3 text-sm"
                disabled={isCurrentMonth}
                onClick={() => {
                  setYear(today.getFullYear());
                  setMonth(today.getMonth());
                }}
              >
                Today
              </Button>
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
              const isPastDay = !isToday && new Date(key + 'T00:00:00') < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                // Improvement 1 & 2: overlay pattern lets chip <button>s coexist without nesting
                <div
                  key={key}
                  className={`group relative flex min-h-[68px] flex-col rounded-lg border transition-colors lg:min-h-[96px] ${
                    isToday ? "border-signal/60 bg-signal-dim/20" : "border-edge"
                  } ${items.length > 0 ? "hover:border-signal-dim" : "hover:border-signal-dim/40"} ${isPastDay ? "opacity-40" : ""}`}
                >
                  {/* Full-cell click target sits behind the content layer */}
                  <button
                    type="button"
                    aria-label={`${isToday ? "Today, " : ""}${MONTH_NAMES[month]} ${day}`}
                    onClick={() => {
                      if (items.length > 0) dayParam.open(key);
                      else setCreateDay(key);
                    }}
                    className="absolute inset-0 z-0 rounded-lg"
                  />
                  {/* Content layer sits above the overlay; chips re-enable pointer events */}
                  <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-1 p-1.5">
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-xs ${isToday ? "font-semibold text-signal" : "text-fg-mid"}`}
                      >
                        {day}
                      </span>
                      {/* Improvement 2: plus affordance on empty days */}
                      {items.length === 0 && (
                        <Plus className="h-3 w-3 text-fg-dim opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </div>

                    {/* Small screens: dots (live events get a ping) */}
                    <div className="flex flex-wrap gap-1 lg:hidden">
                      {items.slice(0, 4).map((it) => {
                        const isLive = it.kind === 'event' && (() => { const ev = events.find(x => x.id === it.id); return ev ? getEventStatus(ev, now).state === 'live' : false; })();
                        if (isLive) {
                          return (
                            <span key={it.kind + '-' + it.id} className="relative inline-flex">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: it.color }} />
                              <span className="relative h-1.5 w-1.5 rounded-full" style={{ backgroundColor: it.color }} />
                            </span>
                          );
                        }
                        return (
                          <span
                            key={it.kind + '-' + it.id}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: it.color }}
                          />
                        );
                      })}
                      {items.length > 4 ? (
                        <span className="text-[9px] leading-none text-fg-dim">
                          +{items.length - 4}
                        </span>
                      ) : null}
                    </div>

                    {/* Large screens: item chips */}
                    <div className="pointer-events-auto hidden flex-col gap-0.5 lg:flex">
                      {items.slice(0, 3).map((it, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openItem(it);
                          }}
                          className="flex items-center gap-1 rounded-sm border-l-2 bg-raised px-1 py-0.5 text-left text-xs transition-opacity hover:opacity-80"
                          style={{ borderLeftColor: it.color }}
                        >
                          <span className="min-w-0 flex-1 truncate text-fg-mid">{it.title}</span>
                          {it.time && (
                            <span className="shrink-0 text-[10px] text-fg-dim">{it.time}</span>
                          )}
                        </button>
                      ))}
                      {items.length > 3 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dayParam.open(key);
                          }}
                          className="text-left text-[10px] text-fg-dim transition-colors hover:text-fg-mid"
                        >
                          +{items.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {upcoming.length === 0 ? (
            enabled.size === 0 || upcomingAll.length > upcoming.length ? (
              <EmptyState
                title="All categories hidden"
                subtitle="Some upcoming items are hidden. Toggle a category above to see them."
                action={{
                  label: "Show all",
                  onClick: () =>
                    setEnabled(new Set<CalKind>(["event", "project", "task", "poll"])),
                }}
              />
            ) : (
              <EmptyState
                title="Nothing upcoming"
                subtitle="No events, due dates, or poll closings scheduled from today onward."
                action={{
                  label: "Add event",
                  onClick: () => setEventDialog({ open: true, editing: null }),
                }}
              />
            )
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
          onClose={() => dayParam.close()}
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

      {/* EventDialog handles normal open, URL param, and empty-day click-to-create */}
      {newEventOpen || eventParam.value || createDay !== null ? (
        <EventDialog
          editing={editingEvent}
          defaultDate={createDay ?? selectedDay ?? undefined}
          onClose={() => {
            if (newEventOpen) setNewEventOpen(false);
            else if (createDay !== null) setCreateDay(null);
            else eventParam.close();
          }}
        />
      ) : projectParam.value ? (
        <ProjectDialog editing={editingProject} onClose={() => projectParam.close()} />
      ) : taskParam.value ? (
        <TaskDialog editing={editingTask} onClose={() => taskParam.close()} />
      ) : pollParam.value ? (
        <PollDialog editing={editingPoll} onClose={() => pollParam.close()} />
      ) : null}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarContent />
    </Suspense>
  );
}
