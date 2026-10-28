import * as api from "@/lib/beta/remote/api";
import { getRemoteContext, trackWrite } from "@/lib/beta/remote/context";
import { saveEvents } from "@/lib/beta/storage";
import { saveWithWarning } from "./persist";
import { AppSliceCreator, EventsSlice } from "./types";

// Remote writes for one event run in order, so an undo's re-insert can't
// overtake the delete it undoes.
const writeChains = new Map<string, Promise<void>>();

function chainWrite(id: string, write: () => Promise<void>): Promise<void> {
  const previous = writeChains.get(id);
  const next = previous ? previous.then(write, write) : Promise.resolve().then(write);
  writeChains.set(id, next);
  const release = () => {
    if (writeChains.get(id) === next) writeChains.delete(id);
  };
  next.then(release, release);
  return next;
}

function sendWrite(id: string, label: string, write: () => Promise<void>): void {
  void trackWrite(chainWrite(id, write), label);
}

export function resetEventWritesForTests(): void {
  writeChains.clear();
}

export function eventWriteChainCountForTests(): number {
  return writeChains.size;
}

export const createEventsSlice: AppSliceCreator<EventsSlice> = (set, get) => ({
  events: [],

  addEvent: (event) => {
    const ctx = getRemoteContext();
    const events = [...get().events, event];
    set({ events });
    saveWithWarning("events", saveEvents(events));
    if (ctx) sendWrite(event.id, "the event", () => api.insertEvent(event, ctx.teamId));
  },

  updateEvent: (event) => {
    const ctx = getRemoteContext();
    const current = get().events;
    const exists = current.some((item) => item.id === event.id);
    const events = current.map((item) => (item.id === event.id ? event : item));
    set({ events });
    saveWithWarning("events", saveEvents(events));
    if (ctx && exists) sendWrite(event.id, "the event", () => api.updateEvent(event));
  },

  // Sent to the server at once, so a future undo grace period must call this only once the delete is final.
  deleteEvent: (eventId) => {
    const ctx = getRemoteContext();
    const current = get().events;
    const events = current.filter((event) => event.id !== eventId);
    set({ events });
    saveWithWarning("events", saveEvents(events));
    if (ctx && events.length !== current.length) {
      sendWrite(eventId, "the event deletion", () => api.deleteEvent(eventId));
    }
  },
});
